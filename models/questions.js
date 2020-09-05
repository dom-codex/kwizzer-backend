const Sequelize = require("sequelize");
const sequelize = require("../utils/database");

const Question = sequelize.define("question", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  question: Sequelize.STRING({ length: 10485759 }),
  questionUrl: Sequelize.STRING,
  ref: Sequelize.STRING,
});
module.exports = Question;
