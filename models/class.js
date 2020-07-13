const Sequelize = require('sequelize');
const sequelize = require('../utils/database');

const classBlock = sequelize.define('classblock',{
    id: {
        type:Sequelize.INTEGER,
        autoIncrement:true,
        allowNull:false,
        primaryKey:true
    },
    name:{
        type:Sequelize.STRING,
        allowNull:false
    },
    description:{
        type:Sequelize.STRING,
        allowNull:true
    }  
});
module.exports = classBlock;