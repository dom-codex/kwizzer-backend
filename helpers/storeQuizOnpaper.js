const ExamPaper = require("../models/examPaper");
const { deletePlenty } = require("../utils/deletePlenty");
module.exports.storeExamQuizzes = async (
  examId,
  quizzes,
  edit = false,
  todelete = [],
  tocreate = []
) => {
  // const quiz = Object.values(quizzes).map((quiz) => quiz);
  let papers = [];
  if (!edit) {
    papers = quizzes.map((quid) => {
      return { examId: examId, quizId: quid };
    });
    const exampaper = await ExamPaper.bulkCreate(papers, { validate: true });
    return;
  } else {
    papers = tocreate.map((quid) => {
      return { examId: examId, quizId: quid };
    });
    const exampaper = await ExamPaper.bulkCreate(papers, {
      validate: true,
    });
    const del = todelete.map((quiz) => {
      return deletePlenty(examId, quiz);
    });
    (async () => {
      for await (const d of del) {
        console.log("this is ", d);
      }
    })();
    /*const exampaper = await ExamPaper.bulkUpdate(papers, { validate: true });
    return exampaper;*/
  }
};
