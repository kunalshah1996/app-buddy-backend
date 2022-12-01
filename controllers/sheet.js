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
      });
    }

    // Add rows
    let values = [
      ["Roblox", "Software EngineeringMax", "", "", "Applied"],
      ["ZipRecruiter", "Software EngineeringMax", "", "", "Applied"],
      ["Visa", "Software Engineering", "", "", "Applied",],
      ["Citadel", "Software Engineering", "", "", "Applied"],
      ["Samsara", "Software Engineering", "", "", "Applied",],
      ["Ebay", "Software Engineering", "", "", "Applied",]
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

    res.send(spreadsheet.data.spreadsheetId);

    const { sheet_data, err } = await supabase
      .from("Users")
      .update({ sheet_id: spreadsheet.data.spreadsheetId })
      .eq("user_id", req.user.id);

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
      var idKey = `task-${element.id}`;
      if (!tasks[idKey]) {
        tasks[idKey] = {};
      }
      tasks[idKey] = {
        company_name: element.company_name,
        position: element.position,
        deadline: element.deadline,
        oa_link: element.oa_link,
        id: `task-${element.id}`,
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

    console.log("grouped", grouped);
    console.log(grouped.find(x => x.title === 'OA Received'));

    let board_data = {
      "tasks": tasks ? tasks : [],
      "columns": {
        "column-1": {
          id: "column-1",
          title: "Applied",
          taskIds: grouped.find(x => x.title === 'Applied') ? grouped.find(x => x.title === 'Applied').taskIds : [],
        },
        "column-2": {
          id: "column-2",
          title: "OA Received",
          taskIds: grouped.find(x => x.title === 'OA Received') ? grouped.find(x => x.title === 'OA Received').taskIds : [],
        },
        "column-3": {
          id: "column-3",
          title: "Interview",
          taskIds: grouped.find(x => x.title === 'Interview') ? grouped.find(x => x.title === 'Interview').taskIds : [],
        },
      },
      "columnOrder": ["column-1", "column-2", "column-3"],
    };


    const { data: board, err } = await supabase
      .from('Users')
      .update({ board: board_data })
      .eq('user_id', req.user.id)

    // console.log(board_data);

    res.json({ board: board_data });

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
    } else {
      res.json({ sheet_id: null });
    }
  } catch (error) {
    console.log(error);
  }
};

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

export const insertCompany = async (req, res) => {
  const value = Object.values(req.body);
  value.shift();
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

  await service.spreadsheets.values.append({
    spreadsheetId: spreadsheet.data.spreadsheetId,
    range: 'Sheet1',
    valueInputOption: "USER_ENTERED",
    resource: {
      values: [value],
    },
  });

};
export const insertOAData = async (req, res) => { };

export const deleteCompany = async (req, res) => {
  const value = Object.values(req.body);
  value.shift();
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
  const result = await service.spreadsheets.values.get({
    spreadsheetId: spreadsheet.data.spreadsheetId,
    range: "Sheet1",
  });

  const toDelete = req.body;
  delete toDelete.id;
  let ranges = [];
  var current = {
    dimension: "ROWS",
    startIndex: 0,
    endIndex: 0
  };

  for (var i = 0; i < result.data.values.length; i++) {
    if (result.data.values[i][0] == toDelete.company_name && result.data.values[i][1] == toDelete.position && result.data.values[i][2] == toDelete.deadline && result.data.values[i][3] == toDelete.oa_link && result.data.values[i][4] == toDelete.status) {
      if (current.endIndex === i - 1 || current.startIndex === 0) {
        if (current.startIndex === 0) {
          current.startIndex = i;
        }
        current.endIndex = i + 1;
      } else {
        ranges.push(current);
        current = {
          dimension: "ROWS",
          startIndex: i,
          endIndex: i + 1
        }
      }
    }

  }
  if (current.startIndex !== 0) {
    ranges.push(current);
  }
  var rowRange = 'Sheet1!A' + ranges[0].endIndex + ':E' + ranges[0].endIndex;
  await service.spreadsheets.values.clear({
    spreadsheetId: spreadsheet.data.spreadsheetId,
    range: rowRange,
  });


};

export const updateStatus = async (req, res) => {
  console.log(req.body);

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
  const result = await service.spreadsheets.values.get({
    spreadsheetId: sheet_id[0].sheet_id,
    range: "Sheet1",
  });
  let ranges = [];
  var current = {
    dimension: "ROWS",
    startIndex: 0,
    endIndex: 0
  };
  for (var i = 0; i < result.data.values.length; i++) {
    if (result.data.values[i][0] == req.body.company_name && result.data.values[i][1] == req.body.position) {
      if (current.endIndex === i - 1 || current.startIndex === 0) {
        if (current.startIndex === 0) {
          current.startIndex = i;
        }
        current.endIndex = i + 1;
      } else {
        ranges.push(current);
        current = {
          dimension: "ROWS",
          startIndex: i,
          endIndex: i + 1
        }
      }
    }

  }
  if (current.startIndex !== 0) {
    ranges.push(current);
  }
  console.log(ranges);
  var rowRange = 'Sheet1!E' + ranges[0].endIndex;
  await service.spreadsheets.values.update(
    {
      spreadsheetId: sheet_id[0].sheet_id,
      range: rowRange,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[req.body.newStatus]],
      }
    }
  );


};
