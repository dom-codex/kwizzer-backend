const moment = require("moment");
const studentNotification = require("../models/studentNotification");
const ExamSheet = require("../models/examQuestions");
const examQuestions = require("../models/examQuestions");
const ExamScore = require("../models/examScore");
const Exam = require("../models/exam");
const Options = require("../models/options");
const Person = require("../models/person");
const School = require("../models/school");
const Quiz = require("../models/quiz");
const Question = require("../models/questions");
const SchoolNotification = require("../models/schoolNotification");
//model imports
const { initExamQuestion } = require("../helpers/initExamQuestions");
const { MarkExamScript } = require("../helpers/markExamination");
//helper function import
const io = require("../socket");
module.exports.getNotifications = async (req, res, next) => {
  const { student } = req.query;
  const person = await Person.findOne({
    where: { ref: student },
  });
  await studentNotification.update(
    { isNew: false },
    { where: { personId: person.id } }
  );
  io.getIO().to(student).emit("clear");
  const notifications = await studentNotification.findAll({
    where: { personId: person.id },
  });
  res.json({
    code: 200,
    notifications: notifications,
  });
};
module.exports.loadExamQuestion = async (req, res, next) => {
  const { sheet } = req.query;
  //get question paper id
  const exams = await ExamScore.findOne({
    where: { examsheet: sheet },
    include: Exam,
  });
  ///const school = await School.findByPk(exams.schoolId);
  //find exam
  //find person
  //const student = await Person.findOne(exams.personId);
  //get question paper
  if (!exams.exam.canStart) {
    return res.json({
      code: 403,
      message: "cannot start exam now",
    });
  }
  const examsheet = await examQuestions
    .findById(sheet)
    .select("quizzes quiz _id");
  //find quizzes
  if (examsheet.quizzes.length) {
    return res.json({
      code: 200,
      quizzes: { quizzes: examsheet.quizzes, _id: examsheet._id },
    });
  }
  const quizzes = await Quiz.findAll({
    where: { id: examsheet.quiz },
  });
  const questions = await Question.findAll({
    where: { quizId: examsheet.quiz },
    include: Options,
  });
  //find exams
  //const studentsExam = await Exam.findAll({
  //  where: examsheet.quiz,
  // });
  const studentQuestion = initExamQuestion(quizzes, questions);
  examsheet.quizzes = studentQuestion;
  await examsheet.save();

  res.json({
    code: 200,
    quizzes: { quizzes: studentQuestion, _id: examsheet._id },
  });
};
module.exports.submitAQuestion = async (req, res, next) => {
  const { id, quest, quid, student, answer } = req.body;

  const sheet = await ExamSheet.findOne({
    $and: [{ _id: id }],
  });
  let quiz = sheet.quizzes[quid];
  let question = quiz.questions[quest];
  question["answer"] = answer;
  question.answered = true;
  // quiz.questions[quest] = question;
  //sheet.quizzes[quid] = quiz;
  await sheet.save();
  res.json({
    code: 200,
    messsage: "answer saved!!!",
  });
};
module.exports.submitExamination = async (req, res, next) => {
  const { sheet, student, quizzes } = req.body;
  //GET EXAM AND CHECK RESULT DELIVERY CHOICE
  const result = MarkExamScript(quizzes);
  const examScore = await ExamScore.findOne({
    where: { examsheet: sheet },
    include: [Exam, Person, School],
  });
  const resultDelivery = examScore.exam.resultDelivery;
  const isManual = resultDelivery === "manual";
  const examsheet = await ExamSheet.findOne({
    $and: [{ _id: sheet }],
  }).select("-quizzes");
  examsheet.isComplete = true;
  examsheet.isApproved = isManual ? false : true;
  examsheet.score = result.score;
  examsheet.fails = result.fails;
  (examsheet.totalAnswered = result.totalAnswered),
    (examsheet.totalIgnored = result.totalIgnored);
  await examsheet.save();
  const scoreboard = await ExamScore.update(
    {
      completed: true,
      Examscore: result.score,
    },
    { where: { examsheet: sheet } }
  );
  const notify = await SchoolNotification.create({
    schoolId: examScore.schoolId,
    topic: "Result submition",
    time: `${moment().format("L")} ${moment().format("LT")}`,
    message: `${examScore.person.name} has submitted his ${examScore.exam.name} exam sheet`,
    isNew: true,
  });
  io.getIO().to(examScore.school.ref).emit("notify", {
    id: notify.id,
    message: notify.message,
    topic: notify.topic,
    time: notify.time,
  });
  res.json({
    code: 200,
    message: "submitted successfully",
  });
};
module.exports.getStudentExams = async (req, res, next) => {
  const { pid } = req.query;

  const person = await Person.findOne({
    where: { ref: pid },
  });
  const myexams = await ExamScore.findAll({
    where: { PersonId: person.id },
    attributes: { exclude: ["personId", "schoolId", "examId", "id", "score"] },
    include: [Exam, { model: School, attributes: ["name"] }],
  });
  const sheetids = myexams.map((exam) => exam.examsheet);
  const examsheet = await ExamSheet.find({ _id: { $in: sheetids } }).select(
    "canRetry retries maxRetries _id"
  );
  const examinations = myexams.map((exam) => {
    const issheet = examsheet.find(
      (sheet) => sheet._id.toString() === exam.examsheet.toString()
    );
    if (issheet) {
      if (issheet.canRetry && issheet.retries <= issheet.maxRetries) {
        return {
          ...exam.dataValues,
          canRetake: true,
        };
      } else {
        return {
          ...exam.dataValues,
          canRetake: false,
        };
      }
    }
    return exam;
  });

  res.json({
    code: 200,
    exams: examinations,
  });
};

module.exports.getFinishedExams = async (req, res, next) => {
  const { pid } = req.query;
  const person = await Person.findOne({
    where: { ref: pid },
  });
  const sheets = await ExamScore.findAll({
    where: { personId: person.id },
  });
  const sheetids = sheets.map((sheet) => sheet.examsheet);
  const ExamSheets = await examQuestions
    .find({
      $and: [
        { _id: { $in: sheetids } },
        { isApproved: true },
        { isComplete: true },
      ],
    })
    .select("-quizzes");
  res.json({
    code: 200,
    exams: ExamSheets,
  });
};
module.exports.showSolution = async (req, res, next) => {
  const { sheet } = req.query;
  const examsheet = await examQuestions.findById(sheet).select("quizzes _id");
  res.json({
    quizzes: examsheet,
    code: 200,
  });
};
module.exports.retry = async (req, res, next) => {
  const { sheet } = req.query;
  const exams = await ExamScore.findOne({
    where: { examsheet: sheet },
    include: Exam,
  });
  const examsheet = await examQuestions.findById(sheet);
  //find quizzes
  if (
    examsheet.totalAnswered === 0 &&
    examsheet.fails === 0 &&
    examsheet.totalIgnored === 0
  ) {
    return res.json({
      code: 200,
      quizzes: { quizzes: examsheet.quizzes, _id: examsheet._id },
    });
  }
  examsheet.isApproved = false;
  examsheet.isComplete = false;
  examsheet.score = 0;
  examsheet.fails = 0;
  examsheet.totalIgnored = 0;
  examsheet.totalAnswered = 0;
  examsheet.totalMarks = 0;
  examsheet.retries = examsheet.retries + 1;
  const quizzes = await Quiz.findAll({
    where: { id: examsheet.quiz },
  });
  const questions = await Question.findAll({
    where: { quizId: examsheet.quiz },
    include: Options,
  });
  const studentQuestion = initExamQuestion(quizzes, questions);
  examsheet.quizzes = studentQuestion;
  exams.completed = false;
  await exams.save();
  await examsheet.save();

  res.json({
    code: 200,
    quizzes: { quizzes: studentQuestion, _id: examsheet._id },
  });
};
module.exports.getNewNotifications = async (req, res, next) => {
  const { pref } = req.query;
  //find person
  const person = await Person.findOne({
    where: { ref: pref },
    attributes: ["id"],
  });
  if (!person) {
    return res.json({
      code: 403,
      notifications: 0,
    });
  }
  //get notifications
  const notifications = await studentNotification.count({
    where: { personId: person.id, isNew: true },
  });
  res.json({
    code: 200,
    notifications: notifications,
  });
};
