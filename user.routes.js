const express = require("express");
const { UserController } = require("./user.controllers");

const router = express.Router();

//post requests
router.post("/register", UserController.register);
router.post("/login", UserController.login);
router.post("/verifyToken", UserController.verifyToken);
router.post("/refreshToken", UserController.refreshToken);

module.exports.UserRouter = router;
