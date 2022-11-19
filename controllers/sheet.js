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

  try {
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

    let spreadsheet;
    if (!sheet_id[0].sheet_id) {
      spreadsheet = await service.spreadsheets.create({
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
      })
    }
    let values = [
      [
        "Amazon",
        "Max",
        "20-10-2023",
        "",
        "Interview",
      ],
      [
        "Microsoft",
        "SDE2",
        "20-10-2024",
        "https://stackoverflow.com/questions/57618668/how-to-use-spreadsheets-values-batchupdate-with-google-cloud-functions-and-nodej",
        "OA Received",
      ],
      [
        "Oracle",
        "SDE2",
        "20-10-2024",
        "",
        "Applied",
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
    // const getRows = await service.spreadsheets.values.get({
    //   spreadsheetId: spreadsheet.data.spreadsheetId,
    //   range: "A:A",
    // });
    // console.log(getRows.data.values);

    // res.status(200).send(spreadsheet.data.spreadsheetId);

    // //Read rows
    // console.log(req.user.id);
    const { sheet_data, err } = await supabase
      .from("Users")
      .update({ sheet_id: spreadsheet.data.spreadsheetId })
      .eq("user_id", req.user.id);


    res.send(spreadsheet.data.spreadsheetId);

  } catch (error) {
    console.log(error);
  }
};

export const getAllData = async (req, res) => {
  try {
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

    let spreadsheet = await service.spreadsheets.get({
      spreadsheetId: sheet_id[0].sheet_id,
    });
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
    let tasks = {};

    objs.forEach((element) => {
      var idKey = element.id;
      if (!tasks[idKey]) {
        tasks[idKey] = {};
      }
      tasks[idKey] = {
        company_name: element.company_name,
        position: element.position,
        deadline: element.deadline,
        oa_link: element.oa_link,
        id: `${element.id}`,
        status: element.status,
      };
    });
    const task = Object.entries(tasks).map((entry) => entry[1]);
    const transformArray = (arr = []) => {
      const response = [];
      const map = {};
      let i, j, curr;
      for (i = 0, j = arr.length; i < j; i++) {
        curr = arr[i];
        if (!(curr.status in map)) {
          map[curr.status] = { title: curr.status, taskIds: [] };
          response.push(map[curr.status]);
        }
        map[curr.status].taskIds.push(curr.id);
      }
      return response;
    };
    let grouped = transformArray(task);

    let board_data = {
      tasks: tasks,
      columns: {
        "column-1": {
          id: "column-1",
          title: grouped[1].title,
          taskIds: grouped[1].taskIds,
        },
        "column-2": {
          id: "column-2",
          title: grouped[2].title,
          taskIds: grouped[2].taskIds,
        },
        "column-3": {
          id: "column-3",
          title: grouped[0].title,
          taskIds: grouped[0].taskIds,
        },
      },
      columnOrder: ["column-1", "column-2", "column-3"],
    };

    res.send({ board: board_data });

  } catch (error) {
    console.log(error);
  }
};

export const getSheetId = async (req, res) => {
  try {
    if (req.user) {
      let { data: sheet_id, er } = await supabase
        .from("Users")
        .select("sheet_id")
        .eq("user_id", req.user.id);

      res.json({ sheet_id: sheet_id[0].sheet_id });
    }
    else {
      res.json({ sheet_id: null })
    }
  } catch (error) {
    console.log(error);
  }

}


export const getCompanyList = async (req, res) => {
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

  let spreadsheet = await service.spreadsheets.get({
    spreadsheetId: sheet_id[0].sheet_id,
  });

  getRows = await service.spreadsheets.values.get({
    spreadsheetId: spreadsheet.data.spreadsheetId,
    range: "A:A",
  });
  // console.log("here" + getCompanyList.data.values);

};

export const insertCompany = async (req, res) => { };
export const insertOAData = async (req, res) => { };
