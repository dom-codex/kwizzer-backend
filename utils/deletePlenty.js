const ExamPaper = require("../models/examPaper");
module.exports.deletePlenty = (examId, quid) => {
  return new Promise((resolve, reject) => {
    const paper = ExamPaper.destroy({
      where: { examId: examId, quizId: quid },
    });
    resolve(paper);
  });
};
