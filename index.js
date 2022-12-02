import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth2";
import cron from 'node-cron';

import { supabase } from "./supabaseClient.js";
import userRoutes from "./routes/user.js";
import sheetRoutes from "./routes/sheet.js";
import mailRoutes from "./routes/mail.js";

dotenv.config();

const app = express();
app.disable("X-Powered-By");

app.set("trust proxy", 1); // -------------- FIRST CHANGE ----------------

app.use(cors({ origin: process.env.ORIGIN, credentials: true, methods: "GET, POST, PUT, DELETE" }));
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Origin", process.env.ORIGIN);
  res.header("Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-HTTP-Method-Override, Set-Cookie, Cookie");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  next();
});




//Uncomment these changes for production

app.use(express.json());
app.use(cors({ origin: 'appbuddy-cron.kunalshah19969495.workers.dev', credentials: true }));
app.use(cors({ origin: process.env.ORIGIN, credentials: true })); //"https://app-buddy.netlify.app"
app.use(
  session({
    secret: "KunalSamruddhi",
    resave: false,
    saveUninitialized: false,
    cookie: { sameSite: 'none', secure: true }    //uncomment for production
  })
);
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  return done(null, user);
});

passport.deserializeUser((user, done) => {
  return done(null, user);
});


passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL, //https://appbuddy.onrender.com/auth/google/callback "https://appbuddy.onrender.com/auth/google/callback"
      passReqToCallback: true,
    },
    async function (request, accessToken, refreshToken, params, profile, done) {
      let token_vals = {
        access_token: accessToken,
        token_type: params.token_type,
        refresh_token: refreshToken,
        expiry_date: params.expires_in,
      };
      const { data, error } = await supabase.from("Users").upsert({
        user_id: profile.id,
        access_token: accessToken,
        refresh_token: refreshToken,
        tokens: token_vals,
      });

      return done(null, profile);
    }
  )
);

app.get("/", (req, res) => {
  console.log("Req registered");
  res.send("Hello World!");
});

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: [
      "profile",
      "https://mail.google.com/",
      "https://www.googleapis.com/auth/spreadsheets",
    ],
    accessType: "offline",
    prompt: 'consent',
  })
);

app.post("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      console.log(err);
    }
    res.status(200).send("Logged out");
  });
});

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: process.env.FAILURE_REDIRECT, //'https://app-buddy.netlify.app/login'
  }),
  function (req, res) {
    res.redirect(process.env.SUCCESS_REDIRECT); //'https://app-buddy.netlify.app'
  }
);


app.use("/sheet", sheetRoutes);

app.use("/user", userRoutes);

app.use("/mail", mailRoutes);

cron.schedule('*/35 */1 * * *', async () => {
  try {
    console.log("scheduled started");
    let { data, error } = await supabase
      .from("Users")
      .select("*")

    console.log(data);

    data.forEach(async (element) => {
      oAuth2Client.setCredentials(element.tokens)

      let { data: sheet_id, er } = await supabase
        .from("Users")
        .select("sheet_id")
        .eq("user_id", element.user_id);

      if (sheet_id) {
        const service = google.sheets({ version: "v4", auth: oAuth2Client });

        const getCompanyList = await service.spreadsheets.values.get({
          spreadsheetId: sheet_id[0].sheet_id,
          range: "Sheet1",
        });

        let user_company = getCompanyList.data.values;
        user_company.shift();

        const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

        user_company.forEach(async (company) => {
          var query =
            // "to:me newer_than:2d +" 
            "to:me +"
            + company[0] +
            " +months OR +"
            + company[0] +
            " +days OR +"
            + company[0] +
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

          const profile = await gmail.users.getProfile({ userId: req.user.id })
          const link = "https://mail.google.com/mail/u/" + profile.data.emailAddress + "/#all/" + mailID[0].threadId.toString();

          const mail = await gmail.users.messages.get({
            userId: req.user.id,
            id: String(mailID[0].id),
          });
          var mailres = mail.data.payload.parts[0].body.data;
          // var htmlBody = Base64.decode(mailres.replace(/-/g, '+').replace(/_/g, '/'));  //alternative way to decode
          if (mailres === undefined) {
            console.log("UNDEFINED", String(mailID[0].id));
            return;
          }
          const mailBody = Buffer.from(mailres, "base64").toString('ascii');
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
            if (result.data.values[i][0] == company[0] && result.data.values[i][1] == company[1]) {
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

          var pattern1 = /(\d+th|\d+nd|\d+rd|\d+]) * (?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)/gi;
          var pattern2 = /(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?) * (\d+th|\d+nd|\d+rd|\d+])/gi;
          var pattern3 = /(\d+) *\w* days|months|weeks/gi;
          var pattern4 = /(0\d{1}|1[0-2])([/+-])([0-2]\d{1}|3[0-1])([/+-])(19|20)(\d{2})/g

          if (mailBody.match(pattern1) !== null) {
            var rawDate = mailBody.match(pattern1);
            var dateobj = rawDate[0].replace(/(\d+)(st|nd|rd|th)/g, "$1");
            var date = new Date(dateobj);
            date.setFullYear(2022)
            var rowRange = 'Sheet1!C' + ranges[0].endIndex + ':E' + ranges[0].endIndex;
            await service.spreadsheets.values.update(
              {
                spreadsheetId: sheet_id[0].sheet_id,
                range: rowRange,
                valueInputOption: 'USER_ENTERED',
                resource: {
                  values: [[date, link, "OA Received"]],
                }
              }
            );

          }
          else if (mailBody.match(pattern2) !== null) {
            var rawDate = mailBody.match(pattern2);
            var dateobj = rawDate[0].replace(/(\d+)(st|nd|rd|th)/g, "$1");
            var date = new Date(dateobj);
            date.setFullYear(2022)
            var rowRange = 'Sheet1!C' + ranges[0].endIndex + ':E' + ranges[0].endIndex;
            await service.spreadsheets.values.update(
              {
                spreadsheetId: sheet_id[0].sheet_id,
                range: rowRange,
                valueInputOption: 'USER_ENTERED',
                resource: {
                  values: [[date, link, "OA Received"]],
                }
              }
            );
          }
          else if (mailBody.match(pattern3) !== null) {
            var rawDate = mailBody.match(pattern3);
            var pattern = /[0-9]+/g;
            var days = parseInt(rawDate[0].match(pattern));
            var date = new Date()
            date.setDate(date.getDate() + days);
            var rowRange = 'Sheet1!C' + ranges[0].endIndex + ':E' + ranges[0].endIndex;
            await service.spreadsheets.values.update(
              {
                spreadsheetId: sheet_id[0].sheet_id,
                range: rowRange,
                valueInputOption: 'USER_ENTERED',
                resource: {
                  values: [[date, link, "OA Received"]],
                }
              }
            );
          }
          else if (mailBody.match(pattern4) !== null) {
            var rawDate = mailBody.match(pattern4);
            var date = Date(rawDate);
            var rowRange = 'Sheet1!C' + ranges[0].endIndex + ':E' + ranges[0].endIndex;
            await service.spreadsheets.values.update(
              {
                spreadsheetId: sheet_id[0].sheet_id,
                range: rowRange,
                valueInputOption: 'USER_ENTERED',
                resource: {
                  values: [[date, link, "OA Received"]],
                }
              }
            );
          }
          else {
            var date = new Date()
            date.setDate(date.getDate() + 7);
            var rowRange = 'Sheet1!C' + ranges[0].endIndex + ':E' + ranges[0].endIndex;
            await service.spreadsheets.values.update(
              {
                spreadsheetId: sheet_id[0].sheet_id,
                range: rowRange,
                valueInputOption: 'USER_ENTERED',
                resource: {
                  values: [[date, link, "OA Received"]],
                }
              }
            );
          }

          // fs.appendFile('file.log', mailBody, err => {
          //   if (err) {
          //     console.error(err);
          //   }
          // });
          // res.send(mails_list);
        });
      }
      else {
        return
      }
    });

  } catch (error) {
    console.log(error);
  }

});

app.listen(8000, () => {
  console.log("Server Started");
});
