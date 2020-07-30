const Sequelize = require("sequelize");
const sequelize = require("../utils/database");

const StudentNotification = sequelize.define("studentNotification", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  message: Sequelize.STRING,
  time: Sequelize.STRING,
  schoolName: Sequelize.STRING,
});
module.exports = StudentNotification;
