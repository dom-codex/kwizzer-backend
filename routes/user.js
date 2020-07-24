const express = require("express");
const router = express.Router();

const userControllers = require("../controllers/user");

/** route for user signup */
router.post("/user/create", userControllers.createUser);
router.post("/user/login", userControllers.loginUser);
router.get("/user/find", userControllers.findUser);

module.exports = router;
