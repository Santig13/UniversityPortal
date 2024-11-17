const { Router } = require('express');
const { validateEvent } = require('../schemas/event.js');
const {añadirNotificacion} = require('./notifications.js');
const moment = require('moment');

function getEventosPersonales(user, pool, callback) {
    if (user.rol === 'participante') {
        getEventosParticipante(user, pool, callback);
    } else {
        getEventosOrganizador(user, pool, callback);
    }
}
function getEventosParticipante(user, pool, callback) {
     const sql = `
        SELECT eventos.*, inscripciones.estado
        FROM eventos
        JOIN inscripciones ON eventos.id = inscripciones.evento_id
        WHERE inscripciones.usuario_id = ?
    `;
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
            callback(null, rows);
        });
    });
}

function getEventosOrganizador(user, pool, callback) {
    const sql = 'SELECT * FROM eventos WHERE organizador_id=?';
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
            callback(null, rows);
        });
    });
}

function getEventos(query, pool, callback) {
    const { fecha, tipo, ubicacion, capacidad } = query;
    let sql = 'SELECT *, DATE_FORMAT(hora, "%H:%i") as hora FROM eventos WHERE 1=1';
    const params = [];

    if (fecha) {
        sql += ' AND DATE(fecha) = ?';
        params.push(fecha);
    }
    if (tipo) {
        sql += ' AND tipo LIKE ?';
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
            callback(null, rows);
        });
    });
}

// Funcion que comprueba si hay hueco en un evento
function comprobarCapacidad(connection, evento_id, callback) {

    const sql = `
        SELECT COUNT(inscripciones.usuario_id) AS inscritos, eventos.capacidad_maxima 
        FROM Inscripciones 
        JOIN EVENTOS ON Inscripciones.evento_id = EVENTOS.id 
        WHERE EVENTOS.id = ? 
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

function createEventosRouter(pool, requireAuth, middlewareSession) {
    const router = Router();
    
    router.use(requireAuth);
    router.use(middlewareSession);
    
    // Ruta para obtener todos los eventos personales
    router.get('/filter', requireAuth, (req, res, next) => {
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

    // Ruta para crear un evento
    router.post('/crear', requireAuth, validateEvent ,(req, res, next) => {
        const { titulo, descripcion, fecha, hora, ubicacion, capacidad_maxima} = req.body;
        const sql = 'INSERT INTO eventos(titulo, descripcion, fecha, hora, ubicacion, capacidad_maxima, organizador_id) VALUES(?, ?, ?, ?, ?, ?, ?)';
        pool.getConnection((err, connection) => {
            if (err) {
                err.message = 'Error al obtener conexión de la base de datos para crear evento.';
                return next(err);
            }
            connection.query(sql, [titulo, descripcion, fecha, hora, ubicacion, capacidad_maxima, req.session.user.id], (err, result) => {
                connection.release();
                if (err) {
                    err.message = 'Error al crear evento en la base de datos.';
                    return next(err);
                }
                res.status(200).json({ id: result.insertId });
            });
        });
    });

    function usuariosInscritos(connection, evento_id, callback) {
        const sql = 'SELECT usuario_id FROM inscripciones WHERE evento_id=?';
        connection.query(sql, [ evento_id], (err, result) => {
            if (err) {
                return callback(err);
            }
            const usuarios = result.map(row => row.usuario_id);
            return callback(null, usuarios);
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
    }

    // Ruta para borrar un evento
    router.delete('/:id', requireAuth, (req, res, next) => {
        const sql = 'DELETE FROM eventos WHERE id=?';
        pool.getConnection((err, connection) => {
            if (err) {
                err.message = 'Error al obtener conexión de la base de datos para eliminar evento.';
                return next(err);
            }
           
            let usuarios;
            usuariosInscritos(connection, req.params.id, (err, result) => {
                if (err) {
                    connection.release();
                    return next(err);
                }
               
                usuarios = result;
            
                connection.query(sql, [req.params.id], (err, result) => {
                    if (err) {
                        connection.release();
                        err.message = 'Error al eliminar evento en la base de datos.';
                        return next(err);
                    }
                    const mensaje = `El organizador ha eliminado el evento con id ${req.params.id}`;
                    const fecha = moment().format('YYYY-MM-DD HH:mm:ss');

                    notificarTodosLosParticipantes(connection, usuarios, mensaje, req.params.id, fecha, (err) => {
                        connection.release();
                        if (err) {
                            return next(err);
                        }
                    });
                    
                });
                res.status(200).json({ success: true });
            });
        });
    });

    // Ruta para editar un evento
    router.put('/:id', requireAuth, validateEvent, (req, res, next) => {
        const { titulo, descripcion, fecha, hora, ubicacion, capacidad_maxima} = req.body;
        const id = req.params.id;
        const sql = 'UPDATE eventos SET titulo=?, descripcion=?, fecha=?, hora=?, ubicacion=?, capacidad_maxima=? WHERE id=?';
        console.log(req.body);
        pool.getConnection((err, connection) => {
            if (err) {
                err.message = 'Error al obtener conexión de la base de datos para actualizar evento.';
                return next(err);
            }
            let usuarios;
            usuariosInscritos(connection, id, (err, result) => {
                if (err) {
                    connection.release();
                    return next(err);
                }
                usuarios = result;
            
                connection.query(sql, [titulo, descripcion, fecha, hora, ubicacion, capacidad_maxima, id], (err, result) => {
                    connection.release();
                    if (err) {
                        err.message = 'Error al actualizar evento en la base de datos.';
                        return next(err);
                    }
                    const mensaje = `El organizador ha modificado el evento con id ${id}`;
                    const fecha = moment().format('YYYY-MM-DD HH:mm:ss');
                    
                    notificarTodosLosParticipantes(connection, usuarios, mensaje, req.params.id, fecha, (err) => {
                        connection.release();
                        if (err) {
                            return next(err);
                        }
                        
                    });
                });
                res.status(200).json({ success: true });
            });
        });
    });
    
    router.get('/:id/participantes', (req, res, next) => {
        const { id } = req.params;
        const sql = `
            SELECT usuarios.nombre, usuarios.telefono, usuarios.email, facultades.nombre AS facultad
            FROM inscripciones
            JOIN usuarios ON inscripciones.usuario_id = usuarios.id
            JOIN facultades ON usuarios.facultad_id = facultades.id
            WHERE inscripciones.evento_id = ?
        `;
        pool.getConnection((err, connection) => {
            if (err) {
                err.message = 'Error al obtener conexión de la base de datos para obtener participantes.';
                return next(err);
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

    return router;
}

module.exports = {
    createEventosRouter,
    getEventos,
    getEventosPersonales,
    comprobarCapacidad,
};
