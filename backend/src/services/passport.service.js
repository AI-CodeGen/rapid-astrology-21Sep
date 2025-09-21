import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
  }, async (_accessToken, _refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        user = await User.create({ googleId: profile.id, name: profile.displayName, email: profile.emails?.[0]?.value });
      }
      return done(null, user);
    } catch (e) { done(e); }
  }));
}

passport.serializeUser((user, done)=> done(null, user._id));
passport.deserializeUser(async (id, done)=> {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (e) { done(e); }
});
