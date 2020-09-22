const bcrypt = require("bcryptjs");
const Person = require("../models/person");
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
  console.log(errors.errors);
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
