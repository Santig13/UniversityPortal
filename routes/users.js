const exp = require('constants');
const { controller } = require('../controllers/controller.js');
const { Router } = require('express');

export const router=Router();

router.get('/',controller.getInicio);
router.get('/registro',controller.getRegistro);

router.get('/login',controller.getUsuario);

router.post('/registro',controller.crearUsuario);