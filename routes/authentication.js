const express = require("express");
const router = express.Router();
const AuthStudent = require("../auth/authenticatstudent");
const AuthSchool = require("../auth/authenticateSchool");
router.get("/student", AuthStudent.AuthenticateStudent);
router.get("/school", AuthSchool.AuthenticateSchool);
module.exports = router;
