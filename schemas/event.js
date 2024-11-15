const { check, validationResult } = require('express-validator');

// Middleware de validación para evento
const validateEvent = [
    check('titulo')
        .notEmpty().withMessage('Título es requerido')
        .isString().withMessage('Título debe ser un texto'),

    check('descripcion')
        .notEmpty().withMessage('Descripción es requerida')
        .isString().withMessage('Descripción debe ser un texto'),

    check('fecha')
        .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Fecha debe estar en formato YYYY-MM-DD'),

    check('hora')
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Hora debe estar en formato HH:MM'),

    check('ubicacion')
        .notEmpty().withMessage('Ubicación es requerida')
        .isString().withMessage('Ubicación debe ser un texto'),

    check('capacidad_maxima')
        .isInt({ min: 1 }).withMessage('Capacidad máxima debe ser un número entero positivo'),

];

// Middleware para manejar el resultado de validaciones
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Transformar los errores en una cadena más legible
        const errorMessages = errors.array().map(err => err.msg).join(', ');
        return res.status(400).json({ success: false, message: errorMessages });
    }
    next();
};

module.exports = {
    validateEvent: [...validateEvent, validate]
};
