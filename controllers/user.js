const bcrypt = require("bcryptjs");
const Person = require("../models/person");
const crypto = require("crypto");
//third party imports
module.exports.createUser = async (req, res, next) => {
  //retrive data from body
  const { email, name, password, phone } = req.body;
  //check for errors later
  //hash password
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
      },
      message: "account sucessfully created!!!",
    });
  });
};
module.exports.loginUser = async (req, res, next) => {
  //retrieve user details from body;
  const { email, password } = req.body;
  //compare password with hash
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
};
module.exports.findUser = async (req, res, next) => {
  const { ref } = req.query;
  const person = await Person.findOne({ where: { ref: ref } });
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
