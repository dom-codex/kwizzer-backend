const mongoose = require("mongoose");
const schema = mongoose.Schema;
const ExamQuestionSchema = new schema({
  title: schema.Types.String,
  quiz: [schema.Types.Number],
  school: schema.Types.Number,
  student: schema.Types.Number,
  studentName: schema.Types.String,
  schoolName: schema.Types.String,
  isComplete: {
    type: schema.Types.Boolean,
    default: false,
  },
  isApproved: {
    type: schema.Types.Boolean,
    default: false,
  },
  score: {
    type: schema.Types.Decimal128,
    default: 0,
  },
  fails: {
    type: schema.Types.Number,
    default: 0,
  },
  totalAnswered: {
    type: schema.Types.Number,
    default: 0,
  },
  totalIgnored: {
    type: schema.Types.Number,
    default: 0,
  },
  totalMarks: {
    type: schema.Types.Number,
    default: 0,
  },
  quizzes: [
    {
      title: schema.Types.String,
      noOfQuestions: schema.Types.Number,
      marksPerQuestion: schema.Types.Number,
      questions: [
        {
          question: schema.Types.String,
          questionUrl: schema.Types.String,
          answered: schema.Types.Boolean,
          questIndex: schema.Types.Number,
          answer: schema.Types.String,
          options: schema.Types.Array,
        },
      ],
    },
  ],
});
module.exports = mongoose.model("ExamQuestion", ExamQuestionSchema);
