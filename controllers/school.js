const bcrypt = require("bcryptjs");
const School = require("../models/school");
const Person = require("../models/person");
const Teacher = require("../models/teacher");
const Classblock = require("../models/class");
const Classroom = require("../models/classrooms");
const Quiz = require("../models/quiz");
const Question = require("../models/questions");
const Options = require("../models/options");
const Scores = require("../models/scoreBoad");
const studentNotification = require("../models/studentNotification");
const adminNotifications = require("../models/schoolNotification");
//model imports
const crypto = require("crypto");
const Hall = require("../models/hall");
const studentQuestion = require("../models/studentQuestion");
const formatQuizAndQuestion = require("../helpers/fomatQuizOutput").formatQuiz;
const formatOptions = require("../helpers/formatOptions").formatOptions;
const io = require("../socket");
//custom imports
module.exports.createSchool = async (req, res, next) => {
  //retrieve details from form body
  const { owner, name, email, password } = req.body;
  const hashedPasword = await bcrypt.hash(password, 12);
  const schowner = await Person.findOne({ where: { ref: owner } });
  crypto.randomBytes(20, async (err, buffer) => {
    const ref = buffer.toString("hex");
    const school = await schowner.createSchool({
      name: name,
      ref: ref,
      description: "a school",
      email: email,
      password: hashedPasword,
    });
    res.json({
      code: 200,
      school: {
        ref: ref,
      },
      message: "school created!!!",
    });
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
      school: sch[0],
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
    const {
      title,
      markPerQuestion,
      noOfQuestionForStud,
      totalMarks,
      resultDelivery,
      hours,
      min,
      sec,
      school,
    } = req.body;
    const sch = await School.findOne({ where: { ref: school } });

    const quiz = await Quiz.create({
      title: title,
      schoolId: sch.id,
      marks: markPerQuestion,
      totalMarks: totalMarks,
      nQuestions: noOfQuestionForStud,
      choice: "onsubmit",
      hours: hours,
      minutes: min,
      seconds: sec,
    });
    res.json({
      code: 200,
      message: "class created successfully!!!",
    });
  } catch (err) {}
};
module.exports.retrieveQuizzes = async (req, res, next) => {
  const { sid } = req.query;
  if (!sid)
    return res.json({
      code: 401,
      message: "classblock does not exist",
    });
  //find school
  const sch = await School.findOne({ where: { ref: sid } });
  //retrieve all quiz associated with school
  const quizzes = await Quiz.findAll({
    where: { schoolId: sch.id },
    // include: Person,
  });
  res.json({
    code: 200,
    quizzes: quizzes,
  });
};
module.exports.editQuiz = async (req, res, next) => {
  const { quizid } = req.query;
  const { name, mark, total, hr, min, sec, pubMode, nQuestions } = req.body;

  const quiz = await Quiz.findOne({ where: { id: quizid } });
  quiz.title = name;
  quiz.marks = mark;
  (quiz.totalMarks = total), (quiz.hours = hr);
  (quiz.minutes = min), (quiz.seconds = sec), (quiz.mode = pubMode);
  quiz.nQuestions = nQuestions;
  await quiz.save();
  res.json({
    code: 201,
  });
};
module.exports.retrieveAllClassQuiz = async (req, res, next) => {
  //retrieve classblock id from query param
  const { sid } = req.query;
  if (!sid)
    return res.json({
      code: 401,
      message: "classblock does not exist",
    });
  //retrieve all quiz associated with school
  const quizzes = await Quiz.findAll({
    where: { schoolId: schId },
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
module.exports.getAllQuizQuestions = async (req, res, next) => {
  const { quid } = req.query;

  const questions = await Question.findAll({
    where: { quizId: quid },
    include: [Options],
  });
  //get quiz
  const quiz = await Quiz.findOne({ where: { id: quid } });
  const myquiz = {
    name: quiz.title,
    hr: quiz.hours,
    min: quiz.minutes,
    sec: quiz.seconds,
    pubMode: quiz.mode,
    total: quiz.totalMarks,
    mark: quiz.marks,
    nQuestions: quiz.nQuestions,
  };
  res.json({
    questions: questions,
    quiz: myquiz,
  });
};
module.exports.deleteQuiz = async (req, res, next) => {
  //retrieve quiz creator details
  const { sid, quid } = req.query;
  const destroyedQuiz = await Quiz.destroy({
    where: {
      schoolId: sid,
      id: quid,
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
    const { quid } = req.query;
    const { question, options, answer } = req.body;
    //retrive quiz
    const quiz = await Quiz.findByPk(quid);
    const test = await Question.create({
      question: question,
      questionUrl: "",
      quizId: quid,
    });
    const myoptions = formatOptions(options, answer);
    //loop through the options
    myoptions.forEach(async (option) => {
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
module.exports.getSingleQuestion = async (req, res, next) => {
  const { qu } = req.query;
  //qu == question id
  const question = await Question.findOne({
    where: { id: qu },
    include: Options,
  });
  res.json({
    question: question,
  });
};
module.exports.updateQuestion = async (req, res, next) => {
  //retrieve question id from the request body
  const { quid } = req.query;
  const { question, options, answer } = req.body;

  const questions = await Question.findOne(
    {
      where: { id: quid },
    },
    { include: Options }
  );
  if (!questions)
    return res.json({
      code: 401,
      message: "no question found",
    });
  const myoptions = formatOptions(options, answer);
  questions.question = question;
  await questions.save();
  const opts = await Options.findAll({ where: { questionId: quid } });
  opts.forEach(async (o, i) => {
    o.option = myoptions[i].option;
    o.isAnswer = myoptions[i].isAnswer;
    await o.save();
  });
  res.json({
    code: 201,
  });
};
module.exports.publishQuiz = async (req, res, next) => {
  const { id } = req.body;
  //find quiz
  let quiz = await Quiz.findOne({
    where: { id: id },
    include: School,
  });
  quiz.published = true;
  quiz = await quiz.save();
  //classrooms will hold published quiz id
  const c = await Classroom.create({
    quizId: quiz.id,
    schoolId: quiz.schoolId,
  });
  //get all registered candidates
  const hallStudents = await Hall.findAll({
    where: { quizId: id },
  });
  //get ids
  const ids = hallStudents.map((stud) => {
    return stud.personId;
  });
  ids.forEach(async (uid) => {
    await studentNotification.create({
      schoolName: quiz.school.name,
      message: `${quiz.title} quiz has been successfully published, head over to the quiz section to take this quiz !!!`,
      time: "3:45pm",
      personId: uid,
    });
  });
  ids.forEach((uid) => {
    io.getIO()
      .to(uid)
      .emit("notify", {
        message: `${quiz.title} quiz has been successfully published, head over to the quiz section to take this quiz !!!`,
        schoolName: quiz.school.name,
        time: "3:45pm",
      });
  });
  res.json({
    code: 201,
  });
};
module.exports.listPublishedQuiz = async (req, res, next) => {
  const { sch } = req.query;
  //find listPublishedQuiz
  const quizzes = await Quiz.findAll({
    where: {
      schoolId: sch,
      published: true,
    },
  });
  const Publishedquiz = await Hall.findAll({
    where: {
      quizId: 1,
    },
    include: [Person, Quiz],
  });
  //format list
  const reformed = [];
  quizzes.forEach((quiz) => {
    //create a duplicate
    const duplicate = [...Publishedquiz];
    const filtered = duplicate.filter((d) => d.quizId === quiz.id);
    reformed.push({
      quiz: quiz,
      registered: filtered.length,
    });
  });
  res.json({
    quizzes: reformed,
  });
};
module.exports.listRegisteredCandidates = async (req, res, next) => {
  try {
    const { sch, quiz } = req.query;
    const hallstud = await Hall.findAll({
      where: { quizId: quiz, schoolId: sch },
      include: Person,
    });
    res.json({
      hall: hallstud,
    });
  } catch (err) {
    console.log(err.message);
  }
};
module.exports.ApproveResult = async (req, res, next) => {
  const { quiz } = req.query;
  //update all unapproved question papers
  //get school
  const quizz = await Quiz.findOne({
    where: { id: quiz },
    include: School,
  });
  const schoolName = quizz.school.name;
  const papers = await studentQuestion
    .find({
      $and: [{ quiz: quiz }, { isComplete: true }, { isApproved: false }],
    })
    .select("student");
  //get ids
  const ids = papers.map((paper) => {
    return paper.student;
  });
  const updated = await studentQuestion.updateMany(
    { $and: [{ quiz: quiz }, { isComplete: true }] },
    { $set: { isApproved: true } }
  );
  if (updated.n > 0) {
    ids.forEach(async (id) => {
      await studentNotification.create({
        schoolName: schoolName,
        message: "your result has been approved!!!",
        time: "3:44pm",
        personId: id,
      });
    });
    ids.forEach((id) => {
      io.getIO().to(id).emit("notify", {
        message: "your result has been approved!!!",
        schoolName: schoolName,
        time: "3:44pm",
      });
    });
  }
  //send notification
  res.json({
    code: 200,
    updated: updated.n,
  });
};
module.exports.ApproveSingleResult = async (req, res, next) => {
  const { paper } = req.query;
  const studentInfo = await studentQuestion
    .findById(paper)
    .select("student quiz");
  const quiz = await Quiz.findOne({
    where: { id: studentInfo.quiz },
    include: School,
  });
  const schoolName = quiz.school.name;
  const updated = await studentQuestion.updateOne(
    { $and: [{ _id: paper }, { isComplete: true }] },
    { $set: { isApproved: true } }
  );
  const studNotify = await studentNotification.create({
    schoolName: schoolName,
    message: "your result has been approved!!!",
    time: "3:44pm",
    personId: studentInfo.student,
  });
  io.getIO().to(studentInfo.student).emit("notify", {
    message: "your result has been approved!!!",
    schoolName: schoolName,
    time: "3:44pm",
  });
  res.json({
    code: 200,
    updated: updated.n,
  });
};
module.exports.viewStudentResult = async (req, res, next) => {
  const { quiz } = req.query;
  const scores = await Scores.findAll({
    where: { quizId: quiz },
    include: Person,
  });
  //retrieve questionpaper ids
  const ids = scores.map((score) => {
    return score.questId;
  });
  //get question paper from mongo db
  const questionPapers = await studentQuestion
    .find({ _id: { $in: ids } })
    .select("_id score totalMarks fails totalAnswered isComplete")
    .sort({ score: -1 });
  const studentsResult = [];
  questionPapers.forEach((q) => {
    const student = scores.find(
      (score) => score.questId.toString() === q._id.toString()
    );
    studentsResult.push({
      name: student.person.name,
      ...q._doc,
    });
  });
  res.json({
    code: 200,
    result: studentsResult,
  });
};
module.exports.adminNotifications = async (req, res, next) => {
  const { sch } = req.query;
  //get school
  const school = await School.findOne({
    where: { ref: sch },
  });
  //get adminNotifications
  const notifications = await adminNotifications.findAll({
    where: { schoolId: school.id },
  });
  console.error(notifications);
  res.json({
    code: 200,
    notifications: notifications,
  });
};
