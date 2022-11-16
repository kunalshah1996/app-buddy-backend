import express from "express";
import { google } from "googleapis";
import { supabase } from "../supabaseClient.js";

import axios from "axios";
import { generateConfig } from "../utils.js";
import * as dotenv from "dotenv";
dotenv.config();

const router = express.Router();

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.CALLBACK_URL
);

export const createSheet = async (req, res) => {
  let { data, error } = await supabase
    .from("Users")
    .select("tokens")
    .eq("user_id", req.user.id);

  oAuth2Client.setCredentials(data[0].tokens);

  const service = google.sheets({ version: "v4", auth: oAuth2Client });

  let { data: sheet_id, er } = await supabase
    .from("Users")
    .select("sheet_id")
    .eq("user_id", req.user.id);
  console.log(sheet_id[0].sheet_id);

  let spreadsheet;
  if (!sheet_id[0].sheet_id) {
    spreadsheet = service.spreadsheets.create({
      resource: {
        properties: { title: "Test Sheet" },

        sheets: [
          {
            data: [
              {
                startRow: 0,
                startColumn: 0,
                rowData: [
                  {
                    values: [
                      {
                        userEnteredValue: {
                          stringValue: "Company Name",
                        },
                      },
                    ],
                  },
                ],
              },
              {
                startRow: 0,
                startColumn: 1,
                rowData: [
                  {
                    values: [
                      {
                        userEnteredValue: {
                          stringValue: "Position",
                        },
                      },
                    ],
                  },
                ],
              },
              {
                startRow: 0,
                startColumn: 2,
                rowData: [
                  {
                    values: [
                      {
                        userEnteredValue: {
                          stringValue: "Deadline",
                        },
                      },
                    ],
                  },
                ],
              },
              {
                startRow: 0,
                startColumn: 3,
                rowData: [
                  {
                    values: [
                      {
                        userEnteredValue: {
                          stringValue: "OA Link",
                        },
                      },
                    ],
                  },
                ],
              },
              {
                startRow: 0,
                startColumn: 4,
                rowData: [
                  {
                    values: [
                      {
                        userEnteredValue: {
                          stringValue: "Status",
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    });
  } else {
    spreadsheet = await service.spreadsheets.get({
      spreadsheetId: sheet_id[0].sheet_id,
    });
  }
  console.log("Spreadsheet", spreadsheet.data.spreadsheetId);
  //Add rows
  let values = [
    [
      "amazon",
      "Max",
      "20-10-2023",
      "https://stackoverflow.com/questions/57618668/how-to-use-spreadsheets-values-batchupdate-with-google-cloud-functions-and-nodej",
      "interview",
    ],
    [
      "microsoft",
      "SDE2",
      "20-10-2024",
      "https://stackoverflow.com/questions/57618668/how-to-use-spreadsheets-values-batchupdate-with-google-cloud-functions-and-nodej",
      "interview",
    ],
    [
      "Oracle",
      "SDE2",
      "20-10-2024",
      "https://stackoverflow.com/questions/57618668/how-to-use-spreadsheets-values-batchupdate-with-google-cloud-functions-and-nodej",
      "interview",
    ],
  ];
  let resource = {
    values,
  };
  service.spreadsheets.values.append(
    {
      spreadsheetId: spreadsheet.data.spreadsheetId,
      range: "Sheet1!A1:E1",
      valueInputOption: "RAW",
      resource: resource,
    },
    (err, result) => {
      if (err) {
        // Handle error.
        console.log(err);
      }
    }
  );

  res.status(200).send(spreadsheet.data.spreadsheetId);

  //Read rows
  console.log(req.user.id);

  const { sheet_data, err } = await supabase
    .from("Users")
    .update({ sheet_id: spreadsheet.data.spreadsheetId })
    .eq("user_id", req.user.id);

  const getRows = await service.spreadsheets.values.get({
    spreadsheetId: spreadsheet.data.spreadsheetId,
    range: "Sheet1",
  });
  var objs = getRows.data.values.map((x, i) => ({
    company_name: x[0],
    position: x[1],
    deadline: x[2],
    oa_link: x[3],
    status: x[4],
    id: i + 1,
  }));
  objs.shift();
  let jsonData = {};

  objs.forEach((element) => {
    var statusKey = element.status;
    if (!jsonData[statusKey]) {
      jsonData[statusKey] = [];
    }

    jsonData[statusKey].push({
      company_name: element.company_name,
      position: element.position,
      deadline: element.deadline,
      oa_link: element.oa_link,
      id: element.id,
    });
  });

  console.log(jsonData);
  // console.log(objs);
  console.log(sheet_data);
  console.log("supa error", err);

  //read gmail
  const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];
  async function getLink(auth) {
    const gmail = google.gmail({ version: "v1", auth });
    const res = await gmail.users.messages.list({
      userId: req.user.id,
      q: "to:me from:uber@uber.com",
    });
    const mailID = res.data.messages;
    console.log(mailID);
    if (!mailID || mailID.length === 0) {
      console.log("No IDs found.");
      return;
    }
    // mailID.forEach((label) => {
    //   console.log(`- ${label.name}`);
    // });
  }
  console.log(getLink(oAuth2Client));
};

export const getCompanyList = async (req, res) => {
  getRows = await service.spreadsheets.values.get({
    spreadsheetId: spreadsheet.data.spreadsheetId,
    range: "A:A",
  });
  // console.log("here" + getCompanyList.data.values);
  console.log(getRows);
};

export const insertCompany = async (req, res) => {};
export const insertOAData = async (req, res) => {};
