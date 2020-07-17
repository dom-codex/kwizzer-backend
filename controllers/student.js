const Classroom = require("../models/classrooms");
const Quiz = require("../models/quiz");
const Question = require("../models/questions");
const Option = require("../models/options");
const classBlock = require("../models/class");
const scores = require("../models/scoreBoad");
//model imports
const { mark } = require("../helpers/markQuiz");
//helper function import
const fetch = require("node-fetch");
const studentQuestion = require("../models/studentQuestion");
module.exports.takeQuiz = async (req, res, next) => {
  /*retrieve students info */
  try {
    const { sid, cid, pid, quid } = req.body;
    //comfirm if student belongs to classroom of school whose quiz
    //they want to take
    const student = await Classroom.findOne({
      where: {
        personId: pid,
        schoolId: sid,
        classBlockId: cid,
      },
    });
    if (!student) {
      return res.json({
        code: 400,
        message: "you not allowed to take this quiz",
      });
    }
    //get questions with the related quiz id
    /* const quiz = await Quiz.findByPk(quid);*/
    const questions = await Question.findAll({
      where: { quizId: quid },
      include: Option,
    });
    //transform the questions retrieve from mysql db
    const transformed = questions.map((question, i) => {
      return {
        question: question.question,
        questionUrl: question.questionUrl,
        questIndex: i + 1,
        answered: false,
        options: question.options.map((option) => {
          return {
            isAnswer: option.isAnswer,
            option: option.option,
          };
        }),
      };
    });
    /*store selected questions in mongodb collection
     */
    const resp = await fetch("http://127.0.0.1:3000/school/student/mongo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questions: transformed, body: req.body }),
    });
    const data = await resp.json();
    /* if code is 201 means a new document was created in the mongod
    db collection, update the sql db with the document id */
    if (data.code === 201) {
      scores.create({
        questId: data.question,
        personId: pid,
        classblockId: cid,
        quizId: quid,
        score: 0,
      });
      return res.json({
        questions: transformed,
      });
    }
    return res.json({
      questions: data.questions,
    });
  } catch (err) {
    console.log(err.message);
  }
};
module.exports.submitAQuestion = async (req, res, next) => {
  try {
    //retrieve quest index and question id  on mongo and answer
    const { index, id, ans } = req.body;
    //index is the question index in mongo db
    //id is the entire question _id in mongo
    //ans is user anwer
    let updated = await studentQuestion.findOne({
      _id: id,
    });
    if (!updated) {
      return res.json({
        code: 400,
        message: "quiz not found",
      });
    }
    //update necessary fields
    updated.questions.find((q) => q.questIndex == index).answered = true;
    updated.questions.find((q) => q.questIndex == index).answer = ans;
    updated = await updated.save();
    res.json({
      code: 200,
      message: "submission made!!!",
    });
  } catch (err) {
    console.log(err.message);
  }
};
module.exports.submitQuestion = async (req, res, next) => {
  try {
    //retrive quiz id for mysql db and also for mongo
    const { squid, mquid } = req.body;
    //determine tutor's result delivery choice
    const quiz = await Quiz.findByPk(squid);
    //choice determines if result should be delivered immediately or not
    const choice = quiz.choice;
    const totalMark = quiz.totalMarks;
    const markPerQuestion = quiz.marks;
    //retrieve question set for student
    let studentQuest = await studentQuestion.findById(mquid);
    //mark student's question
    const result = mark(studentQuest.questions, markPerQuestion);
    //update studen't question doc with appropriate info
    studentQuest.score = result.score;
    studentQuest.fails = result.fails;
    studentQuest.totalAnswered = result.totalAnswered;
    studentQuest.totalIgnored = result.totalIgnored;
    studentQuest.totalMarks = totalMark;
    studentQuest.isComplete = true;
    const studBoard = await scores.findOne({ where: { questId: mquid } });
    studBoard.score = result.score;
    await studBoard.save();
    if (choice === "onsubmit") {
      studentQuest.isApproved = true;
      studentQuest = await studentQuest.save();
      return res.json({
        code: 201,
        message: "result is ready",
      });
    }
    studentQuestion = await studentQuest.save();
    return res.json({
      code: 200,
      message: "result needs to be approved by examiner,pls be patient",
    });
  } catch (err) {
    console.log(err.message);
  }
};
module.exports.checkResult = async (req, res, next) => {
  //retrieve students question on mongodb
  const { mquid } = req.body;
  //retireve student's doc
  const studentQuestionPaper = await studentQuestion.findById(mquid);
  //check if result is approved
  if (!studentQuestionPaper.isApproved) {
    return res.json({
      code: 201,
      message: "result has not been approved!!!",
    });
  }
  const {
    score,
    totalAnswered,
    totalMarks,
    totalIgnored,
    fails,
  } = studentQuestionPaper;
  return res.json({
    code: 200,
    score: score,
    totalAnswered: totalAnswered,
    totalMarks: totalMarks,
    totalIgnored: totalIgnored,
    fails: fails,
  });
};
