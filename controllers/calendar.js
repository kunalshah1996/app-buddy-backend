import { google } from "googleapis";
import * as dotenv from "dotenv";
dotenv.config();

import { supabase } from "../supabaseClient.js";

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.CALLBACK_URL
);
