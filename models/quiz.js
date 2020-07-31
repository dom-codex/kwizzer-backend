const Sequelize = require("sequelize");
const sequelize = require("../utils/database");

const Quiz = sequelize.define("quiz", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  title: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  choice: Sequelize.STRING,
  published: Sequelize.BOOLEAN,
  canReTake: Sequelize.BOOLEAN,
  mode: Sequelize.STRING,
  totalMarks: Sequelize.INTEGER,
  totalQuestions: { type: Sequelize.INTEGER, default: 0 },
  retries: { type: Sequelize.INTEGER, default: 0 },
  marks: Sequelize.DOUBLE,
  hours: Sequelize.INTEGER,
  minutes: Sequelize.INTEGER,
  seconds: Sequelize.INTEGER,
  nQuestions: Sequelize.INTEGER,
  NumberOfSubmitted: {
    type: Sequelize.INTEGER,
    default: 0,
  },
});
module.exports = Quiz;
