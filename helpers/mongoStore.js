const StudentQuestion = require("../models/studentQuestion");
module.exports.initQuestionsOnMongo = async (req, res, next) => {
  const { pid, cid, sid, quid } = req.body.body;
  const { questions } = req.body;
  const Student = await StudentQuestion.findOne({
    $and: [{ student: pid }, { school: sid }, { quiz: quid }],
  });
  if (!Student) {
    const newStudentQuestion = new StudentQuestion({
      school: sid,
      student: pid,
      classBlockId: cid,
      quiz: quid,
      questions: questions,
    });
    const result = await newStudentQuestion.save();
    return res.json({
      code: 201,
      question: result._id,
      message: "new quiz initialized",
    });
  }
  return res.json({
    questions: Student.questions,
    code: 200,
    message: "woeking",
  });
};
