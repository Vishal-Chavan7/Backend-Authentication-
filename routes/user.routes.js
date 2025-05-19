import express from "express";
import {userRegistration, verify, login, logout,getMe, forgotPassword, resetPassword } from "../controller/user.controller.js";
import { authmiddleware } from "../middleware/auth.middleware.js";


const router = express.Router();

router.post("/register", userRegistration);
router.get("/verify/:token", verify);
router.post("/login", login);
router.get("/logout",authmiddleware, logout);
router.get("/me",authmiddleware, getMe)
router.post("/forgot", forgotPassword);
router.post("/reset-password/:token", resetPassword)

export default router;