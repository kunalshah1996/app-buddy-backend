import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth2';

import { supabase } from './supabaseClient.js';


dotenv.config()

const app = express();

app.use(express.json());
app.use(cors({ origin: ["https://app-buddy.netlify.app/", "http://localhost:3000"], credentials: true }));
app.use(
    session({
        secret: "KunalSamruddhi",
        resave: true,
        saveUninitialized: true,
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

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://appbuddy.onrender.com/auth/google/callback", //https://appbuddy.onrender.com/auth/google/callback
    passReqToCallback: true
},
    function (request, accessToken, refreshToken, profile, done) {

        const { data, error } = supabase
            .from('Users')
            .upsert({ user_id: profile.id, access_token: accessToken, refresh_token: refreshToken })
            .select()

        return done(null, profile);
    }
));

app.get('/auth/google',
    passport.authenticate('google', {
        scope:
            ['profile', 'https://mail.google.com/'], accessType: 'offline'
    }
    ));

app.get('/auth/google/callback',
    passport.authenticate('google', {
        failureRedirect: 'https://app-buddy.netlify.app/login'
    }), function (req, res) {
        res.redirect('https://app-buddy.netlify.app');
    });


app.get('/user', (req, res) => {
    res.send(req.user);
})

app.get("/", (req, res) => {
    res.send("Hello World!");
})

app.listen(8000, () => {
    console.log("Server Started");
})