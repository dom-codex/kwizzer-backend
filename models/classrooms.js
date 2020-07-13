const Sequelize = require('sequelize');
const sequelize = require('../utils/database');

const Classroom = sequelize.define('classroom',{
    id: {
        type:Sequelize.INTEGER,
        autoIncrement:true,
        allowNull:false,
        primaryKey:true
    },
}); 
module.exports = Classroom;