const Sequelize = require("sequelize");
const sequelize = require("../utils/database");

const Hall = sequelize.define("hall", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  completed: Sequelize.BOOLEAN,
});
module.exports = Hall;
