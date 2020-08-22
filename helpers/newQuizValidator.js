module.exports.validateNewQuizData = (req) => {
  const { title, markPerQuestion, noOfQuestionforStud, totalMarks } = req.body;
  if (
    parseFloat(markPerQuestion) * parseInt(noOfQuestionforStud) !=
    parseInt(totalMarks)
  ) {
    return { result: false, message: "total marks is incorrect!!!" };
  } else if (title.length === 0) {
    return { result: false, message: "title cannot be empty!!!" };
  } else if (title.length < 5) {
    return { result: false, message: "title too short!!! " };
  }
  return { result: true };
};
