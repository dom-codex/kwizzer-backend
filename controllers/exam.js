const Exam = require("../models/exam");
const ExamPaper = require("../models/examPaper");
const School = require("../models/school");
const Quiz = require("../models/quiz");
const Questions = require("../models/questions");
const Options = require("../models/options");
const ExamScore = require("../models/examScore");
const ExamSheet = require("../models/examQuestions");
//models import
const { storeExamQuizzes } = require("../helpers/storeQuizOnpaper");
const { initExamQuestion } = require("../helpers/initExamQuestions");
const Person = require("../models/person");
const { MarkExamScript } = require("../helpers/markExamination");
const examQuestions = require("../models/examQuestions");
module.exports.createExam = async (req, res, next) => {
  const { sch } = req.query;
  //find sch
  const school = await School.findOne({
    where: { ref: sch },
  });
  const { title, nquiz, total, hr, min, sec, quiz, choice, type } = req.body;
  const exam = await Exam.create({
    name: title,
    nQuiz: nquiz,
    TotalMarks: total,
    hours: hr,
    minutes: min,
    seconds: sec,
    resultDelivery: choice,
    schoolId: school.id,
    type: type,
  });
  if (type === "custom") {
    res.json({
      code: 200,
      message: "exam created",
    });
  } else {
    //initialize exam Paper with quiz
    await storeExamQuizzes(exam.id, quiz);
    res.json({
      code: 200,
      message: "exam created",
    });
  }
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
module.exports.getAnExam = async (req, res, next) => {
  const { eid } = req.query;
  const exam = await Exam.findOne({
    where: { id: eid },
  });
  res.json({
    code: 200,
    quiz: exam,
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
  const quiz = quizzes.map((quizz, i) => quizz.quizId);
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
  try {
    const { exam, sch } = req.query;
    let { email, type, subjects } = req.body;
    let quizzes = [];
    let questions = [];
    let quids = [];

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
    if (type === "custom") {
      subjects = subjects.map((sub) => parseInt(sub));
      quizzes = await Quiz.findAll({
        where: { id: subjects },
      });
      questions = await Questions.findAll({
        where: { quizId: subjects },
        include: Options,
      });
      quids = subjects;
    } else {
      //find question Paper
      const exampaper = await ExamPaper.findAll({
        where: { examId: exams.id },
        include: [Quiz],
      });
      quizzes = exampaper.map((paper) => {
        return paper.quiz;
      });
      quids = quizzes.map((quiz) => {
        return quiz.id;
      });
      questions = await Questions.findAll({
        where: { QuizId: [quids] },
        include: Options,
      });
    }
    const sheet = await initExamQuestion(
      quizzes,
      questions,
      school,
      student,
      exams,
      quids
    );
    exams.noOfStudents = exams.noOfStudents + 1;
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
  } catch (err) {
    console.log(err);
  }
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
module.exports.getStudentExams = async (req, res, next) => {
  const { pid } = req.query;
  const myexams = await ExamScore.findAll({
    where: { PersonId: pid },
    include: Exam,
  });
  res.json({
    code: 200,
    exams: myexams,
  });
};
module.exports.loadExamQuestion = async (req, res, next) => {
  const { sch, pid, exam } = req.query;
  //get question paper id
  const exams = await ExamScore.findOne({
    where: { examId: exam, schoolId: sch, personId: pid },
  });
  //get question paper
  const examsheet = await examQuestions
    .findById(exams.examsheet)
    .select("quizzes _id");
  res.json({
    code: 200,
    quizzes: examsheet,
  });
};
module.exports.submitAQuestion = async (req, res, next) => {
  const { id, quest, quid, student, answer } = req.body;
  const sheet = await ExamSheet.findOne({
    $and: [{ _id: id }, { student: student }],
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
  const result = MarkExamScript(quizzes);
  const examsheet = await ExamSheet.findOne({
    $and: [{ _id: sheet }, { student: student }],
  }).select("-quizzes");
  examsheet.isComplete = true;
  examsheet.isApproved = true;
  examsheet.score = result.score;
  examsheet.fails = result.fails;
  (examsheet.totalAnswered = result.totalAnswered),
    (examsheet.totalIgnored = result.totalIgnored);
  await examsheet.save();
  const scoreboard = await ExamScore.update(
    {
      completed: true,
    },
    { where: { examsheet: sheet } }
  );
  res.json({
    code: 200,
    message: "submitted successfully",
  });
};
module.exports.getStudentsExamResults = async (req, res, next) => {
  const { exam } = req.query;
  const results = await ExamScore.findAll({
    where: { examId: exam },
  });
  const papers = results.map((result) => result.examsheet);
  const examSheets = await examQuestions
    .find({ $and: [{ _id: { $in: papers } }, { isComplete: true }] })
    .select("-quizzes -quiz");
  res.json({
    code: 200,
    result: examSheets,
  });
};
module.exports.viewExamSolutions = async (req, res, next) => {
  const { sheet } = req.query;
  const examSheet = await examQuestions
    .findOne({
      $and: [{ _id: sheet }, { isComplete: true }],
    })
    .select("_id quizzes");
  res.json({
    code: 200,
    solution: examSheet,
  });
};
module.exports.ApproveResult = async (req, res, next) => {
  const { exam } = req.query;
  //update all unapproved question papers
  //get school
  const scores = await ExamScore.findAll({
    where: { examId: exam },
  });
  const sheets = scores.map((score) => score.examsheet);
  const updated = await examQuestions.updateMany(
    {
      $and: [
        { _id: { $in: sheets } },
        { isApproved: false },
        { isComplete: true },
      ],
    },
    { $set: { isApproved: true } }
  );
  if (updated.n > 0) {
    /* ids.forEach(async (id) => {
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
    });*/
  }
  //send notification
  res.json({
    code: 200,
    updated: updated.n,
  });
};
module.exports.ApproveSingleResult = async (req, res, next) => {
  const { paper } = req.query;
  const sheet = await examQuestions
    .findById(paper)
    .select("student quizzes schoolName,studentName");
  const updated = await examQuestions.updateOne(
    { $and: [{ _id: paper }, { isComplete: true }] },
    { $set: { isApproved: true } }
  );
  /*const studNotify = await studentNotification.create({
    schoolName: schoolName,
    message: "your result has been approved!!!",
    time: "3:44pm",
    personId: studentInfo.student,
  });
  io.getIO().to(studentInfo.student).emit("notify", {
    message: "your result has been approved!!!",
    schoolName: schoolName,
    time: "3:44pm",
  });*/
  res.json({
    code: 200,
    updated: updated.n,
  });
};
module.exports.getFinishedExams = async (req, res, next) => {
  const { pid } = req.query;
  const sheets = await ExamScore.findAll({
    where: { personId: pid },
  });
  console.log(sheets);
  const sheetids = sheets.map((sheet) => sheet.examsheet);
  const ExamSheets = await examQuestions.find({ _id: { $in: sheetids } });
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
