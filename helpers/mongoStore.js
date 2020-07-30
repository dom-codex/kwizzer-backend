const StudentQuestion = require("../models/studentQuestion");
const Hall = require("../models/hall");
module.exports.initQuestionsOnMongo = async (req, res, next) => {
  const { pid, sch, quiz } = req.body.body;
  const { questions, title, canRetake, retries } = req.body;
  const { retry } = req.query;
  const Student = await StudentQuestion.findOne({
    $and: [{ student: pid }, { school: sch }, { quiz: quiz }],
  });
  if (!Student) {
    const newStudentQuestion = new StudentQuestion({
      school: sch,
      student: pid,
      quiz: quiz,
      questions: questions,
      noOFQuestions: questions.length,
      title: title,
    });
    const result = await newStudentQuestion.save();
    return res.json({
      code: 201,
      id: result._id,

      message: "new quiz initialized",
    });
  }
  if (retry) {
    if (canRetake && retries > Student.retries) {
      //update questions as well as retires count
      (Student.questions = questions), (Student.retries = Student.retries + 1);
      Student.isComplete = false;
      Student.isApproved = false;
      Student.score = 0;
      Student.fails = 0;
      Student.totalIgnored = 0;
      Student.totalAnswered = 0;
      await Student.save();
      const studHall = await Hall.findOne({
        where: { personId: Student.student },
      });
      studHall.completed = false;
      await studHall.save();
      return res.json({
        id: Student._id,
        questions: questions,
        code: 200,
        message: "woeking",
      });
    }

    return res.json({
      code: 403,
      message: "Sorry, you have exceeded the number of allowed retries!!!",
      questions: questions,
    });
  }
  return res.json({
    id: Student._id,
    questions: Student.questions,
    code: 200,
    message: "woeking",
  });
};
