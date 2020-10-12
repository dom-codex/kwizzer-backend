const http = require("http");
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
const Hall = require("./models/hall");
//model imports
const userRoutes = require("./routes/user");
const schoolRoutes = require("./routes/school");
const Quiz = require("./models/quiz");
const studNotification = require("./models/studentNotification");
const schNotification = require("./models/schoolNotification");
const exam = require("./models/exam");
const examPaper = require("./models/examPaper");
const examscore = require("./models/examScore");
const authRoute = require("./routes/authentication");
//custom imports
const app = express();
const server = http.createServer(app);
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
app.use("/validate", authRoute);
app.use("/", userRoutes);
//sql associations
quiz.belongsTo(school, { constraints: true, onDelete: "CASCADE" });

question.belongsTo(quiz, { constraints: true, onDelete: "CASCADE" });
question.hasMany(option, { constraints: true, onDelete: "CASCADE" });

quiz.hasMany(scoreboard, { constraints: true, onDelete: "CASCADE" });

person.hasMany(scoreboard, { constraints: true, onDelete: "CASCADE" });
scoreboard.belongsTo(person, { constraints: true, onDelete: "CASCADE" });

classroom.belongsTo(quiz, { constraints: true, onDelete: "CASCADE" });

classroom.belongsTo(school, { constraints: true, onDelete: "CASCADE" });
schNotification.belongsTo(school, { constraints: true, onDelete: "CASCADE" });
studNotification.belongsTo(person, { constraints: true, onDelete: "CASCADE" });

Hall.belongsTo(person);
Hall.belongsTo(Quiz);
Hall.belongsTo(school);

exam.belongsTo(school, { constraints: true, onDelete: "CASCADE" });
quiz.belongsToMany(exam, {
  through: examPaper,
  constraints: true,
  onDelete: "CASCADE",
});
examPaper.belongsTo(quiz, {
  constraints: true,
  onDelete: "CASCADE",
});
examscore.belongsTo(exam, { constraints: true, onDelete: "CASCADE" });
examscore.belongsTo(person, { constraints: true, onDelete: "CASCADE" });
examscore.belongsTo(school, { constraints: true, onDelete: "CASCADE" });
//classBlock.hasMany(scoreboard);
sequelize
  .sync()
  .then((_) => {
    mongoose.connect(process.env.mongo).then((_) => {
      server.listen(3500);
      const io = require("./socket").init(server); //socket server initialization
      io.on("connect", (socket) => {
        const roomNo = socket.handshake.query.ref;
        socket.join(roomNo);
        console.log("client connected");
        socket.on("studreceived", async (data) => {
          await studNotification.update(
            { isNew: false },
            { where: { id: data } }
          );
        });
        socket.on("adminreceived", async (data) => {
          await schNotification.update(
            { isNew: false },
            { where: { id: data } }
          );
        });
      });
      console.log("connected");
    });
  })
  .catch((e) => console.log(e));
