"use strict";
const { Router } = require('express');
const { getEventosPersonales } = require('./events');
const {añadirNotificacion} = require('./notifications');
const {comprobarCapacidad} = require('./events');
const moment = require('moment');

function createUsuariosRouter(pool, requireAuth, middlewareSession){
    const router = Router();
    router.use(requireAuth);
    router.use(middlewareSession);

    // Inscribir usuario en un evento
    router.post('/inscribir', (req, res, next) => {
        const { userId, eventId, organizador_id } = req.body;
        const fecha_inscripcion = moment().format('YYYY-MM-DD');
        const query = 'INSERT INTO inscripciones (usuario_id, evento_id, estado, fecha_inscripcion) VALUES (?, ?, ?, ?)';
        let message = 'Te has inscrito en el evento';
        let mensaje =`Te has inscrito en el evento con id ${eventId}`;
        let estado = "inscrito";
        let mensaje2 = `El usuario con id ${userId} se ha inscrito a su evento con id ${eventId}`;

        pool.getConnection((err, connection) => {
            if (err) {
                err.message = 'Error al obtener conexión de la base de datos para inscribir usuario en evento';
                return next(err);
            }

            comprobarCapacidad(connection, eventId, (err, resultado) => {
                if (err) {
                    connection.release();
                    return next(err);
                }
              
                // Si no hay espacio, cambia rel estado de la inscripcion y los mensajes
                if (!resultado.hayEspacio) {
                    message = 'Se te ha añadido a la lista de espera';
                    mensaje = `Te has añadido a la lista de espera del evento con id ${eventId}`;
                    estado = "lista de espera";
                    mensaje2 = `El usuario con id ${userId} se ha añadido a la lista de espera de su evento con id ${eventId}`;
                } 
                
                connection.query(query, [userId, eventId, estado, fecha_inscripcion], (error, results) => {
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
            });
        });
    });

    // Desinscribir usuario de la lista de espera un evento
    router.delete('/abandonar', (req, res, next) => {
        const { userId, eventId,organizador_id } = req.body;
        const query = 'DELETE FROM inscripciones WHERE usuario_id = ? AND evento_id = ? AND estado = "lista de espera"';
        
        pool.getConnection((err, connection) => {
            if(err){
                err.message = 'Error al obtener conexión de la base de datos para desinscribir usuario de evento';
                return next(err);
            }
            connection.query(query, [userId, eventId], (error, results) => {
                if (error) {
                    connection.release();
                    error.message = 'Error desinscribiendo al usuario del evento';
                    error.status = 500;
                    return next(error);
                }
                const mensaje = `Has abandonado la lista de espera del evento con id ${eventId}`;
                
                const fecha = moment().format('YYYY-MM-DD HH:mm:ss');
                añadirNotificacion(connection, userId, mensaje, fecha, (err) => {
                    if (err) {
                        connection.release();
                        return next(err);
                    }
                    const mensaje2 = `El usuario con id ${userId} ha abandonado la lista de espera de su evento con id ${eventId}`;
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
    // Desinscribir usuario de un evento
    router.delete('/desinscribir', (req, res, next) => {
        const { userId, eventId,organizador_id } = req.body;
        const query = 'DELETE FROM inscripciones WHERE usuario_id = ? AND evento_id = ?';
        
        pool.getConnection((err, connection) => {
            if(err){
                err.message = 'Error al obtener conexión de la base de datos para desinscribir usuario de evento';
                return next(err);
            }
            connection.query(query, [userId, eventId], (error, results) => {
                if (error) {
                    connection.release();
                    error.message = 'Error desinscribiendo al usuario del evento';
                    error.status = 500;
                    return next(error);
                }
                const mensaje = `Te has desinscrito del evento con id ${eventId}`;
                
                const fecha = moment().format('YYYY-MM-DD HH:mm:ss');
                añadirNotificacion(connection, userId, mensaje, fecha, (err) => {
                    if (err) {
                        connection.release();
                        return next(err);
                    }
                    const mensaje2 = `El usuario con id ${userId} se ha desinscrito de su evento con id ${eventId}`;
                    añadirNotificacion(connection, organizador_id, mensaje2, fecha, (err) => {
                        connection.release();
                        if (err) {
                            return next(err);
                        }
                       
                        res.status(200).send({ success: true, message: 'Te has desinscrito del evento' });
                    });
                });
            });
        });
    });
    

    // Listar eventos en los que el usuario está inscrito
    router.get('/:userId/eventos', (req, res, next) => {
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

    
    // Navegación a la página de usuario personal
    router.get('/:id', requireAuth, (req, res, next) => {
        getEventosPersonales(req.session.user, pool, (err, eventos) => {
            if (err) {
                err.message = 'Error al recuperar los eventos personales.';
                err.status = 500;
                return next(err);
            }
            res.render('usuario', { user: req.session.user, eventos });
        });
    });

    return router;
}


module.exports = createUsuariosRouter;