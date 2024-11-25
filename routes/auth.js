const { Router } = require('express');
const bcrypt = require('bcrypt');
const UAParser = require('ua-parser-js');
const { validateLogIn, validateUser } = require('../schemas/users');


//Funcion para registrar ip negador fecha y user en una tabla 
function registroUso(connection,req,callback) {
    const ip = req.ip;
    const fecha = new Date();
    const user = req.session.user.id;
    const userAgent = req.headers['user-agent'];
    const parser = new UAParser(userAgent);
    const browser = parser.getBrowser(); // Detecta el navegador
    const os = parser.getOS(); // Detecta el sistema operativo
    const sql = 'INSERT INTO registro_uso(ip, fecha, usuario_id,navegador,OS) VALUES(?,?,?,?,?)';
    connection.query(sql, [ip, fecha, user,browser.name,os.name], (err) => {
        if (err) {
            err.message = 'Error al registrar el uso de la aplicación.';
            return callback(err);
        }
        return callback(null);
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
                            registroUso(connection,req, (err)=>{
                                if (err) {
                                    err.message = 'Error al registrar el uso de la aplicación.';
                                    return next(err);
                                }
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
        req.session.destroy(err => {
            if (err) {
                err.message = 'Error al cerrar la sesión.';
                return next(err);
            }
            res.redirect('/');
        });
    });

    // Ruta registro
    router.post('/register', validateUser, async (req, res, next) => {
        const { nombre, email, telefonoCompleto, facultad, rol, password } = req.body; 
        const hashedPassword = await bcrypt.hash(password, 10); // hash password 10 salt rounds

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
    router.post('/recover', (req, res, next) => {
        const { email } = req.body;
        pool.getConnection((err, connection) => {
            if (err) {
                err.message = 'Error al obtener conexión de la base de datos para la recuperación de contraseña.';
                return next(err);
            }

            connection.query('SELECT * FROM usuarios WHERE email = ?', [email], (err, rows) => {
                connection.release();
                if (err) {
                    err.message = 'Error al consultar la base de datos para encontrar el usuario.';
                    return next(err);
                }

                if (rows.length > 0) {
                    const user = rows[0];
                    res.render('restorepassword', { email: email, user: user });
                } else {
                    res.redirect('/?fail=true&type=recover');
                }
            });
        });
    });

    // Ruta cambiar contraseña
    router.patch('/updatepassword', async (req, res, next) => {
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
