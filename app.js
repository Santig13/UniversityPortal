const mysql=require('mysql');
const express=require('express');
const path=require('path');
const { nextTick } = require('process');

//Configuración del servidor
const app= express();
const port=3000;

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
app.get('/login',(req,res)=>{
    const {email, password}=req.body;
    
    if(!email || !password)
        res.status(400).send('Faltan datos');

    pool.getConnection((err,connection)=>{
        if(err) 
            next(err);
        connection.query('SELECT * FROM usuarios WHERE email=? AND password=?',[email,password],(err,rows)=>{
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

app.listen(port,()=>{
    console.log('Servidor escuchando en http://localhost:${port}');
});