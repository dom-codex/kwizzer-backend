const Sequelize = require("sequelize");
const sequelize = require("../utils/database");

const Exam = sequelize.define("exam", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  nQuiz: Sequelize.INTEGER,
  TotalMarks: Sequelize.INTEGER,
  hours: Sequelize.STRING,
  minutes: Sequelize.STRING,
  seconds: Sequelize.STRING,
  resultDelivery: Sequelize.STRING,
  noOfStudents: { type: Sequelize.INTEGER, default: 0 },
});
module.exports = Exam;
