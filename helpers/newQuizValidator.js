module.exports.validateNewQuizData = (req) => {
  const { title, markPerQuestion, noOfQuestionForStud, totalMarks } = req.body;
  if (
    parseFloat(markPerQuestion) * parseInt(noOfQuestionForStud) !==
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
