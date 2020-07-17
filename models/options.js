const Sequelize = require('sequelize');
const sequelize = require('../utils/database');

const Options = sequelize.define('option',{
    id: {
        type:Sequelize.INTEGER,
        autoIncrement:true,
        allowNull:false,
        primaryKey:true
    },
    isAnswer:Sequelize.BOOLEAN,
    option:Sequelize.STRING
}); 
module.exports = Options;