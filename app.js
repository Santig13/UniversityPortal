const mysql=require('mysql');
const express=require('express');
const path=require('path');
const {validateLogIn, validateUser}= require('./schemas/users.js');
const session = require('express-session');
const mysqlSession = require('express-mysql-session');
const createAuthRouter = require('./routes/auth.js');
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


// Middleware para parsear datos de formularioy aceptar JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para que cargue todos los archivos estáticos y poder usar js y css en el html
app.use(express.static(path.join(__dirname, 'public')));

app.use(middlewareSession);

// Utiliza el router de autenticación
app.use('/auth', createAuthRouter(pool, middlewareSession, validateLogIn, validateUser));

// Configurar el motor de plantillas EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//Navegacion a la pagina de inicio
app.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname,'public','Inicio.html'));
});
//Navegacion a la pagina de registro
app.get('/registro',(req,res)=>{
    res.sendFile(path.join(__dirname,'public','Registro.html'));
});

//Obtener todas las facultades para la página de registro
app.get('/facultades',(req,res,next)=>{
    const sql='SELECT * FROM facultades';

    pool.getConnection((err,connection)=>{
        if(err) 
            next(err);
        connection.query(sql,(err,rows)=>{
            connection.release();
            if(err)  
                next(err);
            res.status(200).send(rows);
        });
    });
});  


// Middleware de autenticación
function requireAuth(req, res, next) {
    if (req.session.user) {
        return next();
    } else {
        res.status(401).send('Debes iniciar sesión para acceder a esta página.');
    }
}

// Navegación a la página de dashboard
app.get('/dashboard', requireAuth, (req, res) => {
    res.render('dashboard', { user: req.session.user });
});

//Middleware para  el manejo de errores
app.use((err,req,res,next)=>{
    res.status(500);
    res.render('error500', {
        mensaje: err.message,
        pila: err.stack
    });
});

//Navegacion a la pagina de error 404
app.use((req,res)=>{
    res.status(404);
    res.render("error404", {url:req.url});
})

app.listen(PORT,(err)=>{
    if(err)
        console.error(`Error al iniciar el servidor: ${err}`);
    else
        console.log(`server listening on port http://localhost:${PORT}`);
});