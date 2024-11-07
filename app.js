const mysql=require('mysql');
const express=require('express');
const path=require('path');
const bcrypt = require('bcrypt');
const {validateLogIn, validateUser}= require('./schemas/users.js');
const session = require('express-session');
const mysqlSession = require('express-mysql-session');
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

//Navegacion a la pagina de login
app.post('/login', validateLogIn, async (req, res, next) => {
    const { email, password } = req.body;
    
    pool.getConnection((err, connection) => {
        if (err) return next(err);
        
        connection.query('SELECT * FROM usuarios WHERE email = ?', [email], async (err, rows) => {
            connection.release();
            if (err) return next(err);

            if (rows.length > 0) {
                const user = rows[0];
                
                const isMatch = await bcrypt.compare(password, user.password);
                const { password: _, ...userWithoutPassword } = user;

                if (isMatch) {
                   
                    req.session.user = userWithoutPassword;
                    res.redirect('/dashboard');
                } else {
                    res.status(400).send('Email o contraseña incorrectos');
                }
            } else {
                res.status(400).send('Email o contraseña incorrectos');
            }
        });
    });
});

// Cerrar sesión
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).send('Error al cerrar sesión');
        res.redirect('/'); 
    });
});


//Obtener todas las facultades
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


//Registro de usuario 
app.post('/usuario', validateUser, async (req,res,next)=>{
    const {nombre, email, telefonoCompleto,facultad,rol, password}=req.body;
    const hashedPassword = await bcrypt.hash(password, 10); // hash password 10 salt rounds

    const consultaINSERTuser = 'INSERT INTO usuarios(nombre,email,telefono,facultad_id,rol,accesibilidad_id,password) VALUES(?,?,?,?,?,?,?)';
    const consultaSELECTfacultad = 'SELECT id FROM facultades WHERE nombre=?';
    const consultaINSERTfacultad = 'INSERT INTO facultades(nombre) VALUES(?)';

    function insertarUsuario(connection, facultad_id) {
        connection.query(consultaINSERTuser, [nombre, email, telefonoCompleto, facultad_id,rol,1, hashedPassword], (err, rows) => {
            connection.release();
            if (err) return next(err);
            res.status(200).send({ rows: rows });
        });
    }

    pool.getConnection((err, connection) => {
        if (err) return next(err);

        connection.query(consultaSELECTfacultad, [facultad], (err, rows) => {
            if (err) {
                connection.release();
                return next(err);
            }

            let facultad_id;
            if (rows.length > 0) {
                facultad_id = rows[0].id;
                insertarUsuario(connection, facultad_id);
            } else {
                connection.query(consultaINSERTfacultad, [facultad], (err, result) => {
                    if (err) {
                        connection.release();
                        return next(err);
                    }
                    facultad_id = result.insertId;
                    insertarUsuario(connection, facultad_id);
                });
            }
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