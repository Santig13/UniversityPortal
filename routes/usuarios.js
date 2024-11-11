"use strict";
const { Router } = require('express');

function createUsuariosRouter(pool, requireAuth, middlewareSession){
    const router = Router();
    router.use(requireAuth);
    router.use(middlewareSession);

    // Inscribir usuario en un evento
    router.post('/inscribir', (req, res, next) => {
        const { userId, eventId } = req.body;
        const fecha_inscripcion = new Date().toISOString().split('T')[0];
        const query = 'INSERT INTO inscripciones (usuario_id, evento_id, estado, fecha_inscripcion) VALUES (?, ?, ?, ?)';
    
        pool.query(query, [userId, eventId, "1", fecha_inscripcion], (error, results) => {
            if (error) {
                error.message = 'Error inscribiendo al usuario en el evento';
                error.status = 500;
                return next(error);
            }
            res.status(200).send({ success: true, message: 'Usuario inscrito en el evento' });
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

    return router;
}


module.exports = createUsuariosRouter;