const express = require('express');
const Sequelize = require('sequelize');
const bodyParser = require('body-parser');
//third party imports
const sequelize = require('./utils/database');
const person = require('./models/person');
const school = require('./models/school');
const classBlock = require('./models/class');
const teacher = require('./models/teacher');
const classroom = require('./models/classrooms');
const quiz = require('./models/quiz');
const question = require('./models/questions');
//db imports
const userRoutes = require('./routes/user');
const schoolRoutes = require('./routes/school');
//custom imports
const app = express();
//initializations
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/school',schoolRoutes);
app.use('/',userRoutes);
//sql associations
person.hasMany(school);

school.hasMany(classBlock);

person.belongsToMany(school,{through:teacher});

classBlock.belongsToMany(person,{through:teacher});

person.belongsToMany(classBlock,{through:classroom});

person.belongsToMany(school,{through:classroom});

quiz.belongsTo(person);

question.belongsTo(quiz);

quiz.belongsTo(school);

quiz.belongsTo(classBlock);

sequelize.sync().then(_=>{
console.log('connected');
app.listen(3000);
})
.catch(e=>console.log(e))