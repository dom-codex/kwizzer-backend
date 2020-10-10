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
router.get("/user/stats", userControllers.getStatistics);
router.post(
  "/user/changepwd",
  validatePasswordResetData,
  userControllers.resetPassword
);
router.post("/user/edit/name", userControllers.changeName);
router.post("/user/edit/phone", userControllers.changePhone);
router.get("/user/delete", userControllers.deleteAccount);
module.exports = router;
