const Sequelize = require('sequelize');
const sequelize = require('../util/database');


const message=sequelize.define('message',{
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    message:{
        type:Sequelize.STRING,
        allowNull:false
    },
    userId:{
        type:Sequelize.STRING,
        allowNull:false
    }

})

module.exports=message;