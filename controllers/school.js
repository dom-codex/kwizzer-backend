const crypto = require("crypto");
const moment = require("moment");
const bcrypt = require("bcryptjs");
const School = require("../models/school");
const Person = require("../models/person");
const Classroom = require("../models/classrooms");
const Quiz = require("../models/quiz");
const Question = require("../models/questions");
const Options = require("../models/options");
const adminNotifications = require("../models/schoolNotification");
const Hall = require("../models/hall");
const SchoolNotification = require("../models/schoolNotification");
const Exam = require("../models/exam");
const ExamScore = require("../models/examScore");
//model imports
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
      attributes: ["ref"],
    });
    return res.json({
      school: sch.ref,
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
      noOfQuestionforStud,
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
    if (!school) {
      return res.json({
        code: 403,
        message: "school not found!!!",
      });
    }
    crypto.randomBytes(20, async (err, buffer) => {
      const token = buffer.toString("hex");
      const quiz = await Quiz.create({
        title: title,
        schoolId: sch.id,
        marks: markPerQuestion,
        totalMarks: totalMarks,
        nQuestions: noOfQuestionforStud,
        ref: token,
        published: false,
      });
    });
    res.json({
      code: 200,
      message: "quiz created successfully!!!",
    });
  } catch (err) {
    res.json({
      code: 400,
      message: "oops!!! an error occurred,try again",
    });
  }
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
  try {
    const { sid } = req.query;
    if (!sid)
      return res.json({
        code: 401,
        message: "classblock does not exist",
      });
    //find school
    const sch = await School.findOne({
      where: { ref: sid },
      attributes: ["id"],
    });
    //retrieve all quiz associated with school
    const quizzes = await Quiz.findAll({
      where: { schoolId: sch.id },
      // include: Person,
    });
    if (!quizzes) {
      return res.json({
        code: 403,
        quizzes: [],
        message: "you haven't published a quiz!!!",
      });
    }
    res.json({
      code: 200,
      quizzes: quizzes,
    });
  } catch (err) {
    console.log(err.message);
  }
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
  if (!quiz) {
    return res.json({ code: 403, message: " Quiz not found!!!" });
  }
  quiz.title = name;
  quiz.marks = mark;
  (quiz.totalMarks = total), (quiz.nQuestions = nQuestions);
  await quiz.save();
  res.json({
    code: 201,
    message: "Saved!!!",
  });
};
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
  if (!sch) {
    return res.json({
      code: 403,
      message: "school not found",
    });
  }
  const quiz = await Quiz.findOne({
    where: { ref: quid },
  });
  if (!quiz) {
    return res.json({
      code: 403,
      message: "quiz not found",
    });
  }
  const destroyedQuiz = await Quiz.destroy({
    where: {
      schoolId: sch.id,
      ref: quid,
    },
  });
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
    const { question, answer, opts } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({
        code: 403,
        message: "Question was not created,try again!!!",
      });
    }
    //retrive quiz
    const quiz = await Quiz.findOne({
      where: { ref: quid },
      attributes: ["id", "totalQuestions"],
    });
    if (!quiz) {
      return res.json({
        code: 403,
        message: "Quiz not found!!!,try again",
      });
    }
    const test = await Question.create({
      question: question,
      questionUrl: "",
      quizId: quiz.id,
    });
    const myoptions = formatOptions(opts, answer, test.id, true);
    //loop through the options
    if (myoptions.n > 1) {
      res.json({
        code: 403,
        message: "answer must be unique!!!",
      });
    } else if (myoptions.n <= 0) {
      res.json({
        code: 403,
        message: "please select an answer!!!",
      });
    }
    await Options.bulkCreate(myoptions.options, { validate: true });
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
  const { question, opts, answer, existing, todelete } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({
      code: 403,
      message: "Failed!!!",
    });
  }
  const myQuiz = await Quiz.findOne({
    where: { ref: quiz },
    attributes: ["id"],
  });
  const questions = await Question.findOne({
    where: { id: quid, quizId: myQuiz.id },
  });
  if (!questions)
    return res.json({
      code: 401,
      message: "no question found",
    });
  let tocreate = opts.map((option) => {
    if (option.id == 0) {
      return {
        option: option.value,
        questionId: quid,
        isAnswer: option.value === answer ? true : false,
      };
    } else return;
  });
  tocreate = tocreate.filter((tc) => tc);
  await Options.destroy({ where: { id: todelete } });
  if (tocreate.length) {
    await Options.bulkCreate(tocreate, { validate: true });
  }
  const myoptions = formatOptions(opts, answer, questions.id, true);
  if (myoptions.n > 1) {
    res.json({
      code: 403,
      message: "answer must be unique!!!",
    });
  } else if (myoptions.n <= 0) {
    res.json({
      code: 403,
      message: "please select an answer!!!",
    });
  }

  questions.question = question;
  await questions.save();
  const editedopts = await Options.findAll({
    where: { questionId: quid },
  });
  editedopts.forEach(async (o, i) => {
    o.option = myoptions.options[i].option;
    o.isAnswer = myoptions.options[i].isAnswer;
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
    // include: School,
  });
  //perform some checks to ensure minimum no of questions is set
  if (!quiz) {
    return res.json({
      code: 400,
      message: "Quiz not found!!!",
    });
  }
  if (quiz.totalQuestions < quiz.nQuestions) {
    return res.json({
      code: 400,
      message: "total no of questions too small",
    });
  }
  if (quiz.published) {
    return res.json({
      code: 400,
      message: "Already published!!!",
    });
  }
  quiz.published = true;
  quiz = await quiz.save();
  //classrooms will hold published quiz id
  const c = await Classroom.create({
    quizId: quiz.id,
    schoolId: quiz.schoolId,
  });
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
module.exports.adminNotifications = async (req, res, next) => {
  const { sch } = req.query;
  //get school
  const school = await School.findOne({
    where: { ref: sch },
  });
  await adminNotifications.update(
    {
      isNew: false,
    },
    { where: { schoolId: school.id } }
  );
  io.getIO().to(sch).emit("clear");
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
module.exports.getNewNotifications = async (req, res, next) => {
  const { sref } = req.query;
  //find person
  const school = await School.findOne({
    where: { ref: sref },
    attributes: ["id"],
  });
  if (!school) {
    return res.json({
      code: 403,
      notifications: 0,
    });
  }
  //get notifications
  const notifications = await SchoolNotification.count({
    where: { schoolId: school.id, isNew: true },
  });
  res.json({
    code: 200,
    notifications: notifications,
  });
};
module.exports.fetchStatistics = async (req, res, next) => {
  const { sch } = req.query;
  const school = await School.findOne({
    where: { ref: sch },
    attributes: ["id"],
  });
  const exams = await Exam.count({ where: { schoolId: school.id } });
  const quizzes = await Quiz.count({ where: { schoolId: school.id } });
  const candidates = await ExamScore.count({ where: { schoolId: school.id } });
  res.json({
    statistics: {
      exams: exams ? exams : 0,
      quizzes: quizzes ? quizzes : 0,
      candidates: candidates ? candidates : 0,
    },
  });
};
