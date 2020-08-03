const { mark } = require("./markQuiz");
module.exports.MarkExamScript = (quizzes) => {
  let score = 0;
  let fails = 0;
  let totalAnswered = 0;
  let totalIgnored = 0;
  if (!quizzes.length) return;
  quizzes.forEach((quiz) => {
    const result = mark(quiz.questions, quiz.marksPerQuestion);
    score += result.score;
    fails += result.fails;
    totalAnswered += result.totalAnswered;
    totalIgnored += result.totalIgnored;
  });
  return {
    score,
    fails,
    totalAnswered,
    totalIgnored,
  };
};
