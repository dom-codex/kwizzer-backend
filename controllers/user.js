const bcrypt = require("bcryptjs");
const Person = require("../models/person");
const examScore = require("../models/examScore");
const examQuestions = require("../models/examQuestions");
const exam = require("../models/exam");
const notification = require("../models/studentNotification");
const crypto = require("crypto");
const { validationResult } = require("express-validator");
const { HandleUserError } = require("../helpers/errorHandler");

//third party imports
module.exports.createUser = async (req, res, next) => {
  try {
    //retrive data from body
    const { email, name, password, phone } = req.body;
    //check for errors later
    //hash password
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const input = HandleUserError(req.body, errors, req);
      return res.json({
        code: 403,
        data: input,
      });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    crypto.randomBytes(20, async (err, buffer) => {
      const ref = buffer.toString("hex");
      const person = await Person.create({
        email: email,
        name: name,
        phone: phone,
        password: hashedPassword,
        ref: ref,
      });
      res.json({
        code: 201,
        user: {
          ref: ref,
          name: name,
        },
        message: "account sucessfully created!!!",
      });
    });
  } catch (err) {
    console.log(err);
  }
};
module.exports.loginUser = async (req, res, next) => {
  try {
    //retrieve user details from body;
    const { email, password } = req.body;
    //compare password with hash
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({
        code: 403,
        email: email,
        message: "invalid email or password",
      });
    }
    const person = await Person.findAll({ where: { email: email } });
    const isPassword = await bcrypt.compare(password, person[0].password);
    if (!isPassword) {
      return res.json({
        code: 400,
        message: "no user was found",
      });
    }
    res.json({
      code: 201,
      user: person[0],
      message: "authenticated",
    });
  } catch (err) {
    console.log(err);
  }
};
module.exports.findUser = async (req, res, next) => {
  let person;
  const { ref, fulldetails } = req.query;
  if (fulldetails) {
    person = await Person.findOne({
      where: { ref: ref },
      attributes: ["name", "email", "phone"],
    });
  } else {
    person = await Person.findOne({
      where: { ref: ref },
      attributes: ["ref", "name"],
    });
  }
  if (!person) {
    return res.json({
      code: 400,
      message: "no user was found",
    });
  }
  return res.json({
    code: 201,
    user: person,
  });
};
module.exports.resetPassword = async (req, res, next) => {
  const { ref } = req.query;
  const { oldPwd, newPwd } = req.body;
  const errors = validationResult(req);
  const oldError = errors.errors.find((err) => err.param === "oldPwd");
  const newError = errors.errors.find((err) => err.param === "newPwd");
  if (!errors.isEmpty()) {
    return res.json({
      code: 403,
      err: {
        oldError: oldError ? oldError : false,
        newError: newError ? newError : false,
      },
    });
  }
  const person = await Person.findOne({
    where: { ref: ref },
    attributes: ["id", "password"],
  });
  const isPassword = await bcrypt.compare(oldPwd, person.password);
  if (!isPassword) {
    return res.json({
      code: 403,
      message: "Incorrect old password",
    });
  }
  const hashedPassword = await bcrypt.hash(newPwd, 12);
  person.password = hashedPassword;
  await person.save();
  res.json({
    code: 200,
    message: "password changed succesfully",
  });
};
module.exports.changeName = async (req, res, next) => {
  const { ref } = req.query;
  const { name } = req.body;
  const person = await Person.findOne({
    where: { ref: ref },
    attributes: ["id", "name"],
  });
  person.name = name;
  await person.save();
  return res.json({
    code: 201,
    message: "name changed successfully!!!",
  });
};
module.exports.changePhone = async (req, res, next) => {
  const { ref } = req.query;
  const { phone } = req.body;
  const person = await Person.findOne({
    where: { ref: ref },
    attributes: ["id", "phone"],
  });
  person.phone = phone;
  await person.save();
  return res.json({
    code: 201,
    message: "phone changed successfully!!!",
  });
};
module.exports.deleteAccount = async (req, res, next) => {
  try {
    const { ref } = req.query;
    const person = await Person.findOne({
      where: { ref: ref },
      attributes: ["id"],
    });
    //DELETE NOTIFICATIONS
    await notification.destroy({ where: { personId: person.id } });
    //GET EXAM SCORES
    const examscores = await examScore.findAll({
      where: { personId: person.id },
      attributes: ["id", "examsheet", "personId"],
    });
    const sheets = examscores.map((sheet) => sheet.examsheet);
    //DELETE QUESTION PAPER
    await examQuestions.deleteMany({ _id: { $in: sheets } });
    //DELETE EXAM SCORES
    const scores = sheets.map((sheet) => sheet.id);
    await examScore.destroy({ where: { id: scores } });
    //DELETE ACCOUNT
    await person.destroy();
    return res.json({
      code: 201,
      message: "account deleted",
    });
  } catch (err) {
    console.log(err);
  }
};
module.exports.getStatistics = async (req, res, next) => {
  const { ref } = req.query;
  let examNames = null;
  const person = await Person.findOne({
    where: { ref: ref },
    attributes: ["id"],
  });
  const completedQuestions = await examQuestions.countDocuments({
    $and: [{ student: person.id }, { isComplete: true }, { isApproved: true }],
  });
  const registeredExam = await examScore.count({
    personId: person.id,
  });
  const highestScore = await examQuestions
    .findOne({
      $and: [
        { student: person.id },
        { isComplete: true },
        { isApproved: true },
      ],
    })
    .select(["score", "exam", "schoolName"])
    .sort({ score: -1 })
    .limit(1);
  if (highestScore) {
    examNames = await exam.findOne({
      where: { id: highestScore.exam },
      attributes: ["name"],
    });
  }
  res.json({
    code: 200,
    completedQuestions,
    registeredExam,
    highestScore,
    examNames,
  });
};
