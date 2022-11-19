import express from "express";
const router = express.Router();

<<<<<<< HEAD
import {
  createSheet,
  getCompanyList,
  insertCompany,
  insertOAData,
} from "../controllers/sheet.js";

router.post("/", createSheet);
// router.get("/getAllData", getAllData)
router.get("/getCompanyList", getCompanyList);
router.post("/insertCompany", insertCompany);
router.post("/insertOAData", insertOAData);
=======
import { createSheet, getCompanyList, insertCompany, insertOAData, getAllData, getSheetId } from '../controllers/sheet.js'

router.post("/create", createSheet);
router.get("/getSheetId", getSheetId);
router.get("/getAllData", getAllData);
router.get('/getCompanyList', getCompanyList);
router.post('/insertCompany', insertCompany);
router.post('/insertOAData', insertOAData);
>>>>>>> dev

export default router;
