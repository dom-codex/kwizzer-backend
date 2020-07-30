const mongoose = require("mongoose");
const schema = mongoose.Schema;
const StudentQuestionSchema = new schema({
  title: schema.Types.String,
  quiz: schema.Types.Number,
  school: schema.Types.Number,
  classBlock: schema.Types.Number,
  noOfQuestions: schema.Types.Number,
  student: schema.Types.Number,
  retries: schema.Types.Number,
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
});
module.exports = mongoose.model("StudentQuestion", StudentQuestionSchema);
