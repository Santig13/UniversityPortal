const { Router } = require('express');
const bcrypt = require('bcrypt');
const { validateLogIn, validateUser } = require('../schemas/users');


function createAuthRouter(pool, sessionMiddleware) {
    const router = Router();

    router.use(sessionMiddleware); // Usar el middleware de sesión

    // Ruta login
    router.post('/login', validateLogIn, async (req, res, next) => {
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

    // Ruta logout
    router.post('/logout', (req, res) => {
        req.session.destroy(err => {
            if (err) return res.status(500).send('Error al cerrar sesión');
            res.redirect('/');
        });
    });

    // Ruta registro
    router.post('/register', validateUser, async (req, res, next) => {
        const {nombre, email, telefonoCompleto,facultad,rol, password}=req.body;
        const hashedPassword = await bcrypt.hash(password, 10); // hash password 10 salt rounds

        const consultaINSERTuser = 'INSERT INTO usuarios(nombre,email,telefono,facultad_id,rol,accesibilidad_id,password) VALUES(?,?,?,?,?,?,?)';
        const consultaSELECTfacultad = 'SELECT id FROM facultades WHERE nombre=?';
        const consultaINSERTfacultad = 'INSERT INTO facultades(nombre) VALUES(?)';

        function insertarUsuario(connection, facultad_id) {
            connection.query(consultaINSERTuser, [nombre, email, telefonoCompleto, facultad_id,rol,1, hashedPassword], (err, rows) => {
                connection.release();
                if (err) return next(err);
                res.redirect('/?success=true&type=register');
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

    // Ruta recuperar contraseña
    router.post('/recover', (req, res) => {
        const { email } = req.body;
        pool.getConnection((err, connection) => {
            if (err) return next(err);

            connection.query('SELECT * FROM usuarios WHERE email = ?', [email], (err, rows) => {
            connection.release();
            if (err) return next(err);

            if (rows.length > 0) {
                const user = rows[0];
                res.render('restorepassword', { email: email, user: user }); // le paso el user por si acaso meto header tambien
            } else {
                res.status(400).send('Email no encontrado');
            }
            });
        });
    });

    // Ruta cambiar contraseña
    router.patch('/updatepassword', async (req, res, next) => {
        const { email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
    
        pool.getConnection((err, connection) => {
            if (err) return next(err);
            
            connection.query('UPDATE usuarios SET password = ? WHERE email = ?', [hashedPassword, email], (err, rows) => {
                connection.release();
                if (err) return next(err);
                res.status(200).send('Contraseña actualizada correctamente');
            });
        });
    });

    return router;
}

module.exports = createAuthRouter;
