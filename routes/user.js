const express = require('express');
const router = express.Router();

const userControllers = require('../controllers/user');

/** route for user signup */
router.post('/user/create',userControllers.createUser);

module.exports =  router;