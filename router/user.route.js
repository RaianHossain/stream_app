const express = require("express");
const { UserController } = require("../controller/user.controller");
const catchAsync = require("../util/catchAsync");
const checkAuth = require("../middleware/checkAuth");

const router = express.Router();

router.get("/users", checkAuth, UserController.getUsers);
router.put("/users/:id", checkAuth, UserController.updateUser);
router.delete("/users/:id", checkAuth, UserController.deleteUser);
router.post("/login", catchAsync(UserController.login));
router.post("/register", catchAsync(UserController.register));
router.post("/refresh-token", catchAsync(UserController.refreshToken));

module.exports = router;
