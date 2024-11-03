const mysql=require('mysql');
const express=require('express');
const path=require('path');
const { z } = require('zod');


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

// Esquema de validación
const userSchema = z.object({
    nombre: z.string({ required_error: 'Nombre es requerido' }).nonempty('Contraseña es requerida'),
    email: z.string({ required_error: 'Email es requerido' }).email('Email no tiene el formato correcto').refine((email, ctx) => {
        const facultad = ctx.parent.facultad;//Uso el objeto ctx(contexto en zod) para acceder a la facultad
        const emailRegex = new RegExp(`.*@${facultad}\.com$`);
        return emailRegex.test(email);
    }, {
        message: 'Email no tiene el formato correcto para la facultad'
    }),
    telefono: z.string({ required_error: 'Teléfono es requerido' })
        .min(10, 'Teléfono debe tener al menos 9 caracteres'),
    facultad: z.string({ required_error: 'Facultad es requerido' }).nonempty('Contraseña es requerida'),
    password: z.string()
        .nonempty('Contraseña es requerida')
        .min(8, 'Contraseña debe tener al menos 8 caracteres')
});

const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).send(error.details[0].message);
    }
    next();
  };

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
//Registro de usuario
app.post('/registro', validate(userSchema),(req,res)=>{
    /*Aqui se valida con el middleware
    const {nombre, email, telefono,facultad, password}=req.body;
    
    if(!nombre || !email || !password || !telefono || !facultad)
        res.status(400).send('Faltan datos');

    const emailRegex = new RegExp(`.*@${facultad}\.com$`);
    if (!emailRegex.test(email)) {
        return res.status(400).send('Email no tiene el formato correcto');
    }*/

    pool.getConnection((err,connection)=>{
        if(err) 
            next(err);
        connection.query('INSERT INTO usuarios(nombre,email,password) VALUES(?,?,?)',[nombre,email,password],(err,rows)=>{
            connection.release();
            if(err)  
                next(err);
            res.render('Inicio',{data:req.body});
        });
    });
    
});

app.listen(port,()=>{
    console.log('Servidor escuchando en http://localhost:${port}');
});