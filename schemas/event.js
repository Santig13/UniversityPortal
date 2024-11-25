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

    check('hora_ini')
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Hora debe estar en formato HH:MM'),
    check('hora_fin')
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Hora debe estar en formato HH:MM')
        .custom((value, { req }) => {
            if (value <= req.body.hora_ini) {
                throw new Error('Hora fin debe ser mayor a hora inicio');
            }
            return true;
        }),
    check('ubicacion')
        .notEmpty().withMessage('Ubicación es requerida')
        .isString().withMessage('Ubicación debe ser un texto')
        .custom(detectSQLInjection),

    check('capacidad_maxima')
        .isInt({ min: 1 }).withMessage('Capacidad máxima debe ser un número entero positivo')
        .custom(detectSQLInjection),
];
const validateEventFilters = [
    check('fecha')
        .optional({ checkFalsy: true })
        .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Fecha debe estar en formato YYYY-MM-DD'),
    check('ubicacion')
        .optional({ checkFalsy: true })
        .notEmpty().withMessage('Ubicación es requerida')
        .isString().withMessage('Ubicación debe ser un texto')
        .custom(detectSQLInjection),
    check('capacidad_maxima')
        .optional({ checkFalsy: true })
        .isInt({ min: 1 }).withMessage('Capacidad máxima debe ser un número entero positivo')
        .custom(detectSQLInjection),
];
const validateEventCalification = [
    check('calificacion')
        .notEmpty().withMessage('Calificación es requerida')
        .isInt({ min: 1, max: 5 }).withMessage('Calificación debe ser un número entero entre 1 y 5')
        .custom(detectSQLInjection),
    check('comentario')
        .isString().withMessage('Comentario debe ser un texto')
        .custom(detectSQLInjection),
];
// Middleware general para manejar resultados de validación
const validate = (req, res, next) => {
    const errors = validationResult(req);
    console.log(errors);
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
    validateEvent: [...validateEvent, validate],
    validateFilter: [...validateEventFilters, validate],
    validateCalification: [...validateEventCalification, validate]
};
