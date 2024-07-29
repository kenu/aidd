const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const { generateResponse } = require('./chatbot');

const app = express();
const port = 3000;

// Database setup
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite'
});

// Model definitions
const User = sequelize.define('User', {
  googleId: DataTypes.STRING,
  email: DataTypes.STRING,
  name: DataTypes.STRING
});

const Message = sequelize.define('Message', {
  content: DataTypes.STRING,
  language: DataTypes.STRING,
  isUser: DataTypes.BOOLEAN
});

User.hasMany(Message);
Message.belongsTo(User);

// Passport configuration
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
  },
  async function(accessToken, refreshToken, profile, cb) {
    try {
      let [user] = await User.findOrCreate({
        where: { googleId: profile.id },
        defaults: {
          email: profile.emails[0].value,
          name: profile.displayName
        }
      });
      return cb(null, user);
    } catch (err) {
      return cb(err);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'your secret key', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/chat');
  });

app.get('/chat', async (req, res) => {
  if (req.isAuthenticated()) {
    const messages = await Message.findAll({ where: { UserId: req.user.id }, order: [['createdAt', 'ASC']] });
    res.render('chat', { user: req.user, messages: messages });
  } else {
    res.redirect('/');
  }
});

app.post('/send-message', async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      // Save user message
      await Message.create({
        content: req.body.message,
        language: req.body.language,
        isUser: true,
        UserId: req.user.id
      });

      // Generate and save chatbot response
      const botResponse = generateResponse(req.body.message, req.body.language);
      await Message.create({
        content: botResponse,
        language: req.body.language,
        isUser: false,
        UserId: req.user.id
      });

      res.redirect('/chat');
    } catch (err) {
      console.error(err);
      res.status(500).send('Error sending message');
    }
  } else {
    res.status(401).send('Unauthorized');
  }
});

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

// Start server
sequelize.sync().then(() => {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
});
