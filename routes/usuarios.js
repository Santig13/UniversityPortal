"use strict";
const { Router } = require('express');
const { getEventosPersonales } = require('./events');
const {añadirNotificacion} = require('./notifications');
const {comprobarCapacidad} = require('./events');
const bcrypt = require('bcrypt');
const moment = require('moment');
const { validateUserProfile,validateAccesibilidad} = require('../schemas/users');

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
        console.log(fontSize, navigation, theme);
        console.log(req.session.user.accesibilidad_id);
    
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
                    console.log(error);
                    error.message = 'Error creando la configuración de accesibilidad';
                    error.status = 500;
                    return next(error);
                }
                console.log(results);
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
    router.get('/:userId/eventos', requireAuth, (req, res, next) => {
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

    router.put('/:userId/actualizar', requireAuth, validateUserProfile, async (req, res, next) => {
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
    router.get('/:id', requireAuth, (req, res, next) => {
        getEventosPersonales(req.session.user, pool, (err, eventos) => {
            if (err) {
                err.message = 'Error al recuperar los eventos personales.';
                err.status = 500;
                return next(err);
            }
            console.log(req.session.user);
            res.render('usuario', { user: req.session.user, eventos });
        });
    });

    // Ruta para obtener los datos del usuario
    router.get('/:id/datos', requireAuth, (req, res, next) => {
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