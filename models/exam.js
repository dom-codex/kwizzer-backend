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
  nQuiz: { type: Sequelize.INTEGER, default: 0 },
  type: { type: Sequelize.STRING, default: "standard" },
  TotalMarks: Sequelize.INTEGER,
  hours: Sequelize.STRING,
  minutes: Sequelize.STRING,
  seconds: Sequelize.STRING,
  ref: Sequelize.STRING,
  resultDelivery: Sequelize.STRING,
  noOfStudents: { type: Sequelize.INTEGER, default: 0 },
  canRetry: { type: Sequelize.BOOLEAN, default: false },
  canReg: { type: Sequelize.BOOLEAN, default: false },
  canStart: { type: Sequelize.BOOLEAN, default: false },
  retries: { type: Sequelize.INTEGER, default: 0 },
});
module.exports = Exam;
