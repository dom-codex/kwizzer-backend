const Crypto = require("crypto");
const Exam = require("../models/exam");
const ExamPaper = require("../models/examPaper");
const School = require("../models/school");
const Quiz = require("../models/quiz");
const Questions = require("../models/questions");
const Options = require("../models/options");
const ExamScore = require("../models/examScore");
const ExamSheet = require("../models/examQuestions");
const studentNotification = require("../models/studentNotification");
const adminNotifications = require("../models/schoolNotification");
//models import
const { storeExamQuizzes } = require("../helpers/storeQuizOnpaper");
const { initExamQuestion } = require("../helpers/initExamQuestions");
const Person = require("../models/person");
//const { MarkExamScript } = require("../helpers/markExamination");
const examQuestions = require("../models/examQuestions");
const io = require("../socket");
const SchoolNotification = require("../models/schoolNotification");
module.exports.createExam = async (req, res, next) => {
  const { sch } = req.query;
  //find sch

  const school = await School.findOne({
    where: { ref: sch },
  });
  const {
    title,
    nquiz,
    total,
    hr,
    min,
    sec,
    quiz,
    choice,
    type,
    setRetry,
    retries,
  } = req.body;
  Crypto.randomBytes(20, async (err, buffer) => {
    const token = buffer.toString("hex");
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
      ref: token,
      canRetry: setRetry,
      retries: retries,
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
module.exports.getAnExam = async (req, res, next) => {
  const { eid } = req.query;
  const exam = await Exam.findOne({
    where: { ref: eid },
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
    where: { ref: exam },
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
    setRetry,
    retries,
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
      canRetry: setRetry,
      retries: retries,
    },
    { where: { ref: exam } }
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
    where: { ref: exam, schoolId: school.id },
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
    const school = await School.findOne({ where: { ref: sch } });
    //find exam
    const exams = await Exam.findOne({
      where: { ref: exam, schoolId: school.id },
    });
    //find person
    const student = await Person.findOne({
      where: { email: email },
    });
    if (type === "custom") {
      subjects = subjects.map((sub) => parseInt(sub));
      /* quizzes = await Quiz.findAll({
        where: { id: subjects },
      });*/
      /*questions = await Questions.findAll({
        where: { quizId: subjects },
        include: Options,
      });*/
      quids = subjects;
    } else {
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
      //find question Paper
      /*const exampaper = await ExamPaper.findAll({
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
      });*/
    }
    /*const sheet = await initExamQuestion(
      quizzes,
      questions,
      school,
      student,
      exams,
      quids
    );*/
    const myexamsheet = await ExamSheet.create({
      title: exams.name,
      studentName: student.name,
      quiz: quids,
      school: school.id,
      student: student.id,
      schoolName: school.name,
      totalMarks: exams.TotalMarks,
      canRetry: exams.canRetry,
      maxRetries: exams.retries,
      retries: 0,
    });
    exams.noOfStudents = exams.noOfStudents + 1;
    await exams.save();
    const score = await ExamScore.create({
      examId: exams.id,
      examsheet: myexamsheet._id.toString(),
      personId: student.id,
      schoolId: school.id,
    });
    const notify = await SchoolNotification.create({
      topic: "Registration alert",
      message: `${student.name} has successfully registered for ${exams.name} examination`,
      isNew: true,
      time: "12:00pm",
      schoolId: school.id,
    });
    io.getIO().to(sch).emit("notify", {
      message: notify.message,
      time: notify.time,
      topic: notify.topic,
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
  const myexam = await Exam.findOne({
    where: { ref: exam },
  });
  const students = await ExamScore.findAll({
    where: { examId: myexam.id, schoolId: school.id },
    include: Person,
  });
  res.json({
    code: 200,
    students: students,
  });
};
module.exports.getStudentsExamResults = async (req, res, next) => {
  const { exam } = req.query;
  const examination = await Exam.findOne({
    where: { ref: exam },
    attributes: ["id"],
  });
  const results = await ExamScore.findAll({
    where: { examId: examination.id },
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
  const { exam, sch } = req.query;
  //update all unapproved question papers
  //get school
  //get exam
  const examination = await Exam.findOne({
    where: { ref: exam },
    attributes: ["name", "id"],
  });
  const scores = await ExamScore.findAll({
    where: { examId: examination.id },
  });
  //get school
  const school = await School.findOne({
    where: { ref: sch },
    attributes: ["name"],
  });
  const people = scores.map((score) => score.personId);
  //get students
  let students = await Person.findAll({
    where: { id: people },
    attributes: ["ref", "id"],
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
    const notifcations = students.map((student) => {
      return {
        schoolName: school.name,
        message: `your result for ${examination.name} examination has been approved!!!`,
        time: "3:44pm",
        personId: student.id,
        isNew: true,
      };
    });
    const exampaper = await studentNotification.bulkCreate(notifcations, {
      validate: true,
    });
    students.forEach((student) => {
      /* await studentNotification.create({
        schoolName: school.name,
        message: `your result for ${examination.name} examination has been approved!!!`,
        time: "3:44pm",
        personId: student.id,
      });*/
      io.getIO()
        .to(student.ref)
        .emit("notify", {
          message: `your result for ${examination.name} examination has been approved!!!`,
          schoolName: school.name,
          time: "3:44pm",
        });
    });
    /* students.forEach((student) => {
      io.getIO()
        .to(student.ref)
        .emit("notify", {
          message: `your result for ${examination.name} examination has been approved!!!`,
          schoolName: school.name,
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
  const examscore = await ExamScore.findOne({
    where: { examsheet: paper },
    include: [School, Exam, Person],
  });
  const sheet = await examQuestions
    .findById(paper)
    .select("student quizzes schoolName,studentName");
  const updated = await examQuestions.updateOne(
    { $and: [{ _id: paper }, { isComplete: true }] },
    { $set: { isApproved: true } }
  );
  if (updated.n > 0) {
    const studNotify = await studentNotification.create({
      schoolName: examscore.school.name,
      message: `your result for ${examscore.exam.name} examination has been approved!!!`,
      time: "3:44pm",
      personId: examscore.personId,
      isNew: true,
    });
    io.getIO()
      .to(examscore.person.ref)
      .emit("notify", {
        message: `your result for ${examscore.exam.name} examination has been approved!!!`,
        schoolName: examscore.school.name,
        time: "3:44pm",
      });
  }
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
