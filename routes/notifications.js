const { Router } = require('express');

// Añadir una notificación a la base de datos
function añadirNotificacion(connection, usuario_id, mensaje, fecha, callback) {
    const sql = 'INSERT INTO notificaciones (usuario_id, mensaje, fecha_creacion,leido) VALUES (?, ?, ?, ?)';
    connection.query(sql, [usuario_id, mensaje, fecha, 0], (err, result) => {
        if (err) {
            return callback(err);
        }
        callback(null);
    });
}

// Crear un router para las notificaciones
function createNotificationsRouter(pool, requireAuth, middlewareSession) {
    const router = Router();

    router.use(requireAuth);
    router.use(middlewareSession);
    
    //Navegacion a notificaciones
    router.get('/', requireAuth, (req, res, next) => {
        const sql = 'SELECT * FROM notificaciones WHERE usuario_id  = ? ORDER BY fecha_creacion DESC';
            pool.query(sql, [req.session.user.id], (err, results) => {
                if (err) {
                    err.message = 'Error al recuperar las notificaciones.';
                    err.status = 500;
                    return next(err);
                }
                res.status(200).json(results);
            });
    });

    // Marcar una notificación específica como leída
    router.post('/:notificacionId/leido', requireAuth, (req, res, next) => {
        const { notificacionId } = req.params;
        // Comprobar que la notificación pertenece al usuario y que existe la notificación
        const sql = 'UPDATE notificaciones SET leida = 1 WHERE id = ? AND usuario_id = ?';
        pool.query(sql, [notificacionId, usuarioId], (err, results) => {
            if (err) {
                err.message = 'Error al marcar la notificación como leída.';
                err.status = 500;
                return next(err);
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Notificación no encontrada o no pertenece al usuario.' });
            }
            res.status(200).json({ success: true, message: 'Notificación marcada como leída.' });
        });
    });

    //Marcar como leidas las notificaciones
    router.post('/leido', requireAuth, (req, res, next) => {
        const sql = 'UPDATE notificaciones SET leido = 0 WHERE usuario_id  = ?';
        
        pool.query(sql, [req.session.user.id], (err) => {
            if (err) {
                err.message = 'Error al marcar las notificaciones como leídas.';
                err.status = 500;
                return next(err);
            }
            res.status(200).send('Notificaciones marcadas como leídas.');
        });
    });

    return router;
}
module.exports = {
    añadirNotificacion,
    createNotificationsRouter,
};
