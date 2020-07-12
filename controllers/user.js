const bcrypt = require('bcryptjs');
const Person = require('../models/person');
//third party imports
module.exports.createUser = async(req,res,next)=>{
    //retrive data from body
    const {name, password} = req.body;
    //check for errors later
    //hash password
    const hashedPassword = await bcrypt.hash(password,12);
    const person = await Person.create({
        name:name,
        password:hashedPassword
    });
    res.json({
        code:201,
        message:'account sucessfully created!!!'
    });
};
