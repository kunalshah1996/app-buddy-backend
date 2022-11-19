import express from "express";
const router = express.Router();
<<<<<<< HEAD
import { getUser } from "../controllers/mail.js";

// router.get("/read", readMail);
router.get("/user", getUser);

export default router;
=======
import { getMail } from "../controllers/mail.js";

router.get("/getMail", getMail);

export default router;
>>>>>>> dev
