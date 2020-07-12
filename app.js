const express = require('express');
const Sequelize = require('sequelize');
//third party imports
const sequelize = require('./utils/database');
const person = require('./models/person');
//custom imports
const app = express();
//initializations
sequelize.sync().then(_=>{
console.log('connected');
app.listen(3000)
})
.catch(e=>console.log(e))