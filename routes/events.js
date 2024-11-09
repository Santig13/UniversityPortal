const { Router } = require('express');

function getEventosPersonales(user,pool) {
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
                return reject(err);
            }
            connection.query(sql, [user.id], (err, rows) => {
                connection.release();
                if (err) {
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
                return reject(err);
            }
            connection.query(sql, [user.id], (err, rows) => {
                connection.release();
                if (err) {
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
                return reject(err);
            }
            connection.query(sql, params, (err, rows) => {
                connection.release();
                if (err) {
                    return reject(err);
                }
                resolve(rows);
            });
        });
    });
}

function createEventosRouter(pool, requireAuth,middlewareSession) {
    const router = Router();
    
    router.use(requireAuth);
    router.use(middlewareSession);
    
    router.get('/filter', requireAuth, (req, res) => {
         getEventos(req.query,pool).then((eventos) => {res.status(200).json(eventos)}).catch((error) => {res.status(500).send("Error retrieving events.")});    
    });
    
    return router;
}

module.exports = {
    createEventosRouter,
    getEventos,
    getEventosPersonales
};
