import { google } from "googleapis";
import * as dotenv from "dotenv";
import { Base64 } from "js-base64";
dotenv.config();
import fs from "fs";
import { supabase } from "../supabaseClient.js";
import { MailParser } from "mailparser";

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.CALLBACK_URL
);

export const getMail = async (req, res) => {
  let { data, error } = await supabase
    .from("Users")
    .select("tokens")
    .eq("user_id", req.user.id);

  oAuth2Client.setCredentials(data[0].tokens);

  let { data: sheet_id, er } = await supabase
    .from("Users")
    .select("sheet_id")
    .eq("user_id", req.user.id);

  const service = google.sheets({ version: "v4", auth: oAuth2Client });

  const getCompanyList = await service.spreadsheets.values.get({
    spreadsheetId: sheet_id[0].sheet_id,
    range: "A:A",
  });
  let companyList = getCompanyList.data.values;
  const user_company = [].concat(...companyList);
  user_company.shift();

  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

  user_company.forEach(async (company) => {
  var query =
    // "to:me newer_than:2d +" 
    "to:me +" 
    + company +
    " +months OR +" 
    + company +
    " +days OR +" 
    + company +
    " +assessment in:anywhere";
    // + company +
    // " invite in:anywhere";

  const id_res = await gmail.users.messages.list({
    userId: req.user.id,
    q: query,
    maxResults: 1,
  });
  const mailID = id_res.data.messages;
  if (!mailID || mailID.length === 0) {
    console.log('No ids found.');
    return;
  }
  const link = "https://mail.google.com/mail/u/"+req.user.email+"/#all/"+mailID[0].threadId.toString();
  // console.log(link);

  const mail = await gmail.users.messages.get({
      userId: req.user.id,
      id: String(mailID[0].id),
    });
    // console.log(mail)
  var mailres = mail.data.payload.parts[0].body.data;
  // var htmlBody = Base64.decode(mailres.replace(/-/g, '+').replace(/_/g, '/'));  //alternative way to decode
  if(mailres === undefined){
    console.log("UNDEFINED",String(mailID[0].id));
    return;
  }
  const mailBody = Buffer.from(mailres, "base64").toString('ascii');

  var pattern1 = /(\d+th|\d+nd|\d+rd|\d+]) * (?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)/gi;
  var pattern2 = /(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?) * (\d+th|\d+nd|\d+rd|\d+])/gi;
  var pattern3 = /(\d+) *\w* days|months|weeks/gi;
  var pattern4 = /(0\d{1}|1[0-2])([/+-])([0-2]\d{1}|3[0-1])([/+-])(19|20)(\d{2})/g


  if(mailBody.match(pattern1) !== null){
    var rawDate = mailBody.match(pattern1);
    var pattern = /[a-z]{2}/;
    var dateobj =  rawDate[0].replace(/(\d+)(st|nd|rd|th)/g, "$1");
    var date = new Date(dateobj);
    date.setFullYear(2022)
    console.log(company)
    console.log(date);

  }
  else if(mailBody.match(pattern2)!== null){
    var rawDate = mailBody.match(pattern2);
    var pattern = /[a-z]{2}/;
    var dateobj =  rawDate[0].replace(/(\d+)(st|nd|rd|th)/g, "$1");
    var date = new Date(dateobj);
    date.setFullYear(2022)
    console.log(company)
    console.log(date);

  }
  else if(mailBody.match(pattern3)!== null){
    var rawDate = mailBody.match(pattern3);
    var pattern = /[0-9]+/g;
    var days =  parseInt(rawDate[0].match(pattern));
    var date = new Date()
    date.setDate(date.getDate() + days);

  }
  else if(mailBody.match(pattern4)!== null){
    var rawDate = mailBody.match(pattern4);
    var date =  Date(rawDate);
  }
  else{
    var date = new Date()
    date.setDate(date.getDate() + 7);
    // date = date.toLocaleDateString();


  }

  fs.appendFile('file.log', mailBody, err => {
    if (err) {
      console.error(err);
    }
  });
  // res.send(mails_list);
  });

};
 