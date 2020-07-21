const express = require("express");
const Sequelize = require("sequelize");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
//third party imports
const sequelize = require("./utils/database");
const person = require("./models/person");
const school = require("./models/school");
//const classBlock = require("./models/class");
//const teacher = require("./models/teacher");
const classroom = require("./models/classrooms");
const quiz = require("./models/quiz");
const question = require("./models/questions");
const option = require("./models/options");
const scoreboard = require("./models/scoreBoad");
//model imports
const userRoutes = require("./routes/user");
const schoolRoutes = require("./routes/school");
//custom imports
const app = express();
//initializations
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});
app.use("/school", schoolRoutes);
app.use("/", userRoutes);
//sql associations
person.hasMany(school, { constraints: true, onDelete: "CASCADE" });

//school.hasMany(classBlock);

//person.belongsToMany(school, { through: teacher });

//assBlock.belongsToMany(person, { through: teacher });

//person.belongsToMany(classBlock, { through: classroom });

person.belongsToMany(school, {
  through: classroom,
  constraints: true,
  onDelete: "CASCADE",
});

quiz.belongsTo(school, { constraints: true, onDelete: "CASCADE" });

question.belongsTo(quiz, { constraints: true, onDelete: "CASCADE" });

//quiz.belongsTo(school);

//quiz.belongsTo(classBlock);

question.hasMany(option, { constraints: true, onDelete: "CASCADE" });

quiz.hasMany(scoreboard, { constraints: true, onDelete: "CASCADE" });

person.hasMany(scoreboard, { constraints: true, onDelete: "CASCADE" });

//classBlock.hasMany(scoreboard);
sequelize
  .sync()
  .then((_) => {
    mongoose.connect("mongodb://127.0.0.1:27017/learned").then((_) => {
      app.listen(3500);
      console.log("connected");
    });
  })
  .catch((e) => console.log(e));
