"use strict";
const { Router } = require('express');
const { getEventosPersonales } = require('./events');
const {añadirNotificacion} = require('./notifications');
const {comprobarCapacidad} = require('./events');
const bcrypt = require('bcrypt');
const moment = require('moment');
const { validateUserProfile,validateAccesibilidad} = require('../schemas/users');

function createUsuariosRouter(pool, requireAuth, middlewareSession,requireParticipante, requireOrganizador) {
    const router = Router();
    router.use(requireAuth);
    router.use(middlewareSession);

   
    // Inscribir usuario en un evento
    router.post('/inscribir', requireParticipante, (req, res, next) => {
        const { userId, eventId, organizador_id } = req.body;
        const fecha_inscripcion = moment().format('YYYY-MM-DD');
        const queryInsert = 'INSERT INTO inscripciones (usuario_id, evento_id, estado, fecha_inscripcion, activo) VALUES (?, ?, ?, ?, ?)';
        const queryUpdate = 'UPDATE inscripciones SET estado = ?, fecha_inscripcion = ?, activo = ? WHERE usuario_id = ? AND evento_id = ?';
        const queryCheck = 'SELECT * FROM inscripciones WHERE usuario_id = ? AND evento_id = ?';
        const queryConflict = `
            SELECT * FROM inscripciones i
            JOIN eventos e ON i.evento_id = e.id
            WHERE i.usuario_id = ? AND i.activo = TRUE AND e.activo = 1 
            AND e.fecha = (SELECT fecha FROM eventos WHERE id = ?)
            AND e.hora_fin >= (SELECT hora_ini FROM eventos WHERE id = ?) 
            AND e.hora_ini <= (SELECT hora_fin FROM eventos WHERE id = ?)
        `;
        
        pool.getConnection((err, connection) => {
            if (err) {
                err.message = 'Error al obtener conexión de la base de datos para inscribir usuario en evento';
                return next(err);
            }
            //verifico que el evento exista
            connection.query('SELECT * FROM eventos WHERE id = ?', [eventId], (error, results) => {
                if (err) {
                    connection.release();
                    err.message = 'Error al obtener el evento de la base de datos.';
                    return next(err);
                }
                if (results.length === 0) {
                    connection.release();
                    return res.status(404).json({ success:false, message:'Evento no encontrado.' });
                }
                const anterior=results[0];
                let message = 'Te has inscrito en el evento';
                let mensaje = `Te has inscrito en el evento "${anterior.titulo}"`;
                let estado = "inscrito";
                let mensaje2 = `El usuario ${req.session.user.email} se ha inscrito a su evento "${anterior.titulo}"`;
               
                // Verificar conflictos de horario
                connection.query(queryConflict, [userId, eventId, eventId,eventId], (error, results) => {
                    if (error) {
                        connection.release();
                        error.message = 'Error verificando conflictos de horario';
                        error.status = 500;
                        return next(error);
                    }
        
                    if (results.length > 0) {
                        connection.release();
                        return res.status(200).send({ success: false, message: 'Ya estás inscrito en otro evento que se solapa con este.' });
                    }
                   
                    comprobarCapacidad(connection, eventId, (err, resultado) => {
                        if (err) {
                            connection.release();
                            return next(err);
                        }
        
                        // Si no hay espacio, cambia el estado de la inscripción y los mensajes
                        if (!resultado.hayEspacio) {
                            message = 'Se te ha añadido a la lista de espera';
                            mensaje = `Te has añadido a la lista de espera del evento "${anterior.titulo}"`;
                            estado = "lista de espera";
                            mensaje2 = `El usuario ${req.session.user.email} se ha añadido a la lista de espera de su evento "${anterior.titulo}"`;
                        }
        
                        connection.query(queryCheck, [userId, eventId], (error, results) => {
                            if (error) {
                                connection.release();
                                error.message = 'Error verificando la inscripción del usuario en el evento';
                                error.status = 500;
                                return next(error);
                            }
        
                            if (results.length > 0) {
                                // Si ya existe una inscripción, actualizarla
                                connection.query(queryUpdate, [estado, fecha_inscripcion, true, userId, eventId], (error, results) => {
                                    if (error) {
                                        connection.release();
                                        error.message = 'Error actualizando la inscripción del usuario en el evento';
                                        error.status = 500;
                                        return next(error);
                                    }
                                    const fecha = moment().format('YYYY-MM-DD HH:mm:ss');
                                    añadirNotificacion(connection, userId, mensaje, fecha, (err) => {
                                        if (err) {
                                            connection.release();
                                            return next(err);
                                        }
                                        añadirNotificacion(connection, organizador_id, mensaje2, fecha, (err) => {
                                            connection.release();
                                            if (err) {
                                                return next(err);
                                            }
        
                                            res.status(200).send({ success: true, message: message });
                                        });
                                    });
                                });
                            } else {
                                // Si no existe una inscripción, crear una nueva
                                connection.query(queryInsert, [userId, eventId, estado, fecha_inscripcion, true], (error, results) => {
                                    if (error) {
                                        connection.release();
                                        error.message = 'Error inscribiendo al usuario en el evento';
                                        error.status = 500;
                                        return next(error);
                                    }
                                    const fecha = moment().format('YYYY-MM-DD HH:mm:ss');
                                    añadirNotificacion(connection, userId, mensaje, fecha, (err) => {
                                        if (err) {
                                            connection.release();
                                            return next(err);
                                        }
                                        añadirNotificacion(connection, organizador_id, mensaje2, fecha, (err) => {
                                            connection.release();
                                            if (err) {
                                                return next(err);
                                            }
        
                                            res.status(200).send({ success: true, message: message });
                                        });
                                    });
                                });
                            }
                        });
                    });
                });
            });
        });
    });
       // Desinscribir usuario de la lista de espera de un evento
    router.patch('/abandonar',requireParticipante, (req, res, next) => {
        const { userId, eventId, organizador_id } = req.body;
        const queryUpdate = 'UPDATE inscripciones SET estado = ?, fecha_inscripcion = ?, activo = ? WHERE usuario_id = ? AND evento_id = ?';
        
        pool.getConnection((err, connection) => {
            if (err) {
                err.message = 'Error al obtener conexión de la base de datos para desinscribir usuario de evento';
                return next(err);
            }
            //verifico que el evento exista
            connection.query('SELECT * FROM eventos WHERE id = ?', [eventId], (error, results) => {
                if (err) {
                    connection.release();
                    err.message = 'Error al obtener el evento de la base de datos.';
                    return next(err);
                }
                if (results.length === 0) {
                    connection.release();
                    return res.status(404).json({ success:false, message:'Evento no encontrado.' });
                }
                const evento = results[0];
                connection.query(queryUpdate, ['desinscrito', moment().format('YYYY-MM-DD'), false, userId, eventId], (error, results) => {
                    if (error) {
                        connection.release();
                        error.message = 'Error desinscribiendo al usuario del evento';
                        error.status = 500;
                        return next(error);
                    }
                    const mensaje = `Has abandonado la lista de espera del evento "${evento.titulo}"`;
                    const fecha = moment().format('YYYY-MM-DD HH:mm:ss');
                    añadirNotificacion(connection, userId, mensaje, fecha, (err) => {
                        if (err) {
                            connection.release();
                            return next(err);
                        }
                        const mensaje2 = `El usuario con id ${req.session.user.email} ha abandonado la lista de espera de su evento "${evento.titulo}"`;
                        añadirNotificacion(connection, organizador_id, mensaje2, fecha, (err) => {
                            connection.release();
                            if (err) {
                                return next(err);
                            }
                            res.status(200).send({ success: true, message: 'Has abandonado la lista de espera del evento' });
                        });
                    });
                });
            });
        });
    });
    //Ruta para obtener los ajustes de accesibilidad del usuario
    router.get('/:id/accesibilidad', (req, res, next) => {
        const userId = req.params.id;
        pool.query('SELECT * FROM accesibilidades WHERE id = (SELECT accesibilidad_id FROM usuarios WHERE id = ?)', [userId], (error, results) => {
            if (error) {
                error.message = 'Error recuperando los ajustes de accesibilidad del usuario';
                error.status = 500;
                return next(error);
            }
            res.status(200).json(results[0]);
        });
    });
    

    //Modifico los ajustes de accesibilidad del usuario
       router.put('/:id/accesibilidad', validateAccesibilidad, (req, res, next) => {
        const { fontSize, navigation, theme } = req.body;
    
        // Si el usuario tiene la accesibilidad por defecto se le modifica la actual
        if (req.session.user.accesibilidad_id != 1) {
            pool.query('UPDATE accesibilidades SET navegacion = ?, tamañoTexto = ?, paleta = ? WHERE id = ?', [ navigation,fontSize, theme, req.session.user.accesibilidad_id], (error, results) => {
                if (error) {
                    error.message = 'Error actualizando los ajustes de accesibilidad del usuario';
                    error.status = 500;
                    return next(error);
                }
                // Actualizamos la sesión del usuario con la nueva configuración
                req.session.user.accesibilidad = {
                    id: req.session.user.accesibilidad_id,
                    paleta: theme,
                    tamañoTexto: fontSize,
                    navegacion: navigation
                };
                res.status(200).send('ok');
            });
        } else { // Creamos una configuración de accesibilidad nueva
            pool.query('INSERT INTO accesibilidades (navegacion, tamañoTexto, paleta) VALUES (?, ?, ?)', [ navigation,fontSize, theme], (error, results) => {
                if (error) {
                    error.message = 'Error creando la configuración de accesibilidad';
                    error.status = 500;
                    return next(error);
                }
                // Actualizamos la sesión del usuario con la nueva configuración
                req.session.user.accesibilidad_id = results.insertId;
                req.session.user.accesibilidad = {
                    id: results.insertId,
                    paleta: theme,
                    tamañoTexto: fontSize,
                    navegacion: navigation
                };
                pool.query('UPDATE usuarios SET accesibilidad_id = ? WHERE id = ?', [results.insertId, req.params.id], (error, results) => {
                    if (error) {
                        error.message = 'Error actualizando los ajustes de accesibilidad del usuario';
                        error.status = 500;
                        return next(error);
                    }
                    res.status(200).send('ok');
                });
            });
        }
    });
    // Desinscribir usuario de un evento
       router.patch('/desinscribir', requireParticipante, (req, res, next) => {
        const { userId, eventId, organizador_id } = req.body;
        const queryUpdate = 'UPDATE inscripciones SET estado = ?, fecha_inscripcion = ?, activo = ? WHERE usuario_id = ? AND evento_id = ?';
        const queryWaitlist = 'SELECT * FROM inscripciones WHERE evento_id = ? AND estado = ? ORDER BY fecha_inscripcion ASC LIMIT 1';
        const queryUpdateWaitlist = 'UPDATE inscripciones SET estado = ?, fecha_inscripcion = ?, activo = ? WHERE usuario_id = ? AND evento_id = ?';
    
        pool.getConnection((err, connection) => {
            if (err) {
                err.message = 'Error al obtener conexión de la base de datos para desinscribir usuario de evento';
                return next(err);
            }
            //verifico que el evento exista
            connection.query('SELECT * FROM eventos WHERE id = ?', [eventId], (error, results) => {
                if (err) {
                    connection.release();
                    err.message = 'Error al obtener el evento de la base de datos.';
                    return next(err);
                }
                if (results.length === 0) {
                    connection.release();
                    return res.status(404).json({ success:false, message:'Evento no encontrado.' });
                }
                const evento = results[0];
                connection.query(queryUpdate, ['desinscrito', moment().format('YYYY-MM-DD'), false, userId, eventId], (error, results) => {
                    if (error) {
                        connection.release();
                        error.message = 'Error desinscribiendo al usuario del evento';
                        error.status = 500;
                        return next(error);
                    }
                    const mensaje = `Te has desinscrito del evento "${evento.titulo}"`;
                    const fecha = moment().format('YYYY-MM-DD HH:mm:ss');
                    añadirNotificacion(connection, userId, mensaje, fecha, (err) => {
                        if (err) {
                            connection.release();
                            return next(err);
                        }
                        const mensaje2 = `El usuario ${req.session.user.email} se ha desinscrito de su evento "${evento.titulo}"`;
                        añadirNotificacion(connection, organizador_id, mensaje2, fecha, (err) => {
                            if (err) {
                                connection.release();
                                return next(err);
                            }
        
                            // Buscar el usuario en la lista de espera que lleva más tiempo
                            connection.query(queryWaitlist, [eventId, 'lista de espera'], (error, results) => {
                                if (error) {
                                    connection.release();
                                    error.message = 'Error buscando en la lista de espera';
                                    error.status = 500;
                                    return next(error);
                                }
        
                                if (results.length > 0) {
                                    const waitlistUser = results[0];
                                    // Actualizar el estado del usuario en la lista de espera a "inscrito"
                                    connection.query(queryUpdateWaitlist, ['inscrito', moment().format('YYYY-MM-DD'), true, waitlistUser.usuario_id, eventId], (error, results) => {
                                        if (error) {
                                            connection.release();
                                            error.message = 'Error actualizando el estado del usuario en la lista de espera';
                                            error.status = 500;
                                            return next(error);
                                        }
                                        const mensaje3 = `Has sido inscrito en el evento "${evento.titulo}" desde la lista de espera`;
                                        añadirNotificacion(connection, waitlistUser.usuario_id, mensaje3, fecha, (err) => {
                                            connection.release();
                                            if (err) {
                                                return next(err);
                                            }
                                            res.status(200).send({ success: true, message: 'Te has desinscrito del evento y el siguiente usuario en la lista de espera ha sido inscrito' });
                                        });
                                    });
                                } else {
                                    connection.release();
                                    res.status(200).send({ success: true, message: 'Te has desinscrito del evento' });
                                }
                            });
                        });
                    });
                });
            });
        });
    });

    // Listar eventos en los que el usuario está inscrito
    router.get('/:userId/eventos',requireParticipante, (req, res, next) => {
        const { userId } = req.params;
        const query = 'SELECT * FROM EVENTOS WHERE id IN (SELECT evento_id FROM Inscripciones WHERE usuario_id = ?)';
        pool.query(query, [userId], (error, results) => {
            if (error) {
                error.message = 'Error recuperando eventos del usuario';
                error.status = 500;
                return next(err);
            }
            res.status(200).json(results);
        });
    });

    router.put('/:userId/actualizar', validateUserProfile, async (req, res, next) => {
        const {userId} = req.params;
        const {nombre, telefonoCompleto, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const query = 'UPDATE usuarios SET nombre = ?, telefono = ?, password = ? WHERE id = ?';
        pool.query(query, [nombre, telefonoCompleto, hashedPassword, userId], (error, results) => {
            if (error) {
                error.message = 'Error actualizando los datos del usuario';
                error.status = 500;
                return next(error);
            }
            res.status(200).send('ok');
        });
    });

    
    // Navegación a la página de usuario personal con sus eventos
    router.get('/:id', (req, res, next) => {
        getEventosPersonales(req.session.user, pool, (err, eventos) => {
            if (err) {
                err.message = 'Error al recuperar los eventos personales.';
                err.status = 500;
                return next(err);
            }
            res.render('usuario', { user: req.session.user, eventos });
        });
    });

    // Ruta para obtener los datos del usuario
    router.get('/:id/datos', (req, res, next) => {
        const userId = req.params.id;
       pool.query('SELECT * FROM usuarios WHERE id = ?', [userId], (error, results) => {
            if (error) {
                error.message = 'Error recuperando los datos del usuario';
                error.status = 500;
                return next(error);
            }
            res.status(200).json(results[0]);
        });
    });

    return router;
}


module.exports = createUsuariosRouter;