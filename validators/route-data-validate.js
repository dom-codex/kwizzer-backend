const Person = require("../models/person");
const School = require("../models/school");
const Quiz = require("../models/quiz");
const ExamScore = require("../models/examScore");
const { check } = require("express-validator");
const bcrypt = require("bcryptjs");
const Exam = require("../models/exam");
module.exports.validateNewUserInfo = [
  check("name")
    .isLength({ min: 300 })
    .withMessage("name too short")
    .isLength({ max: 25 })
    .trim(),
  check("email")
    .isEmail()
    .withMessage("input is not an email")
    .isLength({ min: 3 })
    .withMessage("invalid email")
    .custom((val, { req }) => {
      return Person.findOne({ where: { email: val } }).then((user) => {
        if (user) {
          return Promise.reject("email already in use");
        }
      });
    })
    .trim()
    .normalizeEmail(),
  check("password")
    .isLength({ min: 5 })
    .withMessage("password too short")
    .custom((val, { req }) => {
      if (val === req.body.comfirm) {
        return true;
      }
      return false;
    })
    .withMessage("passwords do not match")
    .trim(),
];
module.exports.validateLoginInfo = [
  check("email")
    .isEmail()
    .withMessage("invalid email")
    .custom((val, { req }) => {
      return Person.findOne({ where: { email: val } }).then(async (user) => {
        const isPassword = await bcrypt.compare(
          req.body.password,
          user.password
        );

        if (!user) {
          return Promise.reject("invalid email or password");
        } else if (!isPassword) {
          return Promise.reject("invalid email or password");
        }
      });
    }),
];
module.exports.validateNewSchoolInfo = [
  check("name")
    .isLength({ min: 3 })
    .withMessage("name too short")
    .isLength({ max: 25 })
    .trim(),
  check("email")
    .isEmail()
    .withMessage("input is not an email")
    .isLength({ min: 3 })
    .withMessage("invalid email")
    .custom((val, { req }) => {
      return School.findOne({ where: { email: val } }).then((user) => {
        if (user) {
          return Promise.reject("email already in use");
        }
      });
    })
    .trim()
    .normalizeEmail(),
  check("password")
    .isLength({ min: 5 })
    .withMessage("password too short")
    .custom((val, { req }) => {
      if (val === req.body.comfirm) {
        return true;
      }
      return false;
    })
    .withMessage("passwords do not match")
    .trim(),
];
module.exports.validateSchoolLoginInfo = [
  check("email")
    .isEmail()
    .withMessage("invalid email")
    .custom((val, { req }) => {
      return School.findOne({ where: { email: val } }).then(async (user) => {
        const isPassword = await bcrypt.compare(
          req.body.password,
          user.password
        );

        if (!user) {
          return Promise.reject("invalid email or password");
        } else if (!isPassword) {
          return Promise.reject("invalid email or password");
        }
      });
    }),
];
module.exports.QuestionValidator = [
  check("question")
    .isLength({ min: 1 })
    .withMessage("Question cannot be empty"),
  check("opts")
    .custom((val, { req }) => {
      let count = 0;
      for (let i = 0; i < val.length; i++) {
        if (val[i].value.length) {
          count++;
          continue;
        }
        continue;
      }
      if (count === val.length) {
        return true;
      }
      return false;
    })
    .withMessage("invalid option(s)"),
];
module.exports.validateExamForm = [
  check("title").isLength({ min: 3 }).withMessage("name is too short"),
  check("quiz")
    .custom((val, { req }) => {
      if (req.body.type === "standard") {
        if (val.length) {
          return true;
        } else {
          return false;
        }
      } else {
        return true;
      }
    })
    .withMessage("please select a quiz!!!")
    .custom((val, { req }) => {
      if (req.body.type === "standard") {
        return Quiz.findAll({ where: { id: val } }).then((res) => {
          if (res.length !== val.length) {
            return Promise.reject("please select quiz to answer");
          }
        });
        //.catch((err) => console.log(err));
      }
      return true;
    }),
  check("choice").isLength({ min: 5 }).withMessage("invalid choice"),
  check("type").isLength({ min: 5 }).withMessage("invalid type"),
  check("total")
    .custom((val, { req }) => {
      if (!val > 0) {
        return false;
      }
      return true;
    })
    .withMessage("total cannot be zero")
    .custom((val, { req }) => {
      return Quiz.findAll({
        where: { id: req.body.quiz },
        attributes: ["totalMarks"],
      }).then(async (quizzes) => {
        let totalMarks = 0;
        if (req.body.type === "standard") {
          quizzes.forEach((quiz) => {
            totalMarks += quiz.totalMarks;
          });
          if (totalMarks !== val) {
            return Promise.reject("invalid total marks!");
          }
        }
      });
      //.catch((err) => console.log(err));
    }),
  check("nquiz")
    .custom((val, { req }) => {
      val = val.toString();
      if (req.body.type === "standard") {
        if (req.body.quiz.length === parseInt(val) && val.length) {
          return true;
        }
        return false;
      } else {
        if (parseInt(val) > 0) {
          return true;
        }
        return false;
      }
    })
    .withMessage("invalid no of quiz"),
  check("sec")
    .custom((val, { req }) => {
      const sec = parseInt(val);
      if (sec >= 0 && sec <= 59) {
        return true;
      }
      return false;
    })
    .withMessage("invalid seconds value"),
  check("min")
    .custom((val, { req }) => {
      const min = parseInt(val);
      if (min >= 0 && min <= 59) {
        return true;
      }
      return false;
    })
    .withMessage("invalid minutes value"),
  check("hr")
    .custom((val, { req }) => {
      const hr = parseInt(val);
      if (hr >= 0 && hr <= 59) {
        return true;
      }
      return false;
    })
    .withMessage("invalid hrs value"),
];
exports.validateRegistration = [
  check("email")
    .isEmail()
    .custom(async (val, { req }) => {
      console.log(req.body.quiz);
      const person = await Person.findOne({
        where: { email: val },
        attributes: ["id"],
      });
      const exam = await Exam.findOne({
        where: { ref: req.body.quiz },
        attributes: ["TotalMarks", "nQuiz", "id"],
      });
      if (!person) {
        return Promise.reject("invalid email address");
      }
      const n = await ExamScore.count({
        where: { personId: person.id, examId: exam.id },
      });
      if (req.body.type === "custom") {
        if (n) {
          return Promise.reject("already registered");
        }
        //GET SELELCTED QUIZ
        let totalMarkOfSelectedQuiz = 0;
        const selectedQuizzes = await Quiz.findAll({
          where: { id: req.body.subjects },
          attributes: ["totalMarks"],
        });
        const exam = await Exam.findOne({
          where: { ref: req.body.quiz },
          attributes: ["TotalMarks", "nQuiz"],
        });
        selectedQuizzes.forEach((quiz) => {
          totalMarkOfSelectedQuiz += quiz.totalMarks;
        });
        if (totalMarkOfSelectedQuiz !== exam.TotalMarks) {
          return Promise.reject("Please select the rigth quiz combination");
          //return new Error("Too many/few quiz selected");
        } else if (exam.nQuiz !== req.body.subjects.length) {
          return Promise.reject("Too many/few questions selected");
        }
      } else {
        if (n) {
          return Promise.reject("already registered");
        }
      }
    }),
];
