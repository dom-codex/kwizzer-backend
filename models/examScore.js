const Sequelize = require("sequelize");
const sequelize = require("../utils/database");

const ExamScore = sequelize.define("Examscore", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  Examscore: { type: Sequelize.DOUBLE, default: 0.0 },
  examsheet: Sequelize.STRING,
});
module.exports = ExamScore;
