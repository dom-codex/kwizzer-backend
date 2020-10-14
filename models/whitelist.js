const Sequelize = require("sequelize");
const sequelize = require("../utils/database");

const WhiteList = sequelize.define("whitelist", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  candidateName: Sequelize.STRING,
  candidateEmail: Sequelize.STRING,
  exam: Sequelize.STRING,
});
module.exports = WhiteList;
