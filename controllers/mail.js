import axios from "axios";
import { generateConfig } from "../utils.js";
// const nodemailer = require("nodemailer");
// const CONSTANTS = require("./constants");
import { google } from "googleapis";
import * as dotenv from "dotenv";
dotenv.config();

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.CALLBACK_URL
);
oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });
// console.log(req.params.email);

// export async function getUser(req, res) {
//   try {
//     const url = `https://gmail.googleapis.com/gmail/v1/users/${req.params.email}/profile`;
//     const { token } = await oAuth2Client.getAccessToken();
//     const config = generateConfig(url, token);
//     const response = await axios(config);
//     res.json(response.data);
//   } catch (error) {
//     console.log(error);
//     res.send(error);
//   }
// }
// export async function readMail(req, res) {
//   try {
//     const url = `https://gmail.googleapis.com//gmail/v1/users/sid.cd.varma@gmail.com/messages/17f63b4513fb51c0`;
//     const { token } = await oAuth2Client.getAccessToken();
//     const config = generateConfig(url, token);
//     const response = await axios(config);

//     let data = await response.data;
//     console.log(data);

//     res.json(data);
//   } catch (error) {
//     res.send(error);
//   }
// }

// module.exports = { readMail, getUser };
