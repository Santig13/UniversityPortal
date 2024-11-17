const mysql=require('mysql');
const express=require('express');
const path=require('path');
const session = require('express-session');
const mysqlSession = require('express-mysql-session');
const createAuthRouter = require('./routes/auth.js');
const {createEventosRouter,getEventos,getEventosPersonales} = require('./routes/events.js');
const createUsuariosRouter  = require('./routes/usuarios.js');
const {createNotificationsRouter } = require('./routes/notifications.js');
const mysqlStore = mysqlSession(session);

const sessionStore = new mysqlStore({
    host: "localhost",
    user: "root",
    password: "",
    database: "AW_24"
});

const middlewareSession = session({ 
    saveUninitialized: false,
    resave: true,
    secret: 'secret',
    store: sessionStore
});

//Configuración del servidor
const app= express();
const PORT=3000;

//Configuración de la base de datos
const pool=mysql.createPool({
    host: "localhost",
    user: "root",
    port: 3306,
    password: "",
    database: "AW_24"
});

const detectIPBloqueadas = (req, res, next) => {
    const ip = req.ip;
    pool.query('SELECT * FROM lista_negra_ips WHERE ip = ?', [ip], (err, results) => {
        if (err) {
            err.message = 'Error al consultar la lista negra de IPs.';
            return next(err);
        }
        if (results.length > 0) {
            const error = new Error('Tu IP ha sido bloqueada.');
            error.statusCode = 403;
            return next(error);
        }
        next();
    });
};

// Middleware de autenticación
function requireAuth(req, res, next) {
    if (req.session.user) {
        return next(); 
    } else {
        const err = new Error('Debes iniciar sesión para acceder a esta página.');
        err.status = 401;
        next(err); 
    }
}

// Middleware para parsear datos de formularioy aceptar JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para que cargue todos los archivos estáticos y poder usar js y css en el html
app.use(express.static(path.join(__dirname, 'public')));

app.use(middlewareSession);
app.use(detectIPBloqueadas);

// Rutas
app.use('/auth', createAuthRouter(pool, middlewareSession));
app.use('/eventos', createEventosRouter(pool, requireAuth, middlewareSession));
app.use('/usuarios', createUsuariosRouter(pool, requireAuth, middlewareSession));
app.use('/notificaciones', createNotificationsRouter(pool, requireAuth, middlewareSession));

// Configurar el motor de plantillas EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


//NAVEGACION A LAS PAGINAS

//Navegacion a la pagina de inicio
app.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname,'public','Inicio.html'));
});
//Navegacion a la pagina de registro
app.get('/registro',(req,res)=>{
    res.sendFile(path.join(__dirname,'public','Registro.html'));
});

//Obtener todas las facultades para la página de registro
app.get('/facultades',  (req,res,next)=>{
        const sql='SELECT * FROM facultades';
        pool.query(sql, (err, results) => {
            if (err) {
                err.mensaje = "Error al recuperar las facultades.";
                err.status = 500;
                return next(err);
            }
            res.status(200).json(results);
        });
});  


// Navegación a la página de dashboard
app.get('/dashboard', requireAuth, (req, res, next) => {
    getEventos(req.query, pool, (err, eventos) => {
        if (err) {
            err.message = "Error al recuperar los eventos.";
            err.status = 500;
            return next(err);
        }
        getEventosPersonales(req.session.user, pool, (err, eventosPersonales) => {
            if (err) {
                err.message = "Error al recuperar los eventos personales.";
                err.status = 500;
                return next(err);
            }
            eventos = eventos.map(evento => {
                const inscripcion = eventosPersonales.find(e => e.id === evento.id);
                if (inscripcion) {
                    evento.estadoInscripcion = inscripcion.estado;
                } else {
                    evento.estadoInscripcion = null;
                }
                return evento;
            });
           
            res.render('dashboard', { user: req.session.user, eventos });
        });
    });
});

app.get('/calendar', requireAuth, (req, res) => {
    res.render('calendar', {user:req.session.user });
});

// Middleware para manejar errores unificados
app.use((err, req, res, next) => {
    const statusCode = err.status || 500;
    const defaultMessages = {
        400: 'Hubo un problema con la solicitud enviada al servidor.',
        401: 'Debes iniciar sesión para acceder a esta página.',
        404: `La página que buscas (${req.url}) no existe.`,
        500: 'Ocurrió un error en el servidor. Por favor, inténtalo más tarde.'
    };

    const titles = {
        400: '400 - Solicitud Incorrecta',
        401: '401 - No Autorizado',
        404: '404 - Página No Encontrada',
        500: '500 - Error Interno del Servidor'
    };

    
    const title = titles[statusCode] || 'Error';
    const message = err.message || defaultMessages[statusCode];
    if(message ==="Error de validación: posible intento de inyección SQL"){

        pool.query('INSERT INTO lista_negra_ips (ip) VALUES (?)', [req.ip], (err) => {
            if (err) {
                console.error('Error al insertar la IP en la lista negra.', err);
            }
        });
        
    }
    res.status(statusCode).render('error', {
        titulo: title,
        mensaje: message,
    });
});


// Iniciar el servidor
app.listen(PORT,(err)=>{
    if(err)
        console.error(`Error al iniciar el servidor: ${err}`);
    else
        console.log(`server listening on port http://localhost:${PORT}`);
});