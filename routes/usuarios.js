"use strict";
const { Router } = require('express');

function createUsuariosRouter(pool, requireAuth, middlewareSession){
    const router = Router();
    router.use(requireAuth);
    router.use(middlewareSession);

    // Inscribir usuario en un evento
    router.post('/inscribir', (req, res) => {
        console.log("Datos de inscripción recibidos:", req.body); // Verifica los datos recibidos
        const { userId, eventId } = req.body;
        const fecha_inscripcion = new Date().toISOString().split('T')[0];
        const query = 'INSERT INTO inscripciones (usuario_id, evento_id, estado, fecha_inscripcion) VALUES (?, ?, ?, ?)';
    
        pool.query(query, [userId, eventId, "1", fecha_inscripcion], (error, results) => {
            if (error) {
                return res.status(500).send('Error inscribiendo al usuario en el evento');
            }
            res.status(200).send({ success: true, message: 'Usuario inscrito en el evento' });
        });
    });
    

    // Listar eventos en los que el usuario está inscrito
    router.get('/:userId/eventos', (req, res) => {
        const { userId } = req.params;
        const query = 'SELECT * FROM EVENTOS WHERE id IN (SELECT evento_id FROM Inscripciones WHERE usuario_id = ?)';
        pool.query(query, [userId], (error, results) => {
            if (error) {
                return res.status(500).send('Error recuperando eventos del usuario');
            }
            res.status(200).json(results);
        });
    });

    return router;
}


module.exports = createUsuariosRouter;