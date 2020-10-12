const School = require("../models/school");
module.exports.AuthenticateSchool = async (req, res, next) => {
  const { ref } = req.query;
  const school = await School.findOne({ where: { ref: ref } });
  console.log("here");
  if (!school) {
    return res.json({
      isAuthenticated: false,
    });
  }
  return res.json({
    isAuthenticated: true,
  });
};
