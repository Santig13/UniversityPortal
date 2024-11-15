const { check, validationResult } = require('express-validator');

const detectSQLInjection = (value) => {
    const sqlInjectionPattern = /['";\-]/;
    if (sqlInjectionPattern.test(value)) {
        throw new Error('El valor contiene caracteres sospechosos de inyección SQL');
    }
    return true;
};
// Middleware de validación para evento
const validateEvent = [
    check('titulo')
        .notEmpty().withMessage('Título es requerido')
        .isString().withMessage('Título debe ser un texto')
        .custom(detectSQLInjection),

    check('descripcion')
        .notEmpty().withMessage('Descripción es requerida')
        .isString().withMessage('Descripción debe ser un texto')
        .custom(detectSQLInjection),

    check('fecha')
        .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Fecha debe estar en formato YYYY-MM-DD'),

    check('hora')
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Hora debe estar en formato HH:MM'),

    check('ubicacion')
        .notEmpty().withMessage('Ubicación es requerida')
        .isString().withMessage('Ubicación debe ser un texto')
        .custom(detectSQLInjection),

    check('capacidad_maxima')
        .isInt({ min: 1 }).withMessage('Capacidad máxima debe ser un número entero positivo')
        .custom(detectSQLInjection),
];

// Middleware general para manejar resultados de validación
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Transformar los errores en una cadena más legible
        const errorMessages = errors.array().map(err => err.msg).join(', ');
        const sqlInjectionError = errors.array().some(err => err.msg.includes('inyección SQL'));
        if (sqlInjectionError) {
            const error = new Error('Error de validación: posible intento de inyección SQL');
            error.status = 405;
            return next(error);
        }
        return res.status(400).json({ success: false, message: errorMessages });
    }
    next();
};

module.exports = {
    validateEvent: [...validateEvent, validate]
};
