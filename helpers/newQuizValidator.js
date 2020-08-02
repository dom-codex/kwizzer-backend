module.exports.validateNewQuizData = (req) => {
  const {
    title,
    markPerQuestion,
    noOfQuestionForStud,
    totalMarks,
    resultDelivery,
    hours,
    min,
    sec,
    publish,
    retry,
    retries,
    school,
  } = req.body;
  if (
    parseFloat(markPerQuestion) * parseInt(noOfQuestionForStud) !==
    parseInt(totalMarks)
  ) {
    return { result: false, message: "total marks is incorrect" };
  } else if (hours === "0" && min === "0" && sec === "0") {
    return { result: false, message: "invalid time" };
  }
  return { result: true };
};
