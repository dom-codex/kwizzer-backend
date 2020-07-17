module.exports.mark = (questions, mark) => {
  //get total number of questions
  const totalQuestions = questions.length;
  let totalAnswered = 0;
  let totalIgnored = 0;
  let score = 0;
  let fails = 0;
  questions.forEach((question) => {
    //check if question was answered by student
    const didAnswer = question.answered;
    if (!didAnswer) {
      fails++;
      totalIgnored++;
      return;
    }
    //retrieve tutors answer
    const realAnswer = question.options.find((option) => option.isAnswer);
    //retrieve user answere
    const answer = question.answer;
    if (realAnswer.option.toString() === answer.toString()) {
      totalAnswered++;
      score += mark;
      return;
    } else {
      fails++;
      totalAnswered++;
    }
  });
  return {
    score: score,
    fails: fails,
    totalAnswered: totalAnswered,
    totalIgnored: totalIgnored,
    // totalQuestions: totalQuestions,
  };
};
