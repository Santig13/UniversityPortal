const z = require('zod');

// Esquema de validación para evento
const eventSchema = z.object({
    titulo: z.string().min(1, { message: 'Nombre es requerido' }),
    descripcion: z.string().min(1, { message: 'Descripción es requerida' }),
    fecha: z.date({ message: 'Fecha es requerida' }),
    hora: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Hora debe estar en formato HH:MM' }), // Valida formato HH:MM
    ubicacion: z.string().min(1, { message: 'Ubicación es requerida' }),
    capacidad: z.number().int().nonnegative({ message: 'Capacidad debe ser un número entero no negativo' }),
    organizador_id: z.number().int().nonnegative({ message: 'El id del Organizador es requerido' })
});


// Middleware de validación
const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        // Transformar los errores en una cadena más legible
        const errorMessages = result.error.errors.map(err => err.message).join(', ');
        return res.status(400).json({ success: false, message: errorMessages });
    }
    next();
};

module.exports = {
    validateEvent: validate(eventSchema)
};
