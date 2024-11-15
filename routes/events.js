const { Router } = require('express');
const { validateEvent } = require('../schemas/event.js');

function getEventosPersonales(user, pool, callback) {
    if (user.rol === 'participante') {
        getEventosParticipante(user, pool, callback);
    } else {
        getEventosOrganizador(user, pool, callback);
    }
}

function getEventosParticipante(user, pool, callback) {
    const sql = 'SELECT * FROM eventos WHERE id IN (SELECT evento_id FROM inscripciones WHERE usuario_id=?)';
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
                    evento.inscrito = eventosPersonales.some(e => e.id === evento.id);
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
                    console.log(err);
                    err.message = 'Error al crear evento en la base de datos.';
                    return next(err);
                }
                res.status(200).json({ id: result.insertId });
            });
        });
    });

    // Ruta para borrar un evento
    router.delete('/:id', requireAuth, (req, res, next) => {
        const sql = 'DELETE FROM eventos WHERE id=?';
        pool.getConnection((err, connection) => {
            if (err) {
                err.message = 'Error al obtener conexión de la base de datos para eliminar evento.';
                return next(err);
            }
            connection.query(sql, [req.params.id], (err, result) => {
                connection.release();
                if (err) {
                    err.message = 'Error al eliminar evento en la base de datos.';
                    return next(err);
                }
                res.status(200).json({ success: true });
            });
        });
    });

    // Ruta para editar un evento
    router.put('/:id', requireAuth, validateEvent, (req, res, next) => {
        const { titulo, descripcion, fecha, hora, ubicacion, capacidad_maxima} = req.body;
        const id = req.params.id;
        const sql = 'UPDATE eventos SET titulo=?, descripcion=?, fecha=?, hora=?, ubicacion=?, capacidad_maxima=? WHERE id=?';
        pool.getConnection((err, connection) => {
            if (err) {
                err.message = 'Error al obtener conexión de la base de datos para actualizar evento.';
                return next(err);
            }
            connection.query(sql, [titulo, descripcion, fecha, hora, ubicacion, capacidad_maxima, id], (err, result) => {
                connection.release();
                if (err) {
                    err.message = 'Error al actualizar evento en la base de datos.';
                    return next(err);
                }
                res.status(200).json({ success: true });
            });
        });
    });
    
    return router;
}

module.exports = {
    createEventosRouter,
    getEventos,
    getEventosPersonales
};
