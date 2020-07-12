const Sequelize = require("sequelize");
const sequelize = new Sequelize("learned", "root", process.env.mysqlPassword, {
  dialect: "mysql",
  host: "localhost",
});
module.exports = sequelize;