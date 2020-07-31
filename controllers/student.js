const Classroom = require("../models/classrooms");
const Quiz = require("../models/quiz");
const Question = require("../models/questions");
const Option = require("../models/options");
const classBlock = require("../models/class");
const scores = require("../models/scoreBoad");
const Hall = require("../models/hall");
const studentNotification = require("../models/studentNotification");
//model imports
const { mark } = require("../helpers/markQuiz");
//helper function import
const fetch = require("node-fetch");
const studentQuestion = require("../models/studentQuestion");
const Person = require("../models/person");
const School = require("../models/school");
const { genRandomNumbers } = require("../helpers/genRandom");
const adminNotifications = require("../models/schoolNotification");
const io = require("../socket");
module.exports.regForQuiz = async (req, res, next) => {
  const { sid, quid } = req.query;
  const { email } = req.body;
  //find user
  //add authentication to check for school and person
  const sch = await School.findByPk(sid);
  const quiz = await Quiz.findOne({ where: { id: quid } });
  const person = await Person.findOne({ where: { email: email } });
  if (!quiz.published) return res.json({ code: 401 });
  const hallstud = await Hall.create({
    quizId: quid,
    personId: person.id,
    schoolId: sid,
  });
  await quiz.save();
  const notify = await adminNotifications.create({
    topic: `${quiz.title} quiz registration`,
    message: `${person.name} has been successfully registered!!!`,
    time: "5:01am",
    schoolId: sid,
  });
  io.getIO()
    .to(sch.ref)
    .emit("notify", {
      message: `${person.name} has been successfully registered!!!`,
      topic: `${quiz.title} quiz registation`,
      time: "5:01am",
    });
  res.json({ code: 201 });
};
module.exports.getAppliedQuiz = async (req, res, next) => {
  const { pid } = req.query;
  const quizzes = await Hall.findAll({
    where: {
      personId: pid,
    },
    include: [School, Quiz],
  });
  //filter out null quizzes
  const newQuizzes = quizzes.filter((quiz) => quiz.quizId != null);
  res.json({
    quizzes: newQuizzes,
  });
};

module.exports.takeQuiz = async (req, res, next) => {
  /*retrieve students info */
  try {
    const { sch, pid, quiz, retry } = req.query;

    //comfirm if student belongs to classroom of school whose quiz
    //they want to take
    /*const student = await Classroom.findOne({
      where: {
        personId: pid,
        schoolId: sch,
      },
    });
    if (!student) {
      return res.json({
        code: 400,
        message: "you not allowed to take this quiz",
      });
    }*/
    //get questions with the related quiz id
    /* const quiz = await Quiz.findByPk(quid);*/
    //find quiz
    const selectedQuiz = await Quiz.findOne({
      where: { id: quiz },
    });
    //get no of approved question to be  answered
    const toAnswer = selectedQuiz.nQuestions;

    const questions = await Question.findAll({
      where: { quizId: quiz },
      include: Option,
    });
    //transform the questions retrieve from mysql db
    const transformed = [];
    const random = [];
    //questions.forEach((question, i) =>
    for (let i = 0; i < toAnswer; i++) {
      //generate random number
      const n = genRandomNumbers(random, questions.length);
      const question = questions[n - 1];

      transformed.push({
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
      });
    }
    /*store selected questions in mongodb collection
     */
    const resp = await fetch(
      `http://127.0.0.1:3500/school/student/mongo?retry=${retry}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: transformed,
          body: req.query,
          title: selectedQuiz.title,
          canRetake: selectedQuiz.canReTake,
          retries: selectedQuiz.retries,
        }),
      }
    );
    const data = await resp.json();
    /* if code is 201 means a new document was created in the mongod
    db collection, update the sql db with the document id */
    if (data.code === 403) {
      return res.json({
        code: 403,
        message: data.message,
      });
    } else if (data.code === 201) {
      await scores.create({
        questId: data.id,
        personId: pid,
        quizId: quiz,
        score: 0,
      });
      return res.json({
        id: data.id,
        questions: transformed,
      });
    }
    return res.json({
      id: data.id,
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
    const quiz = await Quiz.findOne({ where: { id: squid }, include: School });
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
    let studBoard = await scores.findOne({ where: { questId: mquid } });
    studBoard.score = result.score;
    await studBoard.save();
    const paper = await Hall.findOne({
      where: { quizId: quiz.id, personId: studentQuest.student },
    });
    paper.completed = true;
    await paper.save();
    if (choice === "onsubmit") {
      studentQuest.isApproved = true;
      studentQuest = await studentQuest.save();
      const person = await Person.findOne({
        where: { id: studentQuest.student },
      });
      const notify = await adminNotifications.create({
        message: `${person.name} has submitted`,
        topic: `${quiz.title} Quiz submission`,
        time: "5:01am",
        schoolId: quiz.school.id,
      });
      quiz.NumberOfSubmitted = quiz.NumberOfSubmitted + 1;
      await quiz.save();
      io.getIO()
        .to(quiz.school.ref)
        .emit("notify", {
          message: `${person.name} has submitted`,
          topic: `${quiz.title} Quiz submission`,
          time: "5:01am",
        });
      return res.json({
        code: 201,
        message: "result is ready",
      });
    }
    await studentQuest.save();
    //find person
    const person = await Person.findOne({
      where: { id: studentQuest.student },
    });
    const notify = await adminNotifications.create({
      message: `${person.name} has submitted!!!`,
      topic: `${quiz.title} Quiz submission`,
      time: "5:01am",
      schoolId: quiz.school.id,
    });
    io.getIO()
      .to(quiz.school.ref)
      .emit("notify", {
        message: `${person.name} has submitted`,
        topic: `${quiz.title} Quiz submission`,
        time: "5:01am",
      });
    return res.json({
      code: 201,
      message: "result needs to be approved by examiner,pls be patient",
    });
  } catch (err) {
    console.log(err.message);
  }
};
module.exports.checkResult = async (req, res, next) => {
  //retrieve students question on mongodb
  const { pid } = req.query;
  //retireve student's doc
  const studentQuestionPapers = await studentQuestion
    .find({
      $and: [{ student: pid }, { isComplete: true }, { isApproved: true }],
    })
    .select("-questions");

  return res.json({
    code: 200,
    questionPapers: studentQuestionPapers,
  });
};
module.exports.ViewSolution = async (req, res, next) => {
  const { paper } = req.query;
  const questionPaper = await studentQuestion
    .findById(paper)
    .select("questions _id");
  res.json({
    questions: questionPaper,
    code: 200,
  });
};
module.exports.getNotifications = async (req, res, next) => {
  const { student } = req.query;
  const notifications = await studentNotification.findAll({
    where: { personId: student },
  });
  res.json({
    code: 200,
    notifications: notifications,
  });
};
