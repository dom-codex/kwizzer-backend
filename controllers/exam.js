const moment = require("moment");
const { v4: uuid } = require("uuid");
const { validationResult } = require("express-validator");
const Exam = require("../models/exam");
const ExamPaper = require("../models/examPaper");
const School = require("../models/school");
const Quiz = require("../models/quiz");
const Classroom = require("../models/classrooms");
const ExamScore = require("../models/examScore");
const ExamSheet = require("../models/examQuestions");
const studentNotification = require("../models/studentNotification");
const SchoolNotification = require("../models/schoolNotification");
const Person = require("../models/person");
const examQuestions = require("../models/examQuestions");
//models import
const { storeExamQuizzes } = require("../helpers/storeQuizOnpaper");
const io = require("../socket");
module.exports.createExam = async (req, res, next) => {
  const { sch } = req.query;
  //find sch

  const school = await School.findOne({
    where: { ref: sch },
    attributes: ["id"],
  });
  const publishedQuiz = await Classroom.count({
    where: { schoolId: school.id },
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
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    let err = {};
    errors.errors.forEach((e) => {
      err = { ...err, [e.param]: { param: e.param, msg: e.msg } };
    });
    return res.json({
      code: 403,
      errors: err,
    });
  } else if (publishedQuiz < parseInt(nquiz)) {
    return res.json({
      code: 401,
      message: "cannot create exam,No of quiz too small",
    });
  }
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
    ref: uuid(),
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
};
module.exports.setRegistration = async (req, res, next) => {
  const { exam } = req.query;
  const examination = await Exam.findOne({
    where: { ref: exam },
    attributes: ["canReg", "id"],
  });
  examination.canReg = examination.canReg ? false : true;
  await examination.save();
  res.json({
    code: 200,
    message: examination.canReg
      ? "Registration link activated"
      : "Registration link revoked",
    text: examination.canReg ? "revoke" : "activate",
  });
};
module.exports.getExams = async (req, res, next) => {
  const { sch } = req.query;
  const school = await School.findOne({
    where: { ref: sch },
  });
  const exams = await Exam.findAll({
    where: { schoolId: school.id },
    attributes: ["ref", "name", "noOfStudents"],
    //attributes: { exclude: ["id"] },
  });
  if (!exams) {
    return res.json({
      code: 403,
      message: "you haven't created any exam",
      exams: [],
    });
  }
  res.json({
    code: 200,
    exams: exams,
  });
};
module.exports.ExamRecords = async (req, res, next) => {
  const { sch } = req.query;
  const school = await School.findOne({
    where: { ref: sch },
  });
  const exams = await Exam.findAll({
    where: { schoolId: school.id },
    attributes: {
      exclude: ["id", "schoolId", "createdAt", "updatedAt", "resultDelivery"],
    },
    //attributes: { exclude: ["id"] },
  });
  if (!exams) {
    return res.json({
      code: 403,
      message: "you haven't created any exam",
      exams: [],
    });
  }
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
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    let err = {};
    errors.errors.forEach((e) => {
      err = { ...err, [e.param]: { param: e.param, msg: e.msg } };
    });
    return res.json({
      code: 403,
      errors: err,
    });
  }
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
    let quids = [];
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);

      return res.json({
        code: 403,
        message: errors.errors[0].msg,
      });
    }
    //find school
    const school = await School.findOne({ where: { ref: sch } });
    //find exam
    const exams = await Exam.findOne({
      where: { ref: exam, schoolId: school.id },
    });
    if (!exams.canReg) {
      return res.json({
        code: 403,
        message: "sorry,you cannot register for this exam now",
      });
    }
    //find person
    const student = await Person.findOne({
      where: { email: email },
    });
    if (type === "custom") {
      subjects = subjects.map((sub) => parseInt(sub));
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
    }
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
      exam: exams.id,
    });
    exams.noOfStudents = exams.noOfStudents + 1;
    await exams.save();
    const score = await ExamScore.create({
      examId: exams.id,
      examsheet: myexamsheet._id.toString(),
      personId: student.id,
      schoolId: school.id,
      completed: false,
    });
    const time = `${moment().format("L")} ${moment().format("LT")}`;
    const notify = await SchoolNotification.create({
      topic: "Registration alert",
      message: `${student.name} has successfully registered for ${exams.name} examination`,
      isNew: true,
      time: time,
      schoolId: school.id,
    });
    io.getIO().to(sch).emit("notify", {
      id: notify.id,
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
module.exports.canStartExam = async (req, res, next) => {
  const { exam } = req.query;
  const examination = await Exam.findOne({ where: { ref: exam } });
  examination.canStart = examination.canStart ? false : true;
  await examination.save();
  res.json({
    code: 200,
    message: examination.canStart ? "authorized" : "not authorized",
    text: examination.canStart ? "unauthorize" : "authorize",
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
  if (!exams) {
    return res.json({
      code: 403,
      message: "you haven't created any exam",
      exams: [],
    });
  }
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
  try {
    const { exam, sch } = req.query;
    //update all unapproved question papers
    //get school
    //get exam
    const examination = await Exam.findOne({
      where: { ref: exam },
      attributes: ["name", "id"],
    });
    const examsheets = await ExamSheet.find({
      $and: [
        { isApproved: false },
        { isComplete: true },
        { exam: examination.id },
      ],
    }).select("_id");
    const sheets = examsheets.map((sheet) => `${sheet._id}`);

    const scores = await ExamScore.findAll({
      where: { examId: examination.id, examsheet: sheets },
      attributes: ["personId"],
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
    const time = `${moment().format("L")} ${moment().format("LT")}`;
    if (updated.n > 0) {
      const notifcations = students.map((student) => {
        return {
          schoolName: school.name,
          message: `your result for ${examination.name} examination has been approved!!!`,
          time: time,
          personId: student.id,
          isNew: true,
        };
      });
      const studentNotiications = await studentNotification.bulkCreate(
        notifcations,
        {
          validate: true,
        }
      );
      students.forEach((student) => {
        const newNotification = studentNotiications.find(
          (n) => n.personId === student.id
        );
        io.getIO()
          .to(student.ref)
          .emit("notify", {
            id: newNotification.id,
            message: `your result for ${examination.name} examination has been approved!!!`,
            schoolName: school.name,
            time: time,
          });
      });
    }
    //send notification
    res.json({
      code: 200,
      updated: updated.n,
    });
  } catch (err) {
    console.log(err.message);
  }
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
    { $and: [{ _id: paper }, { isComplete: true }, { isApproved: false }] },
    { $set: { isApproved: true } }
  );
  if (updated.n > 0) {
    const studNotify = await studentNotification.create({
      schoolName: examscore.school.name,
      message: `your result for ${examscore.exam.name} examination has been approved!!!`,
      time: `${moment().format("L")} ${moment().format("LT")}`,
      personId: examscore.personId,
      isNew: true,
    });
    io.getIO()
      .to(examscore.person.ref)
      .emit("notify", {
        id: studNotify.id,
        message: `your result for ${examscore.exam.name} examination has been approved!!!`,
        schoolName: examscore.school.name,
        time: studNotify.time,
      });
  } else {
    return res.json({ code: 201, message: "Already approved!!!" });
  }
  res.json({
    code: 200,
    updated: updated.n,
  });
};
