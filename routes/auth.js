const { Router } = require('express');
const bcrypt = require('bcrypt');
const UAParser = require('ua-parser-js');
const { validateLogIn, validateUser, validateRecover } = require('../schemas/users');
const nodemailer = require('nodemailer');


//Funcion para registrar ip negador fecha y user en una tabla 
function registroUso(connection,req,callback) {
    const ip = req.ip;
    const fecha = new Date();
    const hora = fecha.getHours() + ':' + fecha.getMinutes() + ':' + fecha.getSeconds();
    const user = req.session.user.id;
    const userAgent = req.headers['user-agent'];
    const parser = new UAParser(userAgent);
    const browser = parser.getBrowser(); // Detecta el navegador
    const os = parser.getOS(); // Detecta el sistema operativo
    const sql = 'INSERT INTO registro_uso(ip, fecha,horaEntrada, usuario_id,navegador,OS) VALUES(?,?,?,?,?,?)';
    connection.query(sql, [ip, fecha,hora, user,browser.name,os.name], (err,result) => {
        if (err) {
            err.message = 'Error al registrar el uso de la aplicación.';
            return callback(err,null);
        }
        return callback(null,result);
    });
}
function createAuthRouter(pool, sessionMiddleware) {
    const router = Router();

    router.use(sessionMiddleware); // Middleware de sesión

    // Ruta login
    router.post('/login', validateLogIn, async (req, res, next) => {
        const { email, password } = req.body;
        pool.getConnection((err, connection) => {
            if (err) {
                err.message = 'Error al obtener conexión de la base de datos durante el inicio de sesión.';
                return next(err);
            }

            connection.query('SELECT * FROM usuarios WHERE email = ?', [email], async (err, rows) => {
                
                if (err) {
                    err.message = 'Error al consultar la base de datos para encontrar al usuario.';
                    return next(err);
                }
                
                if (rows.length > 0) {
                    const sql2 = 'SELECT * FROM accesibilidades WHERE id = ?';
                    connection.query(sql2, [rows[0].accesibilidad_id], async (err, accesibilidad) => {
                        connection.release();
                        if (err) {
                            err.message = 'Error al consultar la base de datos para encontrar la accesibilidad del usuario.';
                            return next(err);
                        }
                      
                        const user = rows[0];
                        const isMatch = await bcrypt.compare(password, user.password);
                        const { password: _, ...userWithoutPassword } = user;

                        if (isMatch) {
                            // Añadir campos de accesibilidad al usuario
                            const userWithAccesibilidad = {
                                ...userWithoutPassword,
                                accesibilidad: accesibilidad[0]
                            };
                            req.session.user = userWithAccesibilidad;
                            registroUso(connection,req, (err,rows)=>{
                                if (err) {
                                    err.message = 'Error al registrar el uso de la aplicación.';
                                    return next(err);
                                }
                                req.session.uso=rows.insertId;
                                res.redirect('/dashboard');
                            });
                        } else {
                            res.status(400).json({ success: false, message: 'Contraseña incorrecta' });
                        }
                    });
                } else {
                    connection.release();
                    res.status(400).json({ success: false, message: 'El usuario introducido no existe' });
                    
                }
            });
        });
    });

    // Ruta logout
    router.post('/logout', (req, res, next) => {
        const uso = req.session.uso;
        pool.getConnection((err, connection) => {
            if (err) {
                err.message = 'Error al obtener conexión de la base de datos para cerrar la sesión.';
                return next(err);
            }
            const sql = 'UPDATE registro_uso SET horaSalida = ? WHERE id = ?';
            const fecha = new Date();
            const hora = fecha.getHours() + ':' + fecha.getMinutes() + ':' + fecha.getSeconds();
            connection.query(sql, [hora, uso], (err, result) => {
                connection.release();
                if (err) {
                    err.message = 'Error al cerrar la sesión.';
                    return next(err);
                }
                req.session.destroy(err => {
                    if (err) {
                        err.message = 'Error al cerrar la sesión.';
                        return next(err);
                    }
                    res.status(200).json({ success: true, message: 'Sesión cerrada correctamente' });
                });
            });
        });
    });

    // Ruta registro
    router.post('/register', validateUser, async (req, res, next) => {
        const { nombre, email, telefonoCompleto, facultad, rol, password } = req.body; 
        const hashedPassword = await bcrypt.hash(password, 10); // hasheamos la password para que no este visible desde la base de datos

        const consultaINSERTuser = 'INSERT INTO usuarios(nombre, email, telefono, facultad_id, rol, accesibilidad_id, password) VALUES(?,?,?,?,?,?,?)';
        const consultaSELECTfacultad = 'SELECT id FROM facultades WHERE nombre=?';
        const consultaINSERTfacultad = 'INSERT INTO facultades(nombre) VALUES(?)';

        function insertarUsuario(connection, facultad_id) {
            connection.query(consultaINSERTuser, [nombre, email, telefonoCompleto, facultad_id, rol, 1, hashedPassword], (err, rows) => {
                connection.release();
                if (err) {
                    err.message = 'Error al insertar un nuevo usuario en la base de datos.';
                    return next(err);
                }
                res.status(200).json({ success: true, message: 'Usuario registrado exitosamente' });
            });
        }

        pool.getConnection((err, connection) => {
            if (err) {
                err.message = 'Error al obtener conexión de la base de datos para el registro.';
                return next(err);
            }

            connection.query(consultaSELECTfacultad, [facultad], (err, rows) => {
                if (err) {
                    connection.release();
                    err.message = 'Error al buscar la facultad en la base de datos.';
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
                            err.message = 'Error al insertar una nueva facultad en la base de datos.';
                            return next(err);
                        }
                        facultad_id = result.insertId;
                        insertarUsuario(connection, facultad_id);
                    });
                }
            });
        });
    });

    // Ruta recuperar contraseña
    router.get('/recover/:email', (req, res) => {
        res.render('restorepassword' , {email: req.params.email});
    });

    // Ruta enviar mail de recuperación
    router.post('/recuperar', async (req, res, next) => {
        const { email } = req.body;
        pool.getConnection((err, connection) => {
            if (err) {
                err.message = 'Error al obtener conexión de la base de datos para la recuperación de contraseña.';
                return next(err);
            }
            connection.query('SELECT * FROM usuarios WHERE email = ?', [email], async (err, rows) => {
                connection.release();
                if (err) {
                    err.message = 'Error al consultar la base de datos para encontrar el usuario.';
                    return next(err);
                }

                if (rows.length <= 0) {
                   
                     return res.status(400).json({ success:false , message: 'El usuario introducido no existe' });
                }
                
                const transport = nodemailer.createTransport({
                    host: 'smtp.gmail.com',
                    port: 465,
                    secure: true,
                    auth: {
                        user: 'portal.gestionaw@gmail.com',
                        pass: 'bwio wkpc qpmy izzw'

                    }
                });
                
                const resetLink = `http://localhost:3000/auth/recover/${email}`;
                const mailOptions = {
                    from: 'portal.gestionaw@gmail.com',
                    to: email,
                    subject: 'Recuperación de contraseña',
                    html: `
                        <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #1A2226; color: #0DB8DE;">
                            <img src="cid:calendarioLogo" alt="Logo" style="width: 75px; margin-bottom: 20px;">
                            <h2 style="color: #0DB8DE;">Recuperación de contraseña</h2>
                            <p style="color: #ffffff;">Hola,</p>
                            <p style="color: #ffffff;">Hemos recibido una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para continuar:</p>
                            <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; margin: 20px 0; font-size: 16px; color: #fff; background-color: #0DB8DE; text-decoration: none; border-radius: 5px;">Restablecer contraseña</a>
                            <p style="color: #ffffff;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
                            <p style="color: #ffffff;">Gracias,</p>
                            <p style="color: #ffffff;">El equipo de Gestión AW</p>
                        </div>
                    `,
                    attachments: [
                        {
                            filename: 'calendario_oscuro.png',
                            path: 'public/images/calendario_oscuro.png', 
                            cid: 'calendarioLogo' 
                        }
                    ]
                };
                
                transport.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        return res.status(500).json({ success: false, message: 'Error al enviar el correo de recuperación.' });
                    }
                    res.status(200).json({ success: true, message: `Se ha enviado un correo a ${email} con instrucciones para restablecer la contraseña.` });
                });
            });
        });
    });

    // Ruta cambiar contraseña
    router.patch('/updatepassword', validateRecover, async (req, res, next) => {
        const { email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        pool.getConnection((err, connection) => {
            if (err) {
                err.message = 'Error al obtener conexión de la base de datos para actualizar la contraseña.';
                return next(err);
            }

            connection.query('UPDATE usuarios SET password = ? WHERE email = ?', [hashedPassword, email], (err, rows) => {
                connection.release();
                if (err) {
                    err.message = 'Error al actualizar la contraseña en la base de datos.';
                    return next(err);
                }
                res.status(200).send('Contraseña actualizada correctamente');
            });
        });
    });

    return router;
}

module.exports = createAuthRouter;
