const express = require('express');
const Sequelize = require('sequelize');
const bodyParser = require('body-parser');
//third party imports
const sequelize = require('./utils/database');
const person = require('./models/person');
const userRoutes = require('./routes/user');
//custom imports
const app = express();
//initializations
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/',userRoutes);
sequelize.sync().then(_=>{
console.log('connected');
app.listen(3000)
})
.catch(e=>console.log(e))