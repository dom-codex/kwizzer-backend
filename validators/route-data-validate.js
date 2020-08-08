const Person = require("../models/person");
const School = require("../models/school");
const { check } = require("express-validator");
const bcrypt = require("bcryptjs");
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
