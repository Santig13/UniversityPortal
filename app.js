const mysql=require('mysql');
const express=require('express');
const path=require('path');
const bcrypt = require('bcrypt');
const {validateLogIn, validateUser}= require('./schemas/users.js');


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

// Configurar el motor de plantillas EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


//Middleware para  el manejo de errores
app.use((err,req,res,next)=>{
    console.error(err.stack);
    res.status(500).send('Algo salió mal');//Temporal, hay que tratar los errores de forma adecuada
});

//Navegacion a la pagina de inicio
app.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname,'public','Inicio.html'));
});
//Navegacion a la pagina de registro
app.get('/registro',(req,res)=>{
    res.sendFile(path.join(__dirname,'public','Registro.html'));
});
app.get('/usuario',validateLogIn, async (req,res,next)=>{
    const {email, password}=req.body;
    const hashedPassword = await bcrypt.hash(password, 10); // hash password 10 salt rounds
    pool.getConnection((err,connection)=>{
        if(err) 
            next(err);
        connection.query('SELECT * FROM usuarios WHERE email=? AND password=?',[email,hashedPassword],(err,rows)=>{
            connection.release();
            if(err)  
                next(err);
            if(rows.length>0){
                res.render('Inicio',{data:rows[0]});
            }else{
                res.status(400).send('Email o contraseña incorrectos');
            }
        });
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

app.listen(PORT,()=>{
    console.log(`server listening on port http://localhost:${PORT}`);
});