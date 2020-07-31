const Sequelize = require("sequelize");
const sequelize = require("../utils/database");

const SchoolNotification = sequelize.define("schoolNotification", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  message: Sequelize.STRING,
  time: Sequelize.STRING,
  topic: Sequelize.STRING,
  isNew: Sequelize.BOOLEAN,
});
module.exports = SchoolNotification;
