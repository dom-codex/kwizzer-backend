const express = require('express');
const router = express.Router();

const schoolControllers = require('../controllers/school');

/** route for School signup */
router.post('/create',schoolControllers.createSchool);
router.post('/login',schoolControllers.loginSchool);
router.post('/class/create',schoolControllers.createClassBlock);
router.post('/class/add/teacher',schoolControllers.addTeacher);
router.post('/class/enroll/student',schoolControllers.enrollStudent);
router.post('/class/create/quiz',schoolControllers.setQuiz);

module.exports =  router;