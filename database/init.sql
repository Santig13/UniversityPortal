CREATE DATABASE AW_24;
USE AW_24;
-- tabla intermedia 1-1 para configuracion de accesibilidad de cada usuario
CREATE TABLE IF NOT EXISTS ACCESIBILIDADES (
    id INT AUTO_INCREMENT PRIMARY KEY,
    paleta VARCHAR(100) NOT NULL,
    tamañoTexto VARCHAR(100) NOT NULL,
    navegacion VARCHAR(100) NOT NULL
   -- FOREIGN KEY (id_usuario) REFERENCES USUARIOS(id)
);
-- Relacion 1-N con usuarios
CREATE TABLE IF NOT EXISTS FACULTADES (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
);

-- Se podria dividir en dos tablas hijas pero no se si es necesario
CREATE TABLE IF NOT EXISTS USUARIOS (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    telefono VARCHAR(15) NOT NULL,
    facultad_id INT NOT NULL, 
    rol VARCHAR(100) NOT NULL,
    accesibilidad_id INT NOT NULL,
    password VARCHAR(100) NOT NULL,
    FOREIGN KEY (facultad_id) REFERENCES FACULTADES(id),
    FOREIGN KEY (accesibilidad_id) REFERENCES ACCESIBILIDADES(id)
);

-- Relacion M-N con participantes y N-1 con organizador
CREATE TABLE IF NOT EXISTS EVENTOS (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    fecha DATE NOT NULL,
    hora_ini TIME NOT NULL,
    hora_fin TIME NOT NULL,
    ubicacion VARCHAR(255) NOT NULL,
    capacidad_maxima INT NOT NULL,
    organizador_id INT,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (organizador_id) REFERENCES USUARIOS(id) ON DELETE CASCADE
);
-- tabla intermedia N-M para participantes
CREATE TABLE IF NOT EXISTS Inscripciones (
    usuario_id INT,
    evento_id INT,
    estado VARCHAR(100) NOT NULL,
    fecha_inscripcion DATE NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (usuario_id, evento_id),
    FOREIGN KEY (usuario_id) REFERENCES USUARIOS(id) ON DELETE CASCADE,
    FOREIGN KEY (evento_id) REFERENCES EVENTOS(id) ON DELETE CASCADE
);
-- Lista negra de IPs de gente que ha intentado hacer inyección SQL
CREATE TABLE IF NOT EXISTS LISTA_NEGRA_IPS (
    ip VARCHAR(45)  PRIMARY KEY,
    motivo VARCHAR(255) DEFAULT 'Intento de inyección SQL'
);

-- Tabla de notificaciones para cada usuario
CREATE TABLE IF NOT EXISTS NOTIFICACIONES (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    mensaje TEXT NOT NULL,
    fecha_creacion TIMESTAMP NOT NULL,
    leido BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (usuario_id) REFERENCES USUARIOS(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS registro_uso (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    ip VARCHAR(100) NOT NULL,
    fecha TIMESTAMP NOT NULL,
    horaEntrada TIME NOT NULL,
    horaSalida TIME,
    navegador VARCHAR(100) NOT NULL,
    OS VARCHAR(100) NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES USUARIOS(id) ON DELETE CASCADE
);
/*Lista de calificaciones*/
CREATE TABLE IF NOT EXISTS CALIFICACIONES (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    evento_id INT NOT NULL,
    calificacion INT NOT NULL,
    comentario TEXT,
    fecha TIMESTAMP NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES USUARIOS(id) ON DELETE CASCADE,
    FOREIGN KEY (evento_id) REFERENCES EVENTOS(id) ON DELETE CASCADE
);
/*
INSERT INTO EVENTOS (titulo, descripcion, fecha, hora_ini, hora_fin, ubicacion, capacidad_maxima, organizador_id, activo) VALUES
('Conferencia de Tecnología', 'Una conferencia sobre las últimas tendencias en tecnología.', '2024-12-06', '09:00:00', '12:00:00', 'Informatica, Sala 5', 100, 2, TRUE),
('Taller de Programación', 'Un taller práctico sobre programación en Python.', '2024-12-06', '14:00:00', '17:00:00', 'Informatica, Sala 5', 2, 2, TRUE),
('Seminario de Inteligencia Artificial', 'Un seminario sobre aplicaciones de la inteligencia artificial.', '2024-12-06', '14:00:00', '17:00:00', 'Medicina, Sala de Conferencias', 50, 2, TRUE),
('Mesa Redonda de Ciberseguridad', 'Una mesa redonda con expertos en ciberseguridad.', '2024-12-06', '15:00:00', '18:00:00', 'Informatica, Sala 5', 40, 2, TRUE),
('Hackathon de Desarrollo Web', 'Un hackathon para desarrollar aplicaciones web en 24 horas.', '2024-12-03', '08:00:00', '2024-12-04 08:00:00', 'Medicina, Laboratorio de Innovación', 60, 2, TRUE);
*/
    -- INSERT INTO FACULTADES (nombre) VALUES ('Informatica'), ('Derecho'), ('Economia'), ('Ingenieria'), ('Medicina'), ('Arquitectura'), ('Humanidades'), ('Artes');

    -- INSERT INTO ACCESIBILIDADES (paleta, tamañoTexto, navegacion) VALUES ('oscura', 'Normal', 'ambos');

    INSERT INTO EVENTOS (titulo, descripcion, fecha, hora_ini, hora_fin, ubicacion, capacidad_maxima, organizador_id, activo) VALUES
('Conferencia de Tecnología', 'Una conferencia sobre las últimas tendencias en tecnología.', '2024-12-06', '09:00:00', '12:00:00', 'Informatica, Sala de Conferencias', 100, 2, TRUE),
('Taller de Programación', 'Un taller práctico sobre programación en Python.', '2024-12-06', '14:00:00', '17:00:00', 'Informatica, Sala 5', 2, 2, TRUE),
('Seminario de Salud y Tecnología', 'Un seminario sobre cómo la inteligencia artificial está revolucionando la medicina.', '2024-12-06', '14:00:00', '17:00:00', 'Medicina, Sala de Conferencias 1', 50, 2, TRUE),
('Mesa Redonda de Ética Médica', 'Una discusión sobre los desafíos éticos en ciberseguridad en el ámbito de la salud.', '2024-12-06', '15:00:00', '18:00:00', 'Medicina, Sala 5', 40, 2, TRUE),
('Hackathon de Innovación Médica', 'Un hackathon para desarrollar soluciones tecnológicas para la medicina en 24 horas.', '2024-12-03', '08:00:00', '10:00:00', 'Medicina, Laboratorio de Innovación', 60, 2, TRUE);
