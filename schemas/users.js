// const z = require('zod');

// // Esquema de validación para usuario
// const userSchema = z.object({
//     nombre: z.string().nonempty({ message: 'Nombre es requerido' }),
//     email: z.string().nonempty({ message: 'Email es requerido' }).email({ message: 'Email no tiene el formato correcto' }),
//     telefonoCompleto: z.string().nonempty({ message: 'Teléfono es requerido' })
//         .min(10, { message: 'Teléfono debe tener al menos 10 caracteres' }),
//     rol: z.enum(['participante', 'organizador'], { message: 'Rol es requerido' }),
//     facultad: z.string().nonempty({ message: 'Facultad es requerida' }),
//     password: z.string().min(8, { message: 'Contraseña debe tener al menos 8 caracteres' })
// }).superRefine((data, ctx) => {
//     const emailRegex = new RegExp(`.*@${data.facultad.toLowerCase()}\.(com|es)$`);
//     if (!emailRegex.test(data.email.toLowerCase())) {
//         ctx.addIssue({
//             path: ['email'],
//             message: 'Email no tiene el formato correcto para la facultad',
//         });
//     }
// });

// // Esquema de validación para login
// const loginSchema = z.object({
//     email: z.string().nonempty({ message: 'Email es requerido' }).email({ message: 'Email no tiene el formato correcto' }),
//     password: z.string().nonempty({ message: 'Contraseña es requerida' })
// });

// // Middleware de validación
// const validate = (schema) => (req, res, next) => {
//     const result = schema.safeParse(req.body);
//     if (!result.success) {
//         // Transformar los errores en una cadena más legible
//         const errorMessages = result.error.errors.map(err => err.message).join(', ');
//         return res.status(400).json({ success: false, message: errorMessages });
//     }
//     next();
// };

// module.exports = {
//     validateLogIn: validate(loginSchema),
//     validateUser: validate(userSchema)
// };

const { check, validationResult } = require('express-validator');

// Middleware de validación para usuario
const validateUser = [
    check('nombre')
        .notEmpty().withMessage('Nombre es requerido')
        .isString().withMessage('Nombre debe ser un texto'),

    check('email')
        .notEmpty().withMessage('Email es requerido')
        .isEmail().withMessage('Email no tiene el formato correcto')
        .custom((value, { req }) => {
            const facultad = req.body.facultad ? req.body.facultad.toLowerCase() : '';
            const emailRegex = new RegExp(`.*@${facultad}\\.(com|es)$`);
            if (!emailRegex.test(value.toLowerCase())) {
                throw new Error('Email no tiene el formato correcto para la facultad');
            }
            return true;
        }),

    check('telefonoCompleto')
        .notEmpty().withMessage('Teléfono es requerido')
        .isLength({ min: 10 }).withMessage('Teléfono debe tener al menos 10 caracteres'),

    check('rol')
        .notEmpty().withMessage('Rol es requerido')
        .isIn(['participante', 'organizador']).withMessage('Rol debe ser participante u organizador'),

    check('facultad')
        .notEmpty().withMessage('Facultad es requerida')
        .isString().withMessage('Facultad debe ser un texto'),

    check('password')
        .isLength({ min: 8 }).withMessage('Contraseña debe tener al menos 8 caracteres')
];

// Middleware de validación para login
const validateLogIn = [
    check('email')
        .notEmpty().withMessage('Email es requerido')
        .isEmail().withMessage('Email no tiene el formato correcto'),

    check('password')
        .notEmpty().withMessage('Contraseña es requerida')
];

// Middleware general para manejar resultados de validación
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
    validateLogIn: [...validateLogIn, validate],
    validateUser: [...validateUser, validate]
};

