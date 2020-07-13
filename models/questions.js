const Sequelize = require('sequelize');
const sequelize = require('../utils/database');

const Question = sequelize.define('question',{
    id: {
        type:Sequelize.INTEGER,
        autoIncrement:true,
        allowNull:false,
        primaryKey:true
    },
}); 
module.exports = Question;