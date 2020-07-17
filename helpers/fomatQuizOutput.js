module.exports.formatQuiz = (quizzes, questions) => {
  const reformed = [];
  quizzes.forEach((quiz) => {
    const formattedQuestions = [];
    questions.forEach((question) => {
      if (question.quiz.id === quiz.id) {
        formattedQuestions.push({
          _id: question.id,
          question: question.question,
          url: question.questionUrl,
          options: question.options,
        });
      }
    });
    reformed.push({
      quiz: quiz,
      question: formattedQuestions,
    });
  });
  return reformed;
};
