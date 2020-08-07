const Quiz = require("../models/quiz");
module.exports.deletePlenty = (id) => {
  return new Promise((resolve, reject) => {
    const quizzes = Quiz.findOne({
      where: { id: id },
    });
    resolve(quizzes);
  });
};
