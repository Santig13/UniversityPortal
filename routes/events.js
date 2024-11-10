const { Router } = require('express');

function getEventosPersonales(user, pool) {
    if (user.rol === 'participante') {
        return getEventosParticipante(user, pool);
    } else {
        return getEventosOrganizador(user, pool);
    }
}

function getEventosParticipante(user, pool) {
    const sql = 'SELECT * FROM eventos WHERE id IN (SELECT evento_id FROM inscripciones WHERE usuario_id=?)';
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) {
                err.message = 'Error al obtener conexión de la base de datos para obtener eventos del participante.';
                return reject(err);
            }
            connection.query(sql, [user.id], (err, rows) => {
                connection.release();
                if (err) {
                    err.message = 'Error al consultar eventos del participante en la base de datos.';
                    return reject(err);
                }
                resolve(rows);
            });
        });
    });
}

function getEventosOrganizador(user, pool) {
    const sql = 'SELECT * FROM eventos WHERE organizador_id=?';
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) {
                err.message = 'Error al obtener conexión de la base de datos para obtener eventos del organizador.';
                return reject(err);
            }
            connection.query(sql, [user.id], (err, rows) => {
                connection.release();
                if (err) {
                    err.message = 'Error al consultar eventos del organizador en la base de datos.';
                    return reject(err);
                }
                resolve(rows);
            });
        });
    });
}

function getEventos(query, pool) {
    const { fecha, tipo, ubicacion, capacidad } = query;
    let sql = 'SELECT * FROM eventos WHERE 1=1';
    const params = [];

    if (fecha) {
        sql += ' AND DATE(fecha) = ?';
        params.push(fecha);
    }
    if (tipo) {
        sql += ' AND tipo LIKE ?';
        params.push(`*%${tipo}%*`);
    }
    if (ubicacion) {
        sql += ' AND ubicacion LIKE ?';
        params.push(`%${ubicacion}%`);
    }
    if (capacidad) {
        sql += ' AND capacidad_maxima >= ?';
        params.push(capacidad);
    }
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) {
                err.message = 'Error al obtener conexión de la base de datos para filtrar eventos.';
                return reject(err);
            }
            connection.query(sql, params, (err, rows) => {
                connection.release();
                if (err) {
                    err.message = 'Error al consultar eventos en la base de datos.';
                    return reject(err);
                }
                resolve(rows);
            });
        });
    });
}

function createEventosRouter(pool, requireAuth, middlewareSession) {
    const router = Router();
    
    router.use(requireAuth);
    router.use(middlewareSession);
    
    router.get('/filter', requireAuth, (req, res,next) => {
        getEventos(req.query, pool)
            .then(eventos => {
                return getEventosPersonales(req.session.user, pool)
                    .then(eventosPersonales => {
                        eventos = eventos.map(evento => {
                            evento.inscrito = eventosPersonales.some(e => e.id === evento.id);
                            return evento;
                        });
                        res.status(200).json(eventos);
                    })
                    .catch(err => {
                        err.message = 'Error al obtener eventos personales para el usuario.';
                        err.status = 500;
                        next(err);
                    });
            })
            .catch(err => {
                err.message = 'Error al filtrar eventos.';
                err.status = 500;
                next(err);
            });
    });

    router.post('/crear', requireAuth, (req, res, next) => {
        const { titulo, descripcion, fecha, hora, ubicacion, capacidad_maxima, organizador_id} = req.body;
        const sql = 'INSERT INTO eventos(titulo, descripcion, fecha, hora, ubicacion, capacidad_maxima, organizador_id) VALUES(?, ?, ?, ?, ?, ?)';
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
    
    return router;
}

module.exports = {
    createEventosRouter,
    getEventos,
    getEventosPersonales
};
