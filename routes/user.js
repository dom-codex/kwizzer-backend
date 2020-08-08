const express = require("express");
const router = express.Router();
const {
  validateNewUserInfo,
  validateLoginInfo,
} = require("../validators/route-data-validate");
const userControllers = require("../controllers/user");

/** route for user signup */
router.post("/user/create", validateNewUserInfo, userControllers.createUser);
router.post("/user/login", validateLoginInfo, userControllers.loginUser);
router.get("/user/find", userControllers.findUser);

module.exports = router;
