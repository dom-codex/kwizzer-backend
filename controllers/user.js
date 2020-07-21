const bcrypt = require("bcryptjs");
const Person = require("../models/person");
//third party imports
module.exports.createUser = async (req, res, next) => {
  //retrive data from body
  console.log(req.body);
  return;
  const { email, name, password } = req.body;
  //check for errors later
  //hash password
  const hashedPassword = await bcrypt.hash(password, 12);
  const person = await Person.create({
    email: email,
    name: name,
    password: hashedPassword,
  });
  res.json({
    code: 201,
    message: "account sucessfully created!!!",
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
    code: 200,
    message: "authenticated",
  });
};
