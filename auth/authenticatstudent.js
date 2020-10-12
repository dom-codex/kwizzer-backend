const Person = require("../models/person");
module.exports.AuthenticateStudent = async (req, res, next) => {
  const { ref } = req.query;
  const person = await Person.findOne({ where: { ref: ref } });
  if (!person) {
    return res.json({
      isAuthenticated: false,
    });
  }
  return res.json({
    isAuthenticated: true,
  });
};
