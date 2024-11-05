const z = require('zod');
// Esquema de validación
const userSchema = z.object({
    nombre: z.string({ required_error: 'Nombre es requerido' }),
    email: z.string({ required_error: 'Email es requerido' }).email('Email no tiene el formato correcto'),
    telefonoCompleto: z.string({ required_error: 'Teléfono es requerido' })
        .min(10, 'Teléfono debe tener al menos 10 caracteres'),
    rol: z.enum(['participante', 'organizador'], { required_error: 'Rol es requerido' }),
    facultad: z.string({ required_error: 'Facultad es requerida' }),
    password: z.string().min(8, 'Contraseña debe tener al menos 8 caracteres')
}).superRefine((data, ctx) => {
    const emailRegex = new RegExp(`.*@${data.facultad.toLowerCase()}\.com$`);
    if (!emailRegex.test(data.email.toLowerCase())) {
        ctx.addIssue({
            path: ['email'],
            message: 'email no tiene el formato correcto para la facultad',
            id: data
        });
    }
});

const loginSchema = z.object({
    email: z.string({ required_error: 'Email es requerido' }).email('Email no tiene el formato correcto'),
    password: z.string({ required_error: 'Contraseña es requerida' })
});

 const validate = (schema) => (req, res, next) => {
    const result  = schema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ error: JSON.parse(result.error.message) })
    }
    next();
  };
  
    module.exports.validateLogIn = validate(loginSchema);
    module.exports.validateUser = validate(userSchema);
