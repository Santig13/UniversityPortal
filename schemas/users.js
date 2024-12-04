const { check, validationResult } = require('express-validator');

// Función para detectar caracteres sospechosos de inyección SQL
const detectSQLInjection = (value) => {
    const sqlInjectionPattern = /['";\-]/;
    if (sqlInjectionPattern.test(value)) {
        throw new Error('El valor contiene caracteres sospechosos de inyección SQL');
    }
    return true;
};

// Middleware de validación para usuario al registrarse
const validateUser = [
    check('nombre')
        .notEmpty().withMessage('Nombre es requerido')
        .isString().withMessage('Nombre debe ser un texto')
        .custom(detectSQLInjection),

    check('email')
        .notEmpty().withMessage('Email es requerido')
        .isEmail().withMessage('Email no tiene el formato correcto')
        .custom((value) => {
            const emailRegex = new RegExp(`.*@ucm\\.(com|es)$`);
            if (!emailRegex.test(value.toLowerCase())) {
                throw new Error('Email no tiene el formato correcto para la facultad');
            }
            return true;
        })
        .custom(detectSQLInjection),

    check('telefonoCompleto')
        .notEmpty().withMessage('Teléfono es requerido')
        .isLength({ min: 10 }).withMessage('Teléfono debe tener al menos 10 caracteres')
        .custom(detectSQLInjection),

    check('rol')
        .notEmpty().withMessage('Rol es requerido')
        .isIn(['participante', 'organizador']).withMessage('Rol debe ser participante u organizador')
        .custom(detectSQLInjection),

    check('facultad')
        .notEmpty().withMessage('Facultad es requerida')
        .isString().withMessage('Facultad debe ser un texto')
        .custom(detectSQLInjection),

    check('password')
        .isLength({ min: 8 }).withMessage('Contraseña debe tener al menos 8 caracteres')
        .custom(detectSQLInjection)
];

//validacion para paleta,tamaño y navegacion
const validateAccesibilidad = [
    check('theme')
        .notEmpty().withMessage('Paleta es requerido')
        .isString().withMessage('Paleta debe ser un texto')
        .custom(detectSQLInjection),

    check('fontSize')
        .notEmpty().withMessage('Tamaño es requerido')
        .isString().withMessage('Tamaño debe ser un texto')
        .custom(detectSQLInjection),

    check('navigation')
        .notEmpty().withMessage('Navegacion es requerido')
        .isString().withMessage('Navegacion debe ser un texto')
        .custom(detectSQLInjection)
    
]
// Middleware de validación para perfil de usuario
const validaUserProfile = [ 
    check('nombre')
        .notEmpty().withMessage('Nombre es requerido')
        .isString().withMessage('Nombre debe ser un texto')
        .custom(detectSQLInjection),

    check('telefonoCompleto')
        .notEmpty().withMessage('Teléfono es requerido')
        .isLength({ min: 10 }).withMessage('Teléfono debe tener al menos 10 caracteres')
        .custom(detectSQLInjection),

    check('password')
        .optional({checkFalsy: true})
        .isLength({ min: 8 }).withMessage('Contraseña debe tener al menos 8 caracteres')
        .custom(detectSQLInjection)
];

// Middleware de validación para recuperar contraseña
const validateRecover = [
    check('password')
        .isLength({ min: 8 }).withMessage('Contraseña debe tener al menos 8 caracteres')
        .custom(detectSQLInjection)
]

// Middleware de validación para login
const validateLogIn = [
    check('email')
        .notEmpty().withMessage('Email es requerido')
        .isEmail().withMessage('Email no tiene el formato correcto')
        .custom(detectSQLInjection),

    check('password')
        .notEmpty().withMessage('Contraseña es requerida')
        .custom(detectSQLInjection)
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
    validateLogIn: [...validateLogIn, validate],
    validateUser: [...validateUser, validate],
    validateUserProfile: [...validaUserProfile, validate],
    validateAccesibilidad: [...validateAccesibilidad, validate],
    validateRecover: [...validateRecover, validate]
};