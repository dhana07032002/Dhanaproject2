const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

const app = express();

mongoose.connect('mongodb://localhost:27017/auth-system', { useNewUrlParser: true, useUnifiedTopology: true });

const User = mongoose.model('User', {
  username: String,
  password: String,
});

passport.use(new LocalStrategy((username, password, done) => {
  User.findOne({ username: username }, (err, user) => {
    if (err) return done(err);
    if (!user) return done(null, false, { message: 'Incorrect username.' });
    bcrypt.compare(password, user.password, (err, res) => {
      if (err) return done(err);
      if (res === false) return done(null, false, { message: 'Incorrect password.' });
      return done(null, user);
    });
  });
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'your_secret_key', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.post('/login',
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/',
    failureFlash: true
  })
);

app.get('/dashboard', isAuthenticated, (req, res) => {
  res.send(`Hello, ${req.user.username}! This is your dashboard.`);
});

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/');
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
