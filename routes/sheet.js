import express from "express";
const router = express.Router();

import { createSheet, getCompanyList, insertCompany, insertOAData, getAllData, getSheetId, deleteCompany, updateStatus } from '../controllers/sheet.js'

router.post("/create", createSheet);
router.get("/getSheetId", getSheetId);
router.get("/getAllData", getAllData);
router.get('/getCompanyList', getCompanyList);
router.post('/insertCompany', insertCompany);
router.post('/deleteCompany', deleteCompany);
router.post('/insertOAData', insertOAData);
router.post('/updateStatus', updateStatus);


export default router;