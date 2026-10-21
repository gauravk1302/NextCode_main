import express from "express";
import {login , logout , deductCredits, addCredits} from "../controllers/auth.controller.js";

const router =  express.Router();

router.post("/login" , login);
router.post("/logout" , logout);
router.post("/credits/deduct",deductCredits);
router.post("/credits/add",addCredits);

export default router;