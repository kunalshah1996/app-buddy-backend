import express from "express";
const router = express.Router();

import {
  createSheet,
  getCompanyList,
  insertCompany,
  updateSheetData,
  getAllData,
  getSheetId,
} from "../controllers/sheet.js";

router.post("/create", createSheet);
router.get("/getSheetId", getSheetId);
router.get("/getAllData", getAllData);
router.get("/getCompanyList", getCompanyList);
router.post("/insertCompany", insertCompany);
router.post("/updateSheetData", updateSheetData);

export default router;
