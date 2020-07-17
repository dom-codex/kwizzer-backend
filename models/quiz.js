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
  totalMarks: Sequelize.INTEGER,
  marks: Sequelize.DOUBLE,
});
module.exports = Quiz;
