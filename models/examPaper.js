const Sequelize = require("sequelize");
const sequelize = require("../utils/database");

const ExamPaper = sequelize.define("examPaper", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  completed: Sequelize.BOOLEAN,
});
module.exports = ExamPaper;
