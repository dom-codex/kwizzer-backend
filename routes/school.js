const express = require("express");
const router = express.Router();

const schoolControllers = require("../controllers/school");
const studentControllers = require("../controllers/student");

/** route for School signup */
router.post("/create", schoolControllers.createSchool);
router.post("/login", schoolControllers.loginSchool);
//router.post("/class/create", schoolControllers.createClassBlock);
//router.post("/class/add/teacher", schoolControllers.addTeacher);
router.post("/class/enroll/student", schoolControllers.enrollStudent);
//tutor specific route
router.post("/class/create/quiz", schoolControllers.setQuiz);
router.post("/class/create/question", schoolControllers.setQuestion);
router.get("/class/get/question", schoolControllers.getSingleQuestion);
router.post("/class/update/question", schoolControllers.updateQuestion);
router.get("/class/quiz/all", schoolControllers.retrieveQuizzes);
router.get("/class/questions/all", schoolControllers.getAllQuizQuestions);
//student specific route
router.post("/student/quiz", studentControllers.takeQuiz);
router.post(
  "/student/mongo",
  require("../helpers/mongoStore").initQuestionsOnMongo
);
router.post("/student/submitquestion", studentControllers.submitAQuestion);
router.post("/student/submit", studentControllers.submitQuestion);
router.post("/student/check/result", studentControllers.checkResult);

module.exports = router;
