const bcrypt = require('bcryptjs');
const School = require('../models/school');
const Person = require('../models/person');
const Teacher = require('../models/teacher');
const Classblock = require('../models/class');
const Classroom = require('../models/classrooms');
const Quiz = require('../models/quiz');

module.exports.createSchool = async(req,res,next) => {
    //retrieve details from form body
    const {owner, name, description, email, password} = req.body;
    const hashedPasword = await bcrypt.hash(password,12);
    const schowner = await Person.findByPk(owner);
    const school = await schowner.createSchool({
        name:name,
        description:description,
        email:email,
        password:hashedPasword
    });
    res.json({
        code:201,
        message:'school created!!!'
    });
};
module.exports.loginSchool = async (req,res,next) =>{
    //retrieve details from body
    const {email,password} = req.body;
    //find school with associated email
    try{
    const sch = await School.findAll({where:{email:email}});
    const isPassword = await bcrypt.compare(password,sch[0].password);
    if(!isPassword){
        return res.json({
            code:400,
            message:'access denied'
        });
    };
    return res.json({
        code:200,
        message:'authenticated!!!'
    })
}catch(err){
    console.log('error occured')
}
};
module.exports.createClassBlock = async (req,res,next)=>{
    //retrieve details from body
    //sid === school id
    try{
    const {sid, name,description} = req.body;
    const sch = await School.findByPk(sid);
    const classblock = await sch.createClassblock({
        name:name,
        description:description
    });
    return res.json({
        code:201,
        message:'class created!!!'
    })
}catch(err){
    console.log(err.message)
}
};
module.exports.addTeacher = async(req,res,next)=>{
    try{
        //retrieve details from body
        //cid === class id
        const {cid, sid, email} = req.body;
        const teacher = await Person.findAll({where:{email:email}});
        Teacher.create({
            schoolId:sid,
            classblockId:cid,
            personId:teacher[0].id
        })
        res.json({
            code:201,
            message:'new teacher added'
        })
    }catch(e){
        console.log(e.message)
    }
};
module.exports.setQuiz = async(req,res,next)=>{
    try{
        /**get teachers id and the school and class id which the quiz belongs to */
        const {title,tid,sid,cid} = req.body;
        const quiz = await Quiz.create({
            title:title,
            personId:tid,
            schoolId:sid,
            classblockId:cid
        }); 
        res.json({
            code:200,
            message:'class created successfully!!!'
        });
    }catch(err){

    }
};
/*module.exports.setQuestion = async(req,res,next) =>{
    try{
        //retrive quiz id from request body
        const {quid} = req.body;
        //retrive quiz 
        const quiz = await Quiz.findByPk(quid);
        quiz.createQuestion({

        })

    }catch(err){

    }
};*/
module.exports.enrollStudent = async (req,res,next)=>{
    try{
        //retrieve details from body
        //sid === school id
        //cid ==== classblock id
        //pid === person id
        const {sid,cid,pid} = req.body;
        Classroom.create({
            classblockId:cid,
            schoolId:sid,
            personId:pid
        });
        return res.json({
            code:201,
            message:'student enrolled sucessfully'
        });
    }catch(err){
        console.log(err.message);
    }
};