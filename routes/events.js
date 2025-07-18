const { Router } = require('express');
const { validateEvent,validateFilter,validateCalification} = require('../schemas/event.js');
const {añadirNotificacion} = require('./notifications.js');
const cron = require('node-cron');
const moment = require('moment');

function getEventosPersonales(user, pool, callback) {
    if (user.rol === 'participante') {
        getEventosParticipante(user, pool, callback);
    } else {
        getEventosOrganizador(user, pool, callback);
    }
}
function getEventosParticipante(user, pool, callback) {
        let sql = `
        SELECT 
            eventos.*, 
            DATE_FORMAT(eventos.hora_ini, "%H:%i") as hora_ini, 
            DATE_FORMAT(eventos.hora_fin, "%H:%i") as hora_fin, 
            inscripciones.estado, 
            usuarios.nombre as organizador_nombre
        FROM 
            eventos
        JOIN 
            inscripciones ON eventos.id = inscripciones.evento_id
        JOIN 
            usuarios ON eventos.organizador_id = usuarios.id
        WHERE 
            inscripciones.usuario_id = ? AND inscripciones.activo = 1 AND eventos.activo = 1 
    `;
    sql += ' ORDER BY fecha DESC, hora_ini DESC';
    pool.getConnection((err, connection) => {
        if (err) {
            err.message = 'Error al obtener conexión de la base de datos para obtener eventos del participante.';
            return callback(err);
        }
        connection.query(sql, [user.id], (err, rows) => {
            connection.release();
            if (err) {
                err.message = 'Error al consultar eventos del participante en la base de datos.';
                return callback(err);
            }
            rows = rows.map(row => {
                row.estadoInscripcion = row.estado;
                const fecha = moment(row.fecha).format('YYYY-MM-DD'); 
                const fechaHoraFin = moment(`${fecha} ${row.hora_fin}`, 'YYYY-MM-DD HH:mm');
                row.terminado = moment().isAfter(fechaHoraFin);
                return row;
            });
            callback(null, rows);
        });
    });
}

function getEventosOrganizador(user, pool, callback) {
    let sql = 'SELECT eventos.*,   DATE_FORMAT(eventos.hora_ini, "%H:%i") as hora_ini, DATE_FORMAT(eventos.hora_fin, "%H:%i") as hora_fin  FROM eventos WHERE organizador_id=? AND activo = 1';
    sql += ' ORDER BY fecha DESC, hora_ini DESC';
    pool.getConnection((err, connection) => {
        if (err) {
            err.message = 'Error al obtener conexión de la base de datos para obtener eventos del organizador.';
            return callback(err);
        }
        connection.query(sql, [user.id], (err, rows) => {
            connection.release();
            if (err) {
                err.message = 'Error al consultar eventos del organizador en la base de datos.';
                return callback(err);
            }
            rows = rows.map(row => {
                row.organizador_nombre = user.nombre;
                const fecha = moment(row.fecha).format('YYYY-MM-DD'); 
                const fechaHoraFin = moment(`${fecha} ${row.hora_fin}`, 'YYYY-MM-DD HH:mm');
                row.terminado = moment().isAfter(fechaHoraFin);
                return row;
            });
            callback(null, rows);
        });
    });
}

function getEventos(query, pool, callback) {
    const { fecha, tipo, ubicacion, capacidad } = query;
        let sql = `
        SELECT 
            eventos.*, 
            DATE_FORMAT(eventos.hora_ini, "%H:%i") as hora_ini, 
            DATE_FORMAT(eventos.hora_fin, "%H:%i") as hora_fin, 
            usuarios.nombre as organizador_nombre 
        FROM 
            eventos 
        JOIN 
            usuarios 
        ON 
            eventos.organizador_id = usuarios.id 
        WHERE 
            1=1 AND eventos.activo = 1
    `;
    const params = [];

    if (fecha) {
        sql += ' AND DATE(fecha) = ?';
        params.push(fecha);
    }
    if (tipo) {
        sql += ' AND titulo LIKE ?';
        params.push(`%${tipo}%`);
    }
    if (ubicacion) {
        sql += ' AND ubicacion LIKE ?';
        params.push(`%${ubicacion}%`);
    }
    if (capacidad) {
        sql += ' AND capacidad_maxima >= ?';
        params.push(capacidad);
    }
    //ordeno por fecha y hora descendente
    sql += ' ORDER BY fecha DESC, hora_ini DESC';
    pool.getConnection((err, connection) => {
        if (err) {
            err.message = 'Error al obtener conexión de la base de datos para filtrar eventos.';
            return callback(err);
        }
        connection.query(sql, params, (err, rows) => {
            connection.release();
            if (err) {
                err.message = 'Error al consultar eventos en la base de datos.';
                return callback(err);
            }
            rows = rows.map(row => {
                const fecha = moment(row.fecha).format('YYYY-MM-DD'); 
                const fechaHoraFin = moment(`${fecha} ${row.hora_fin}`, 'YYYY-MM-DD HH:mm');
                row.terminado = moment().isAfter(fechaHoraFin);
                return row;
            });
            
            callback(null, rows);
        });
    });
}

//Funcion que comprueba si un evento se solapa con otro evento en la misma ubicacion y fecha
function solapan(connection,ubicacion,fecha,hora_ini,hora_fin,id, callback) {
    const sql = `
        SELECT * FROM eventos
        WHERE ubicacion = ? AND fecha = ? AND  hora_fin >= ? AND hora_ini <= ? AND activo = 1 AND id != ?
    `;  
    connection.query(sql, [ubicacion, fecha, hora_ini,hora_fin,id], (err, result) => {
   
        if (err) {
            return callback(err);
        }
        return callback(null, result);
    });
}
// Funcion que comprueba si hay hueco en un evento
function comprobarCapacidad(connection, evento_id, callback) {

    const sql = `
        SELECT COUNT(inscripciones.usuario_id) AS inscritos, eventos.capacidad_maxima 
        FROM Inscripciones 
        JOIN EVENTOS ON Inscripciones.evento_id = EVENTOS.id 
        WHERE EVENTOS.id = ? AND Inscripciones.estado = 'inscrito' AND Inscripciones.activo = 1
        GROUP BY eventos.capacidad_maxima
    `;
    
    connection.query(sql, [evento_id], (err, result) => {
        if (err) {
            return callback(err);
        }
       
        if (result.length === 0) {
            return callback(null, { hayEspacio: true, inscritos: 0, capacidadMaxima: 0 });
        }

        const { inscritos, capacidad_maxima } = result[0];
        return callback(null, {
            hayEspacio: inscritos < capacidad_maxima,
            inscritos,
            capacidadMaxima: capacidad_maxima
        });
    });
}

function createEventosRouter(pool, requireAuth, middlewareSession,requireParticipante,requireOrganizador) {
    const router = Router();
    
    router.use(requireAuth);
    router.use(middlewareSession);
    
    // Ruta para obtener todos los eventos personales
    router.get('/filter',validateFilter, (req, res, next) => {
        getEventos(req.query, pool, (err, eventos) => {
            if (err) {
                
                err.message = 'Error al filtrar eventos.';
                err.status = 500;
                return next(err);
            }
            getEventosPersonales(req.session.user, pool, (err, eventosPersonales) => {
                if (err) {
                    err.message = 'Error al obtener eventos personales para el usuario.';
                    err.status = 500;
                    return next(err);
                }
                eventos = eventos.map(evento => {
                    const inscripcion = eventosPersonales.find(e => e.id === evento.id);
                    if (inscripcion) {
                        evento.estadoInscripcion = inscripcion.estado;
                    } else {
                        evento.estadoInscripcion = null;
                    }
                    return evento;
                });
                
                res.status(200).json(eventos);
            });
        });
    });
    //ruta para obtener los eventos personales 
    router.get('/personales', (req, res, next) => {
        getEventosPersonales(req.session.user, pool, (err, eventos) => {
            if (err) {
                err.message = 'Error al obtener eventos personales para el usuario.';
                err.status = 500;
                return next(err);
            }
            res.status(200).json(eventos);
        });
    });
    // Ruta para crear un evento
    router.post('/crear', requireOrganizador,validateEvent ,(req, res, next) => {
        const { titulo, descripcion, fecha, hora_ini,hora_fin, ubicacion, capacidad_maxima} = req.body;
        const sql = 'INSERT INTO eventos(titulo, descripcion, fecha, hora_ini,hora_fin, ubicacion, capacidad_maxima, organizador_id) VALUES(?, ?, ?, ?,?, ?, ?, ?)';
        pool.getConnection((err, connection) => {
            if (err) {
                err.message = 'Error al obtener conexión de la base de datos para crear evento.';
                return next(err);
            }
            solapan(connection,ubicacion,fecha,hora_ini,hora_fin,-1, (err, result) => {
                if (err) {
                    err.status = 500;
                    err.message = 'Error al comprobar si se solapan los eventos.';
                    return next(err);    
                }

                if (result.length > 0) {
                    connection.release();
                    return res.status(400).json({ success:false, message:'Ya hay un evento programado en esa ubicación y fecha.' });
                }


                connection.query(sql, [titulo, descripcion, fecha, hora_ini,hora_fin, ubicacion, capacidad_maxima, req.session.user.id], (err, result) => {
                    connection.release();
                    if (err) {
                        err.message = 'Error al crear evento en la base de datos.';
                        return next(err);
                    }
                    res.status(200).json({ id: result.insertId });
                });
            });
        });
    });

    function usuariosInscritos(connection, evento_id, callback) {
        const sql = 'SELECT usuario_id, estado,fecha_inscripcion FROM inscripciones WHERE evento_id=? AND activo = 1 ORDER BY fecha_inscripcion ASC';
        connection.query(sql, [ evento_id], (err, result) => {
            if (err) {
                return callback(err);
            }
        
            return callback(null, result);
        });
    }
    

    function notificarTodosLosParticipantes(connection, usuarios,mensaje,id, fecha, callback) {
        usuarios.forEach(usuario_id => {
            añadirNotificacion(connection, usuario_id, mensaje, fecha, (err) => {
                if (err) {
                    err.message = 'Error al eliminar evento en la base de datos.';
                    return callback(err);
                }
            });
        });
        return callback(null);
    }
    function desinscribirUsuarios(connection, usuarios, callback) {
        const sql = 'UPDATE inscripciones SET activo = 0 WHERE usuario_id=?';
        usuarios.forEach(usuario_id => {
            connection.query(sql, [usuario_id], (err, result) => {
                if (err) {
                    return callback(err);
                }
            });
        });
        return callback(null);
    }
    // Ruta para borrar un evento
    router.patch('/:id',requireOrganizador, (req, res, next) => {
        const sql = 'UPDATE eventos SET activo = 0 WHERE id=?';
        pool.getConnection((err, connection) => {
            if (err) {
                err.message = 'Error al obtener conexión de la base de datos para eliminar evento.';
                return next(err);
            }
          
            connection.query('SELECT * FROM eventos WHERE id = ?', [id], (err, result) => {
                if (err) {
                    connection.release();
                    err.message = 'Error al obtener el evento de la base de datos.';
                    return next(err);
                }
                if (result.length === 0) {
                    connection.release();
                    return res.status(404).json({ success:false, message:'Evento no encontrado.' });
                }
                const anterior = result[0];
                let usuarios;
                
                usuariosInscritos(connection, req.params.id, (err, result) => {
                    if (err) {
                        connection.release();
                        return next(err);
                    }
                    usuarios = result.map(row => row.usuario_id);
                    connection.query(sql, [req.params.id], (err, result) => {
                        if (err) {
                            connection.release();
                            err.message = 'Error al eliminar evento en la base de datos.';
                            return next(err);
                        }
                        //consigo el nombre del evento
                        connection.query('SELECT titulo FROM eventos WHERE id = ?', [req.params.id], (err, result) => {
                            if (err) {
                                connection.release();
                                err.message = 'Error al obtener el nombre del evento.';
                                return next(err);
                            }
                            const mensaje = `El organizador ha eliminado el evento " ${result[0].titulo}" `;
                            const fecha = moment().format('YYYY-MM-DD HH:mm:ss');
                            notificarTodosLosParticipantes(connection, usuarios, mensaje, req.params.id, fecha, (err) => {
                                desinscribirUsuarios(connection, usuarios, (err) => {
                                    connection.release();
                                    if (err) {
                                        return next(err);
                                    }
                                    res.status(200).json({ success: true });
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    // Ruta para editar un evento
    router.put('/:id', requireOrganizador,validateEvent, (req, res, next) => {
        const { titulo, descripcion, fecha, hora_ini,hora_fin, ubicacion, capacidad_maxima} = req.body;
        const id = req.params.id;
        
        const sql = 'UPDATE eventos SET titulo=?, descripcion=?, fecha=?, hora_ini=?,hora_fin=?, ubicacion=?, capacidad_maxima=? WHERE id=?';
        pool.getConnection((err, connection) => {
            if (err) {
                err.message = 'Error al obtener conexión de la base de datos para actualizar evento.';
                return next(err);
            }
            let usuarios;
            //compruebo si el id existe
            connection.query('SELECT * FROM eventos WHERE id = ?', [id], (err, result) => {
                if (err) {
                    connection.release();
                    err.message = 'Error al obtener el evento de la base de datos.';
                    return next(err);
                }
                if (result.length === 0) {
                    connection.release();
                    return res.status(404).json({ success:false, message:'Evento no encontrado.' });
                }
                const anterior = result[0];
                usuariosInscritos(connection, id, (err, result) => { 
                    if (err) {
                        connection.release();
                        return next(err);
                    }
                    usuarios = result;
                    const contadorInscritos = usuarios.filter(user => user.estado === 'inscrito').length;
                    if(contadorInscritos >capacidad_maxima){
                        connection.release();
                        return res.status(400).json({ success:false, message:`No se puede reducir la capacidad del evento ya que hay ${usuarios.length} participantes.`});
                    }
                    else if(contadorInscritos < capacidad_maxima){
                
                        const enEspera = usuarios.filter(user => user.estado === 'lista de espera').sort((a, b) => new Date(a.fecha_inscripcion) - new Date(b.fecha_inscripcion));
                        const porInscribir = capacidad_maxima - contadorInscritos;
                        
                        for(let i = 0; i < porInscribir && i < enEspera.length; i++){
                        
                            const inscribir = 'UPDATE inscripciones SET estado = "inscrito" WHERE usuario_id=? AND evento_id=?';
                        
                            connection.query(inscribir, [enEspera[i].usuario_id, id], (err, result) => {
                                if (err) {
                                    connection.release();
                                    err.message = 'Error al inscribir a los usuarios en la base de datos.';
                                    return next(err);
                                }
                                añadirNotificacion(connection, enEspera[i].usuario_id, `Se te ha añadido automaticamente al evento "${anterior.titulo}", ya que se ha ampliado su capacidad`, moment().format('YYYY-MM-DD HH:mm:ss'), (err) => {
                                    if (err) {
                                        connection.release();
                                        err.message = 'Error al añadir notificación en la base de datos.';
                                        return next(err);
                                    }
                                });
                            });
                        }
                    }
                    solapan(connection,ubicacion,fecha,hora_ini,hora_fin,id, (err, result) => {
                        if (err) {
                            err.message = 'Error al comprobar si se solapan los eventos.';
                            return next(err);
                        }
                        if (result.length > 0) {
                            connection.release();
                            return res.status(400).json({ success:false, message:'Ya hay un evento programado en esa ubicación y fecha.' });
                        }
                        connection.query(sql, [titulo, descripcion, fecha, hora_ini,hora_fin, ubicacion, capacidad_maxima, id], (err, result) => {
                            
                            if (err) {
                                err.message = 'Error al actualizar evento en la base de datos.';
                                return next(err);
                            }
                            const mensaje = `El organizador ha modificado el evento "${anterior.titulo}"`;
                            const fecha = moment().format('YYYY-MM-DD HH:mm:ss');
                            usuarios = usuarios.map(row => row.usuario_id);
                            
                            notificarTodosLosParticipantes(connection, usuarios, mensaje, req.params.id, fecha, (err) => {
                                connection.release();
                                if (err) {
                                    return next(err);
                                }
                                res.status(200).json({ success: true });
                            });
                        });
                    });
                
                });
            });
        });
    });
    
    router.get('/:id/participantes',requireOrganizador, (req, res, next) => {
        const { id } = req.params;
        const sql = `
            SELECT usuarios.nombre, usuarios.telefono, usuarios.email, facultades.nombre AS facultad,inscripciones.estado
            FROM inscripciones
            JOIN usuarios ON inscripciones.usuario_id = usuarios.id
            JOIN facultades ON usuarios.facultad_id = facultades.id
            WHERE inscripciones.evento_id = ? AND inscripciones.activo = 1
        `;
        pool.getConnection((err, connection) => {
            if (err) {
                err.message = 'Error al obtener conexión de la base de datos para obtener participantes.';
                return next(err);
            }
            //compruebo si el id existe
            connection.query('SELECT * FROM eventos WHERE id = ?', [id], (err, result) => {
                if (err) {
                    connection.release();
                    err.message = 'Error al obtener el evento de la base de datos.';
                    return next(err);
                }
                if (result.length === 0) {
                    connection.release();
                    return res.status(404).json({ success:false, message:'Evento no encontrado.' });
                }
                connection.query(sql, [id], (err, rows) => {
                    connection.release();
                    if (err) {
                        err.message = 'Error al consultar participantes en la base de datos.';
                        return next(err);
                    }
                    res.status(200).json({ participantes: rows });
                });
            });
        });
    });
    
    router.get('/:id/calificaciones', (req, res, next) => {
        const { id } = req.params;
        // Consulta para obtener los nombres y correos de los usuarios que han calificado el evento
        const sql = `
            SELECT usuarios.nombre, usuarios.email, calificaciones.calificacion, calificaciones.comentario
            FROM calificaciones
            JOIN usuarios ON calificaciones.usuario_id = usuarios.id
            WHERE calificaciones.evento_id = ?
        `;

        pool.getConnection((err, connection) => {
            if (err) {
                err.message = 'Error al obtener conexión de la base de datos para obtener calificaciones.';
                return next(err);
            }
            //compruebo si el evento existe
            connection.query('SELECT * FROM eventos WHERE id = ?', [id], (err, result) => {
                if (err) {
                    connection.release();
                    err.message = 'Error al obtener el evento de la base de datos.';
                    return next(err);
                }
                if (result.length === 0) {
                    connection.release();
                    return res.status(404).json({ success:false, message:'Evento no encontrado.' });
                }
                connection.query(sql, [id], (err, rows) => {
                    connection.release();
                    if (err) {
                        err.message = 'Error al consultar calificaciones en la base de datos.';
                        return next(err);
                    }
                    res.status(200).json({ calificaciones: rows });
                });
            });
        });
    });
    
    router.post('/calificacion', requireParticipante, validateCalification,(req, res, next) => {
        const { eventId, calificacion, comentario } = req.body;
        const sql = 'INSERT INTO calificaciones(usuario_id, evento_id, calificacion, comentario) VALUES(?, ?, ?, ?)';
        pool.getConnection((err, connection) => {
            if (err) {
                err.message = 'Error al obtener conexión de la base de datos para calificar evento.';
                return next(err);
            }
            connection.query('SELECT * FROM eventos WHERE id = ?', [eventId], (err, result) => {
                if (err) {
                    connection.release();
                    err.message = 'Error al obtener el evento de la base de datos.';
                    return next(err);
                }
                if (result.length === 0) {
                    connection.release();
                    return res.status(404).json({ success:false, message:'Evento no encontrado.' });
                }
                connection.query(sql, [req.session.user.id, eventId, calificacion, comentario], (err, result) => {
                    connection.release();
                    if (err) {
                        err.message = 'Error al calificar evento en la base de datos.';
                        return next(err);
                    }
                    res.status(200).json({ success: true, message: 'Evento calificado exitosamente' });
                });
            });
        });
    });

    function enviarNotificaciones() {
        let hoy = new Date().toISOString().split('T')[0]; // Obtener la fecha de hoy en formato YYYY-MM-DD
        const query = `
            SELECT u.id
            FROM usuarios u
            JOIN inscripciones i ON u.id = i.usuario_id
            JOIN eventos e ON i.evento_id = e.id
            WHERE e.fecha = ?
        `;
        pool.getConnection((err, connection) => {
            connection.query(query, [hoy], (err, results) => {
                if (err) {
                    console.error('Error al obtener los eventos del día:', err);
                    return;
                }
                if (results.length === 0) {
                   // no hay usuarios inscritos en eventos de hoy
                    return;
                }
                const usuarios = results.map(row => row.id);
                connection.query('SELECT * FROM eventos WHERE fecha = ?', [hoy], (err, results) => {
                    let mensaje = 'Hoy tienes los siguientes eventos programados: ';
                    const eventos = results.map(row => row.titulo).join(', ');
                    mensaje += eventos;
                    mensaje += '.';
                    hoy = moment().format('YYYY-MM-DD HH:mm:ss');
                    usuarios.forEach(usuario_id => {
                        añadirNotificacion(connection, usuario_id, mensaje, hoy, (err) => {
                            connection.release();
                            if (err) {
                                err.message = 'Error al eliminar evento en la base de datos.';
                                return callback(err);
                            }
                        });
                    });
                });
                
            });
        });
    }
    
    // Programar la tarea para que se ejecute todos los días a las 8:00 AM
    cron.schedule('0 8 * * *', () => {
        enviarNotificaciones();
    });

    return router;
}

module.exports = {
    createEventosRouter,
    getEventos,
    getEventosPersonales,
    comprobarCapacidad,
};
