const bcrypt = require("bcryptjs");
const School = require("../models/school");
const Person = require("../models/person");
const Teacher = require("../models/teacher");
const Classblock = require("../models/class");
const Classroom = require("../models/classrooms");
const Quiz = require("../models/quiz");
const Question = require("../models/questions");
const Options = require("../models/options");
//model imports
const formatQuizAndQuestion = require("../helpers/fomatQuizOutput").formatQuiz;
//custom imports
module.exports.createSchool = async (req, res, next) => {
  //retrieve details from form body
  const { owner, name, description, email, password } = req.body;
  const hashedPasword = await bcrypt.hash(password, 12);
  const schowner = await Person.findByPk(owner);
  const school = await schowner.createSchool({
    name: name,
    description: description,
    email: email,
    password: hashedPasword,
  });
  res.json({
    code: 201,
    message: "school created!!!",
  });
};
module.exports.loginSchool = async (req, res, next) => {
  //retrieve details from body
  const { email, password } = req.body;
  //find school with associated email
  try {
    const sch = await School.findAll({ where: { email: email } });
    const isPassword = await bcrypt.compare(password, sch[0].password);
    if (!isPassword) {
      return res.json({
        code: 400,
        message: "access denied",
      });
    }
    return res.json({
      code: 200,
      message: "authenticated!!!",
    });
  } catch (err) {
    console.log("error occured");
  }
};
/*module.exports.createClassBlock = async (req, res, next) => {
  //retrieve details from body
  //sid === school id
  try {
    const { sid, name, description } = req.body;
    const sch = await School.findByPk(sid);
    const classblock = await sch.createClassblock({
      name: name,
      description: description,
    });
    return res.json({
      code: 201,
      message: "class created!!!",
    });
  } catch (err) {
    console.log(err.message);
  }
};
module.exports.addTeacher = async (req, res, next) => {
  try {
    //retrieve details from body
    //cid === class id
    const { cid, sid, email } = req.body;
    const teacher = await Person.findAll({ where: { email: email } });
    Teacher.create({
      schoolId: sid,
      classblockId: cid,
      personId: teacher[0].id,
    });
    res.json({
      code: 201,
      message: "new teacher added",
    });
  } catch (e) {
    console.log(e.message);
  }
};
module.exports.removeTeacher = async (req, res, next) => {
  //retrieve teachers details
  const { tref, sid, cid } = req.query;
  if (!tref && !sid && !cid)
    return res.json({
      code: 400,
      message: "teacher or class block or school does not exist",
    });
  const deletedTeacher = await Teacher.destroy({
    personId: tref,
    schoolId: sid,
    classblockId: cid,
  });
  res.json({
    code: 201,
    message: "teacher removed successfully",
  });
};*/
module.exports.setQuiz = async (req, res, next) => {
  try {
    /**get teachers id and the school and class id which the quiz belongs to */
    const { title, tid, sid } = req.body;
    const quiz = await Quiz.create({
      title: title,
      personId: tid,
      schoolId: sid,
    });
    res.json({
      code: 200,
      message: "class created successfully!!!",
    });
  } catch (err) {}
};
module.exports.retrieveAllClassQuiz = async (req, res, next) => {
  //retrieve classblock id from query param
  const { cbId } = req.query;
  if (!cbId)
    return res.json({
      code: 401,
      message: "classblock does not exist",
    });
  //retrieve all quiz associated with classblock
  const quizzes = await Quiz.findAll({
    where: { classblockId: cbId },
    include: Person,
  });
  const questions = await Question.findAll({
    where: { quizId: 1 },
    include: [Quiz, Options],
  });
  if (!quizzes.length)
    return res.json({
      code: 401,
      message: "no quiz was found",
    });
  //format ouput to include both quiz and its associated question
  const formattedQuiz = formatQuizAndQuestion(quizzes, questions);
  res.json({
    code: 200,
    quizzes: formattedQuiz,
  });
};
module.exports.deleteQuiz = async (req, res, next) => {
  //retrieve quiz creator details
  const { tref, sid, quid, cid } = req.query;
  if (!tref && !sid && !quid && !cid)
    return res.json({
      code: 401,
      message: "you don't have sufficient permission to delete this quiz",
    });
  const destroyedQuiz = await Quiz.destroy({
    where: {
      schoolId: sid,
      personId: tref,
      classblockId: cid,
      id: quiz,
    },
  });
  if (!destroyedQuiz)
    return res.json({
      code: 401,
      message: "you don't have sufficient permission to delete this quiz",
    });
  return res.json({
    code: 201,
    message: "quiz successfully deleted!!!",
  });
};
module.exports.setQuestion = async (req, res, next) => {
  try {
    //retrive quiz id from request body
    //options should be an array of option object with an is answer field set
    const { quid, question, options } = req.body;
    //retrive quiz
    const quiz = await Quiz.findByPk(quid);
    const test = await Question.create({
      question: question,
      questionUrl: "",
      quizId: quid,
    });
    //loop through the options
    options.forEach(async (option) => {
      await test.createOption({
        isAnswer: option.isAnswer,
        option: option.option,
      });
    });
    res.json({
      code: 201,
      message: "question created successfully",
    });
  } catch (err) {}
};
module.exports.editQuiz = async (req, res, next) => {};
module.exports.updateQuestion = async (req, res, next) => {
  //retrieve question id from the request body
  //qref === question id
  //tref === teacher id
  //quiref ===  quiz id
  const { qref, tref, quiref } = req.query;
  //find teacher
  const teacher = await Person.findOne({ where: { id: tref } });
  const quiz = await Quiz.findOne({ where: { id: quiref } });
  if (!qref)
    return res.json({
      code: 401,
      message: "no question found",
    });
  if (!teacher && !quiz)
    return res.json({
      code: 401,
      message: "invalid parameters",
    });
  const questions = await Question.findByPk(qref, { include: Options });
  if (!questions)
    return res.json({
      code: 401,
      message: "no question found",
    });
  res.json({
    code: 200,
    questions: questions,
  });
};
module.exports.enrollStudent = async (req, res, next) => {
  try {
    //retrieve details from body
    //sid === school id
    //pid === person id(student)
    const { sid, pid } = req.body;
    Classroom.create({
      schoolId: sid,
      personId: pid,
    });
    return res.json({
      code: 201,
      message: "student enrolled sucessfully",
    });
  } catch (err) {
    console.log(err.message);
  }
};
