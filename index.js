import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth2';
import { google } from 'googleapis'

import { supabase } from './supabaseClient.js';
import userRoutes from './routes/user.js';

dotenv.config()

const app = express();

//Uncomment these changes for production


// app.disable("X-Powered-By");

// app.set("trust proxy", 1); // -------------- FIRST CHANGE ----------------

// app.use(cors({ origin: "https://app-buddy.netlify.app", credentials: true, methods: "GET, POST, PUT, DELETE" }));
// app.use(function (req, res, next) {
//     res.header("Access-Control-Allow-Credentials", true);
//     res.header("Access-Control-Allow-Origin", "https://app-buddy.netlify.app");
//     res.header("Access-Control-Allow-Headers",
//         "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-HTTP-Method-Override, Set-Cookie, Cookie");
//     res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
//     next();
// });


app.use(express.json());
app.use(cors({ origin: process.env.ORIGIN, credentials: true }));//"https://app-buddy.netlify.app"
app.use(
    session({
        secret: "KunalSamruddhi",
        resave: false,
        saveUninitialized: false,
        //cookie: { sameSite: 'none', secure: true }    //uncomment for production
    })
);
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {

    return done(null, user);
})

passport.deserializeUser((user, done) => {
    return done(null, user);
})
// GoogleStrategy.prototype.userProfile = function(token, done) {
//     done(null, {})
//   }

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL, //https://appbuddy.onrender.com/auth/google/callback "https://appbuddy.onrender.com/auth/google/callback"
    passReqToCallback: true
},
    async function (request, accessToken, refreshToken, params, profile, done) {

        let token_vals = { access_token: accessToken, token_type: params.token_type, refresh_token: refreshToken, expiry_date: params.expires_in }
        const { data, error } = await supabase
            .from('Users')
            .upsert({ user_id: profile.id, access_token: accessToken, refresh_token: refreshToken, tokens: token_vals })

        return done(null, profile);
    }
));

const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.CALLBACK_URL,
);

app.get("/", (req, res) => {
    res.send("Hello World!");
})

app.get('/auth/google',
    passport.authenticate('google', {
        scope:
            ['profile', 'https://mail.google.com/', "https://www.googleapis.com/auth/spreadsheets"], accessType: 'offline'
    }
    ));


app.post('/logout', function (req, res) {
    req.logout(function (err) {
        if (err) { console.log(err); }
        res.status(200).redirect(process.env.FAILURE_REDIRECT);
    });
});

app.get('/auth/google/callback',
    passport.authenticate('google', {
        failureRedirect: process.env.FAILURE_REDIRECT  //'https://app-buddy.netlify.app/login'
    }), function (req, res) {
        sheet()
        res.redirect(process.env.SUCCESS_REDIRECT);//'https://app-buddy.netlify.app'
    });


var getRows;

async function sheet() {
    let { data, error } = await supabase
        .from('Users')
        .select('tokens')

    oAuth2Client.setCredentials(data[0].tokens);


    const service = google.sheets({ version: 'v4', auth: oAuth2Client });

    const spreadsheet = await service.spreadsheets.create({
        resource: { properties: 
            { title: 'Test Sheet' } ,

    "sheets": 
    [
        {
    //           "conditionalFormats": [
    //     {
    //         "ranges": [
    //             {
    //                 "sheetId": spreadsheet.data.spreadsheetId,
    //                 "startRowIndex": 0,
    //                 "endRowIndex": 3,
    //                 "startColumnIndex": 0,
    //                 "endColumnIndex": 0
    //             }
    //           ],
    //         "booleanRule": {
    //             "format": {
    //                 // "bold": true,
    //               }
    //           },
    //     }
    //   ],
      
        "data": 
        [
          {
            "startRow": 0, 
            "startColumn": 0, 
            "rowData": 
            [
              {
                "values": 
                [
                  {
                    "userEnteredValue": 
                    {
                      "stringValue": "Company Name"
                    }
                  }
                ]
              }
            ]
          },
          {
            "startRow": 0, 
            "startColumn": 1,
            "rowData": 
            [
              {
                "values": 
                [
                  {
                    "userEnteredValue": 
                    {
                      "stringValue": "Position"
                    }
                  }
                ]
              }
            ]

          },
          {
            "startRow": 0, 
            "startColumn": 2,
            "rowData": 
            [
              {
                "values": 
                [
                  {
                    "userEnteredValue": 
                    {
                      "stringValue": "Deadline"
                    }
                  }
                ]
              }
            ]

          },
          {
            "startRow": 0, 
            "startColumn": 3,
            "rowData": 
            [
              {
                "values": 
                [
                  {
                    "userEnteredValue": 
                    {
                      "stringValue": "OA Link"
                    }
                  }
                ]
              }
            ]

          },
          {
            "startRow": 0, 
            "startColumn": 4,
            "rowData": 
            [
              {
                "values": 
                [
                  {
                    "userEnteredValue": 
                    {
                      "stringValue": "Status"
                    }
                  }
                ]
              }
            ]

          }
        ]
      }
    ]
}});

//Add rows
let values = [
    [
        "amazon", 
        "Max", 
        "20-10-2023",
        "https://stackoverflow.com/questions/57618668/how-to-use-spreadsheets-values-batchupdate-with-google-cloud-functions-and-nodej",
        "interview" 
    ],
      [
        "microsoft", 
        "SDE2",
        "20-10-2024", 
        "https://stackoverflow.com/questions/57618668/how-to-use-spreadsheets-values-batchupdate-with-google-cloud-functions-and-nodej",
        "interview"
      ],
      [
        "Oracle", 
        "SDE2",
        "20-10-2024", 
        "https://stackoverflow.com/questions/57618668/how-to-use-spreadsheets-values-batchupdate-with-google-cloud-functions-and-nodej",
        "interview"
      ]

 ];
  let resource = {
    values,
  };
  await service.spreadsheets.values.append({
    spreadsheetId: spreadsheet.data.spreadsheetId,
    range: 'Sheet1!A1:E1',  
    valueInputOption: 'RAW',
    resource: resource
  }, (err, result) => {
    if (err) {
      // Handle error.
      console.log(err);
    } 
  });

//Read rows
getRows = await service.spreadsheets.values.get({
    spreadsheetId: spreadsheet.data.spreadsheetId,
    range: 'Sheet1',  
})
console.log(getRows.data.values)

}

app.use('/user', userRoutes)



app.listen(8000, () => {
    console.log("Server Started");
})