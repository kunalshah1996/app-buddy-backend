import { google } from "googleapis";
import * as dotenv from "dotenv";
import { Base64 } from "js-base64";
dotenv.config();

import { supabase } from "../supabaseClient.js";
import { clouddebugger } from "googleapis/build/src/apis/clouddebugger/index.js";

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.CALLBACK_URL
);

 

export const getMail = async (req, res) => {
  const mails_list = [];

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

  //read gmail

  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

  user_company.forEach(async (company) => {
  var query =
    // "to:me newer_than:2d +" 
    "to:me +" 
    + company +
    " +invited OR +" 
    + company +
    " +duration OR +" 
    + company +
    " +test OR +" 
    + company +
    " +assessment in:anywhere";

  // console.log(query);

  const id_res = await gmail.users.messages.list({
    userId: req.user.id,
    q: query,
    maxResults: 1
  });
  const mailID = id_res.data.messages;
  console.log(mailID);
  if (!mailID || mailID.length === 0) {
    console.log('No ids found.');
    return;
  }
  const mail = await gmail.users.messages.get({
    userId: req.user.id,
    id: String(mailID[0].id),
  });
  const mailres = mail.data.payload.parts[0].body.data;
  if(mailres === undefined){
    console.log("UNDEFINED",String(mailID[0].id));
    return
    
  }


  const mailBody = Buffer.from(mailres, "base64").toString('utf-8');
  console.log("Mail Body :",mailBody);
  // mails_list.append(mailBody);
  

  // res.send(mails_list);
  // console.log("List",mails_list);
  });
  

};
 