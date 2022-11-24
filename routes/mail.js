import express from "express";
const router = express.Router();
import { getMail } from "../controllers/mail.js";

router.get("/getMail", getMail);

export default router;
