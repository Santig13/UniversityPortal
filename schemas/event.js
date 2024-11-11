const z = require('zod');

// Esquema de validación para evento
const eventSchema = z.object({
    titulo: z.string().min(1, { message: 'Título es requerido' }),
    descripcion: z.string().min(1, { message: 'Descripción es requerida' }),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Fecha debe estar en formato YYYY-MM-DD' }), // Valida formato YYYY-MM-DD
    hora: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Hora debe estar en formato HH:MM' }), // Valida formato HH:MM
    ubicacion: z.string().min(1, { message: 'Ubicación es requerida' }),
    capacidad_maxima: z.number().int().positive({ message: 'Capacidad máxima debe ser un número entero positivo' }),
    organizador_id: z.number().int().positive({ message: 'El id del Organizador es requerido' })
});


// Middleware de validación
const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        // Transformar los errores en una cadena más legible
        console.log(result.error.errors);
        const errorMessages = result.error.errors.map(err => err.message).join(', ');
        return res.status(400).json({ success: false, message: errorMessages });
    }
    next();
};

module.exports = {
    validateEvent: validate(eventSchema)
};
