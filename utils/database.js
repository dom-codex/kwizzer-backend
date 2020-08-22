const Sequelize = require("sequelize");
const sequelize = new Sequelize(
  "learned",
  "postgres",
  process.env.mysqlPassword,
  {
    // dialect: "mysql",
    port: 5432,
    dialect: "postgres",
    host: "localhost",
  }
);
//127.0.0.1:53926/?key=758cff90-0187-469b-b13c-9522bc01002d
module.exports = sequelize;
