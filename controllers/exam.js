const Exam = require("../models/exam");
const ExamPaper = require("../models/examPaper");
const School = require("../models/school");
const Quiz = require("../models/quiz");
const Questions = require("../models/questions");
const Options = require("../models/options");
const ExamScore = require("../models/examScore");
//models import
const { storeExamQuizzes } = require("../helpers/storeQuizOnpaper");
const { initExamQuestion } = require("../helpers/initExamQuestions");
const Person = require("../models/person");
module.exports.createExam = async (req, res, next) => {
  const { sch } = req.query;
  //find sch
  const school = await School.findOne({
    where: { ref: sch },
  });
  const { title, nquiz, total, hr, min, sec, quiz, choice } = req.body;
  const exam = await Exam.create({
    name: title,
    nQuiz: nquiz,
    TotalMarks: total,
    hours: hr,
    minutes: min,
    seconds: sec,
    resultDelivery: choice,
    schoolId: school.id,
  });
  //initialize exam Paper with quiz
  await storeExamQuizzes(exam.id, quiz);
  res.json({
    code: 200,
    message: "exam created",
  });
};
module.exports.getExams = async (req, res, next) => {
  const { sch } = req.query;
  const school = await School.findOne({
    where: { ref: sch },
  });
  const exams = await Exam.findAll({
    where: { schoolId: school.id },
  });
  res.json({
    code: 200,
    exams: exams,
  });
};
module.exports.getSingleExam = async (req, res, next) => {
  const { sch, exam } = req.query;
  const school = await School.findOne({
    where: { ref: sch },
  });
  const exams = await Exam.findOne({
    where: { id: exam },
  });
  const quizzes = await ExamPaper.findAll({
    where: { examId: exams.id },
  });
  //convert the quiz to use format
  let quiz = {};
  quizzes.forEach((quizz, i) => {
    quiz = { ...quiz, [`quiz${i + 1}`]: quizz.quizId.toString() };
  });
  res.json({
    exams: exams,
    quiz: quiz,
    code: 200,
  });
};
module.exports.editQuiz = async (req, res, next) => {
  const { exam, sch } = req.query;
  const {
    title,
    nquiz,
    total,
    hr,
    min,
    sec,
    quiz,
    choice,
    todelete,
    tocreate,
  } = req.body;
  const school = await School.findOne({
    where: { ref: sch },
  });

  const exams = await Exam.update(
    {
      name: title,
      nQuiz: nquiz,
      TotalMarks: total,
      hours: hr,
      minutes: min,
      seconds: sec,
      resultDelivery: choice,
    },
    { where: { id: exam } }
  );
  storeExamQuizzes(exam, quiz, true, todelete, tocreate);
  res.json({
    code: 200,
    message: "exam created",
  });
};
module.exports.deleteAnExam = async (req, res, next) => {
  const { exam, sch } = req.query;
  //find school,
  const school = await School.findOne({
    where: { ref: sch },
  });
  const destroyedExam = await Exam.destroy({
    where: { id: exam, schoolId: school.id },
  });
  res.json({
    code: 200,
    message: "exam deleted!!!",
  });
};
module.exports.RegisterForExam = async (req, res, next) => {
  const { exam, sch } = req.query;
  const { email } = req.body;
  //find school
  const school = await School.findOne({ where: { id: sch } });
  //find exam
  const exams = await Exam.findOne({
    where: { id: exam, schoolId: school.id },
  });
  //find person
  const student = await Person.findOne({
    where: { email: email },
  });
  //find question Paper
  const exampaper = await ExamPaper.findAll({
    where: { examId: exams.id },
    include: [Quiz],
  });
  const quizzes = exampaper.map((paper) => {
    return paper.quiz;
  });
  const quids = quizzes.map((quiz) => {
    return quiz.id;
  });
  const questions = await Questions.findAll({
    where: { QuizId: [quids] },
    include: Options,
  });
  const sheet = await initExamQuestion(
    quizzes,
    questions,
    school,
    student,
    exam,
    quids
  );
  exams.noOfStudents = exam.noOfStudents + 1;
  await exams.save();
  const score = await ExamScore.create({
    examId: exams.id,
    examsheet: sheet._id.toString(),
    personId: student.id,
    schoolId: school.id,
  });
  res.json({
    code: 200,
    message: "exam questions intialized",
  });
};
module.exports.getAllSchoolExams = async (req, res, next) => {
  const { sch } = req.query;
  //find school
  const school = await School.findOne({
    where: { ref: sch },
  });
  //find all exams;
  const exams = await Exam.findAll({
    where: { schoolId: school.id },
  });
  res.json({
    exams: exams,
    code: 200,
  });
};
module.exports.getAllExamCandidates = async (req, res, next) => {
  const { sch, exam } = req.query;
  const school = await School.findOne({
    where: { ref: sch },
  });
  const students = await ExamScore.findAll({
    where: { examId: exam, schoolId: school.id },
    include: Person,
  });
  res.json({
    code: 200,
    students: students,
  });
};
