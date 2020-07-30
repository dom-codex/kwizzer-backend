const express = require("express");
const router = express.Router();

const schoolControllers = require("../controllers/school");
const studentControllers = require("../controllers/student");

/** route for School signup */
router.post("/create", schoolControllers.createSchool);
router.post("/login", schoolControllers.loginSchool);
//router.post("/class/create", schoolControllers.createClassBlock);
//router.post("/class/add/teacher", schoolControllers.addTeacher);
//tutor specific route
router.post("/class/create/quiz", schoolControllers.setQuiz);
router.post("/class/quiz/edit", schoolControllers.editQuiz);
router.get("/quiz/delete", schoolControllers.deleteQuiz);
router.post("/class/create/question", schoolControllers.setQuestion);
router.get("/class/get/question", schoolControllers.getSingleQuestion);
router.post("/class/update/question", schoolControllers.updateQuestion);
router.get("/class/quiz/all", schoolControllers.retrieveQuizzes);
router.get("/class/questions/all", schoolControllers.getAllQuizQuestions);
router.get("/hall/all", schoolControllers.listRegisteredCandidates);
router.post("/quiz/publish", schoolControllers.publishQuiz);
router.get("/get/published", schoolControllers.listPublishedQuiz);
router.get("/get/students/result", schoolControllers.viewStudentResult);
router.get("/approve/results", schoolControllers.ApproveResult);
router.get("/approve/result", schoolControllers.ApproveSingleResult);
router.get("/admin/notifications", schoolControllers.adminNotifications);
//student specific route
router.post("/quiz/register", studentControllers.regForQuiz);
router.get("/student/get/quiz", studentControllers.getAppliedQuiz);
router.get("/student/quiz", studentControllers.takeQuiz);
router.post(
  "/student/mongo",
  require("../helpers/mongoStore").initQuestionsOnMongo
);
router.post("/student/submitquestion", studentControllers.submitAQuestion);
router.post("/student/submit", studentControllers.submitQuestion);
router.get("/student/check/result", studentControllers.checkResult);
router.get("/get/student/questionpaper", studentControllers.ViewSolution);
router.get("/get/notifications", studentControllers.getNotifications);

module.exports = router;
