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
    FOREIGN KEY (organizador_id) REFERENCES USUARIOS(id) ON DELETE CASCADE
);
-- tabla intermedia N-M para participantes
CREATE TABLE IF NOT EXISTS Inscripciones (
    usuario_id INT,
    evento_id INT,
    estado VARCHAR(100) NOT NULL,
    fecha_inscripcion DATE NOT NULL,
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
    horaEntrada TIME NOT NULL,
    horaSalida TIME,
    FOREIGN KEY (usuario_id) REFERENCES USUARIOS(id) ON DELETE CASCADE,
    FOREIGN KEY (evento_id) REFERENCES EVENTOS(id) ON DELETE CASCADE
);
/*
INSERT INTO EVENTOS (titulo, descripcion, fecha, hora, ubicacion, capacidad_maxima, organizador_id)
VALUES 
('Charla de Tecnología Avanzada', 'Sesión sobre las últimas tendencias en IA y Big Data', '2024-12-01', '10:00:00', 'Auditorio Central', 100, 5),
('Taller de Programación en Python', 'Un taller práctico sobre desarrollo de software usando Python', '2024-11-20', '14:00:00', 'Laboratorio 3', 30, 5),
('Conferencia de Marketing Digital', 'Aprende sobre estrategias y tendencias en marketing digital.', '2024-11-15', '09:00:00', 'Sala de Conferencias 1', 50, 5),
('Feria de Innovación y Emprendimiento', 'Exposición de proyectos innovadores y startups.', '2024-12-10', '12:00:00', 'Explanada Principal', 200, 5),
('Seminario de Ciberseguridad', 'Discusión sobre técnicas y desafíos en seguridad informática.', '2024-11-25', '16:00:00', 'Salón de Clases B', 40, 5),
('Jornada de Networking', 'Encuentro para hacer contactos en diferentes áreas profesionales.', '2024-12-05', '18:00:00', 'Salón de Eventos', 150, 5),
('Workshop de Diseño Gráfico', 'Taller intensivo sobre herramientas de diseño gráfico.', '2024-11-30', '10:30:00', 'Aula de Arte', 25, 5),
('Simposio de Inteligencia Artificial', 'Presentación de investigaciones recientes en IA.', '2024-12-08', '11:00:00', 'Sala de Conferencias 2', 80, 5),
('Curso de Desarrollo Web', 'Aprende a construir sitios web interactivos desde cero.', '2024-11-18', '15:00:00', 'Laboratorio 1', 35, 5),
('Charla sobre Economía Circular', 'Discusión sobre sostenibilidad y economía circular.', '2024-12-03', '13:00:00', 'Auditorio Pequeño', 60, 5);
    */