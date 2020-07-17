const Sequelize = require("sequelize");
const sequelize = require("../utils/database");

const Score = sequelize.define("score", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  score: Sequelize.DOUBLE,
  questId: Sequelize.STRING,
});
module.exports = Score;
