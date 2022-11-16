import express from "express";
const router = express.Router();
import { getUser } from "../controllers/mail.js";

// router.get("/read", readMail);
router.get("/user", getUser);

export default router;
