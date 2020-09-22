const express = require("express");
const router = express.Router();
const {
  validateNewUserInfo,
  validateLoginInfo,
  validatePasswordResetData,
} = require("../validators/route-data-validate");
const userControllers = require("../controllers/user");

/** route for user signup */
router.post("/user/create", validateNewUserInfo, userControllers.createUser);
router.post("/user/login", validateLoginInfo, userControllers.loginUser);
router.get("/user/find", userControllers.findUser);
router.post(
  "/user/changepwd",
  validatePasswordResetData,
  userControllers.resetPassword
);
module.exports = router;
