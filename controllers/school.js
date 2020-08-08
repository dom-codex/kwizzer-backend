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
const { validateNewQuizData } = require("../helpers/newQuizValidator");
const { validationResult } = require("express-validator");
const { HandleUserError } = require("../helpers/errorHandler");
//custom imports
module.exports.createSchool = async (req, res, next) => {
  //retrieve details from form body
  const { owner, name, email, password } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const input = HandleUserError(req.body, errors, req);
    return res.json({
      code: 403,
      data: input,
    });
  }
  const hashedPasword = await bcrypt.hash(password, 12);
  crypto.randomBytes(20, async (err, buffer) => {
    const ref = buffer.toString("hex");
    const school = await School.create({
      name: name,
      ref: ref,
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({
        code: 403,
        email: email,
        message: "invalid email or password",
      });
    }
    const sch = await School.findOne({
      where: { email: email },
      attributes: { exclude: ["id", "createdAt", "updatedAt", "password"] },
    });
    return res.json({
      school: sch,
      code: 200,
      message: "authenticated!!!",
    });
  } catch (err) {
    console.log(err);
  }
};
module.exports.setQuiz = async (req, res, next) => {
  try {
    /**get teachers id and the school and class id which the quiz belongs to */
    const {
      title,
      markPerQuestion,
      noOfQuestionForStud,
      totalMarks,
      school,
    } = req.body;
    //perform basic checks
    const result = validateNewQuizData(req);
    if (!result.result) {
      return res.json({
        code: 403,
        message: result.message,
      });
    }
    const sch = await School.findOne({ where: { ref: school } });
    crypto.randomBytes(20, async (err, buffer) => {
      const token = buffer.toString("hex");
      const quiz = await Quiz.create({
        title: title,
        schoolId: sch.id,
        marks: markPerQuestion,
        totalMarks: totalMarks,
        nQuestions: noOfQuestionForStud,
        ref: token,
        published: false,
      });
    });
    res.json({
      code: 200,
      message: "quiz created successfully!!!",
    });
  } catch (err) {}
};
module.exports.getSingleQuiz = async (req, res, next) => {
  const { quid } = req.query;
  const quiz = await Quiz.findOne({
    where: { id: quid },
  });
  res.json({
    code: 200,
    quiz: quiz,
  });
};
module.exports.retrieveQuizzes = async (req, res, next) => {
  const { sid } = req.query;
  if (!sid)
    return res.json({
      code: 401,
      message: "classblock does not exist",
    });
  //find school
  const sch = await School.findOne({ where: { ref: sid }, attributes: ["id"] });
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
  const { name, mark, total, nQuestions } = req.body;
  const quiz = await Quiz.findOne({
    attributes: {
      exclude: ["schoolId", "createdAt", "updatedAt", "published"],
    },
    where: { ref: quizid },
  });
  quiz.title = name;
  quiz.marks = mark;
  (quiz.totalMarks = total), (quiz.nQuestions = nQuestions);
  await quiz.save();
  res.json({
    code: 201,
  });
};
/*module.exports.retrieveAllClassQuiz = async (req, res, next) => {
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
};*/
module.exports.getAllQuizQuestions = async (req, res, next) => {
  const { quid } = req.query;
  //get quiz
  const quiz = await Quiz.findOne({
    attributes: {
      exclude: ["schoolId", "createdAt", "updatedAt", "published"],
    },
    where: { ref: quid },
  });
  const myquiz = {
    name: quiz.title,
    total: quiz.totalMarks,
    mark: quiz.marks,
    nQuestions: quiz.nQuestions,
  };
  const questions = await Question.findAll({
    where: { quizId: quiz.id },
    include: [Options],
  });
  res.json({
    questions: questions,
    quiz: myquiz,
  });
};
module.exports.deleteQuiz = async (req, res, next) => {
  //retrieve quiz creator details
  const { sid, quid } = req.query;
  const sch = await School.findOne({
    where: { ref: sid },
  });
  const quiz = await Quiz.findOne({
    where: { id: quid },
    include: School,
  });
  const registeredStudents = await Hall.findAll({ where: { quizId: quid } });
  const students = registeredStudents.map((stud) => {
    return stud.personId;
  });
  const destroyedQuiz = await Quiz.destroy({
    where: {
      schoolId: sch.id,
      id: quid,
    },
  });
  //check info returned after deletion later
  /*students.forEach(async (stud) => {
    await studentNotification.create({
      message: `${quiz.title} has been deleted thus you can no longer take this quiz and it wont't appear in your list of quiz`,
      personId: stud,
      schoolName: quiz.school.name,
      time: "12:00pm",
    });
  });
  students.forEach((uid) => {
    io.getIO()
      .to(uid)
      .emit("notify", {
        message: `${quiz.title} has been deleted thus you can no longer take this quiz and it wont't appear in your list of quiz`,
        schoolName: quiz.school.name,
        time: "12:00pm",
      });
  });*/
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
    const quiz = await Quiz.findOne({
      where: { ref: quid },
      attributes: ["id", "totalQuestions"],
    });
    const test = await Question.create({
      question: question,
      questionUrl: "",
      quizId: quiz.id,
    });
    const myoptions = formatOptions(options, answer);
    //loop through the options
    myoptions.forEach(async (option) => {
      await test.createOption({
        isAnswer: option.isAnswer,
        option: option.option,
      });
    });
    quiz.totalQuestions = quiz.totalQuestions + 1;
    await quiz.save();
    res.json({
      code: 201,
      message: "question created successfully",
    });
  } catch (err) {}
};
module.exports.getSingleQuestion = async (req, res, next) => {
  const { qu, quiz } = req.query;
  //qu == question id
  const myQuiz = await Quiz.findOne({
    where: { ref: quiz },
    attributes: ["id"],
  });
  const question = await Question.findOne({
    where: { QuizId: myQuiz.id, id: qu },
    include: Options,
  });
  res.json({
    question: question,
  });
};
module.exports.updateQuestion = async (req, res, next) => {
  //retrieve question id from the request body
  const { quid, quiz } = req.query;
  const { question, options, answer } = req.body;
  const myQuiz = await Quiz.findOne({
    where: { ref: quiz },
    attributes: ["id"],
  });
  const questions = await Question.findOne(
    {
      where: { id: quid, quizId: myQuiz.id },
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
  const { ref } = req.body;
  //find quiz
  let quiz = await Quiz.findOne({
    where: { ref: ref },
    attributes: ["id", "published", "schoolId"],
    // include: School,
  });
  //perform some checks to ensure minimum no of questions is set
  if (quiz.totalQuestions < quiz.nQuestions) {
    return res.json({
      code: 400,
      message: "total no of questions too small",
    });
  }
  quiz.published = true;
  quiz = await quiz.save();
  //classrooms will hold published quiz id
  const c = await Classroom.create({
    quizId: quiz.id,
    schoolId: quiz.schoolId,
  });
  //get all registered candidates
  /* const hallStudents = await Hall.findAll({
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
  });*/
  res.json({
    code: 201,
    message: "published successfully!!!",
  });
};
module.exports.listPublishedQuiz = async (req, res, next) => {
  const { sch } = req.query;
  //find listPublishedQuiz

  const school = await School.findOne({
    where: { id: 50 },
  });
  const quizzes = await Quiz.findAll({
    where: {
      schoolId: school.id,
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
module.exports.listOnlyPublishedQuiz = async (req, res, next) => {
  const { sch } = req.query;
  //find school
  const school = await School.findOne({
    where: { ref: sch },
  });
  const published = await Classroom.findAll({
    where: { schoolId: school.id },
    include: Quiz,
  });
  res.json({
    code: 200,
    published: published,
  });
};
/*module.exports.listRegisteredCandidates = async (req, res, next) => {
  try {
    const { sch, quiz } = req.query;
    const hallstud = await Hall.findAll({
      where: { quizId: quiz, schoolId: sch },
      include: Person,
    });
    if (!hallstud.length) {
      return res.json({
        code: 400,
        message: "No student has registered",
      });
    }
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
    .select("-questions")
    .sort({ score: -1 });
  /*const studentsResult = [];
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
    result: questionPapers,
  });
};*/
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
