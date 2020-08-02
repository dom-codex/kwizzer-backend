const ExamSheet = require("../models/examQuestions");
const { genRandomNumbers } = require("../helpers/genRandom");

module.exports.initExamQuestion = (
  quizzes,
  questions,
  school,
  person,
  exam,
  quids
) => {
  const ran = [];
  const studentQuestions = [];
  for (let i = 0; i < quizzes.length; i++) {
    const quiz = quizzes[i];
    const toAnswer = quiz.nQuestions;
    const questionsToAnswer = [];
    const myQuestions = questions.filter(
      (question) => question.quizId === quiz.id
    );
    for (let i = 0; i < toAnswer; i++) {
      //generate random number
      const n = genRandomNumbers([], myQuestions.length);
      const question = myQuestions[n - 1];
      questionsToAnswer.push({
        question: question.question,
        questionUrl: question.questionUrl,
        questIndex: i + 1,
        answered: false,
        options: question.options.map((option) => {
          return {
            isAnswer: option.isAnswer,
            option: option.option,
          };
        }),
      });
    }
    studentQuestions.push({
      title: quiz.title,
      noOfQuestions: quiz.nQuestions,
      questions: questionsToAnswer,
    });
  }
  return ExamSheet.create({
    title: exam.name,
    quiz: quids,
    school: school.id,
    student: person.id,
    schoolName: school.name,
    totalMarks: exam.TotalMarks,
    quizzes: studentQuestions,
  });
};
