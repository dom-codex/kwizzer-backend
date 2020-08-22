const Sequelize = require("sequelize");
let sequelize;
if (!process.env.DATABASE_URL) {
  sequelize = new Sequelize(
    process.env.dbName,
    process.env.user,
    process.env.mysqlPassword,
    {
      // dialect: "mysql",
      port: process.env.port,
      dialect: "postgres",
      host: process.env.host,
    }
  );
} else {
  sequelize = new Sequelize(process.env.DATABASE_URL);
}
//127.0.0.1:53926/?key=758cff90-0187-469b-b13c-9522bc01002d
module.exports = sequelize;
