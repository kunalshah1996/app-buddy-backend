import express from "express";
import { google } from "googleapis";
import * as dotenv from "dotenv";

import { supabase } from "../supabaseClient.js";

const router = express.Router();

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.CALLBACK_URL
);

export const createSheet = async (req, res) => {
  console.log(req.user);
  let { data, error } = await supabase
    .from("Users")
    .select("tokens")
    .eq("user_id", req.user.id);

  oAuth2Client.setCredentials(data[0].tokens);

  const service = google.sheets({ version: "v4", auth: oAuth2Client });

  const spreadsheet = await service.spreadsheets.create({
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
  await service.spreadsheets.values.append(
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

  // const { data } = await supabase
  // .from('Users')
  // .insert({ sheet_id :spreadsheet.data.spreadsheetId})
  // .eq('')
};

export const getCompanyList = async (req, res) => {
  getRows = await service.spreadsheets.values.get({
    spreadsheetId: spreadsheet.data.spreadsheetId,
    range: "Sheet1",
  });
  console.log(getRows.data.values);
};

export const insertCompany = async (req, res) => {};
export const insertOAData = async (req, res) => {};
