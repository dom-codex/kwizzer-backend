const express = require("express");
const router = express.Router();
const {
  validateNewSchoolInfo,
  validateSchoolLoginInfo,
  QuestionValidator,
  validateExamForm,
  validateRegistration,
} = require("../validators/route-data-validate");
const schoolControllers = require("../controllers/school");
const studentControllers = require("../controllers/student");
const examControllers = require("../controllers/exam");

/** route for School signup */
router.post("/create", validateNewSchoolInfo, schoolControllers.createSchool);
router.post("/login", validateSchoolLoginInfo, schoolControllers.loginSchool);
//router.post("/class/create", schoolControllers.createClassBlock);
//router.post("/class/add/teacher", schoolControllers.addTeacher);
//tutor specific route
router.post("/class/create/quiz", schoolControllers.setQuiz);
router.get("/get/quiz", schoolControllers.getSingleQuiz);
router.post("/class/quiz/edit", schoolControllers.editQuiz);
router.get("/quiz/delete", schoolControllers.deleteQuiz);
router.post(
  "/class/create/question",
  QuestionValidator,
  schoolControllers.setQuestion
);
router.get("/class/get/question", schoolControllers.getSingleQuestion);
router.post(
  "/class/update/question",
  QuestionValidator,
  schoolControllers.updateQuestion
);
router.get("/question/delete", schoolControllers.deleteQuestion);
router.get("/class/quiz/all", schoolControllers.retrieveQuizzes);
router.get("/class/questions/all", schoolControllers.getAllQuizQuestions);
//router.get("/hall/all", schoolControllers.listRegisteredCandidates);
router.post("/quiz/publish", schoolControllers.publishQuiz);
router.get("/get/published", schoolControllers.listPublishedQuiz);
router.get("/get/all/publishedquiz", schoolControllers.listOnlyPublishedQuiz);
router.get("/admin/notifications", schoolControllers.adminNotifications);
router.get("/admin/new/notifications", schoolControllers.getNewNotifications);
router.get("/statistics", schoolControllers.fetchStatistics);
//student specific route
router.get("/get/notifications", studentControllers.getNotifications);
router.get(
  "/students/new/notifications",
  studentControllers.getNewNotifications
);
//exam routes
router.post("/set/examination", validateExamForm, examControllers.createExam);
router.get("/exam/set/regstatus", examControllers.setRegistration);
router.get("/exam/canstart", examControllers.canStartExam);
router.post("/exam/save", validateExamForm, examControllers.editQuiz);
router.get("/get/exams", examControllers.getExams);
router.get("/get/records", examControllers.ExamRecords);
router.get("/find/exam", examControllers.getAnExam);
router.get("/get/exam", examControllers.getSingleExam);
router.get("/exam/delete", examControllers.deleteAnExam);
router.post(
  "/exam/register",
  validateRegistration,
  examControllers.RegisterForExam
);
router.get("/get/examinations", examControllers.getAllSchoolExams);
router.get("/get/exam/hallstudents", examControllers.getAllExamCandidates);
router.get("/get/myexams", studentControllers.getStudentExams);
router.get("/get/exampaper", studentControllers.loadExamQuestion);
router.get("/exam/retry", studentControllers.retry);
router.post("/submit/exam/question", studentControllers.submitAQuestion);
router.post("/submit/examination", studentControllers.submitExamination);
router.get("/exam/results", examControllers.getStudentsExamResults);
router.get("/exam/result", examControllers.viewExamSolutions);
router.get("/exam/approve/result", examControllers.ApproveResult);
router.get("/exam/approve/single", examControllers.ApproveSingleResult);
router.get("/student/myexams", studentControllers.getFinishedExams);
router.get("/get/examsolution", studentControllers.showSolution);
module.exports = router;
