const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const expressSession = require("express-session");
const flash = require("connect-flash");
const passport = require("passport"); 
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt"); // per criptare le password
const Event = require('./models/Event');
const User = require('./models/User');
const path = require('path')
const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://marcoguiidi:marcoprova@cluster0.lfjcmtr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
app.use(cors());


app.use(bodyParser.json());

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch(err => console.log(err));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.use(express.static(path.join(__dirname, 'client', 'build')));


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
});

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.findOne({ username });  // search for username in db
      if (!user) {
        return done(null, false, { message: "Incorrect username or password." }); 
      }

      const isValidPassword = await bcrypt.compare(password, user.password); // compare password against database password
      if (!isValidPassword) {
        return done(null, false, { message: "Incorrect username or password." });
      }

      return done(null, user); // Successful authentication - go to next step
    } catch (err) {
      return done(err); // Error during authentication
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user._id); // serializza l'id utente
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user); //chiama done(), funzione di passport che gestisce success/error o fail
  } catch (err) {
    done(err); // Handle errors during deserialization
  }
});

// middleware per mantenere l'autenticazione dell'utente
// la aggiungo ai parametri di routing cosi da controllare ceh sia autenticato prima di effettuarlo
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next(); // User is authenticated
  }
  res.redirect("/login"); // Redirect if not authenticated
};

// Get events by labels
// app.get('/events/by-label', async (req, res) => {
//   try {
//     const labels = req.query.labels;
//     if (!labels) {
//       return res.status(400).json({ message: 'Label parameter is required' });
//     }
//     const labelArray = labels.split(',');  // Split labels into an array
//     const events = await Event.find({ label: { $in: labelArray } });
//     if (events.length === 0) {
//       return res.status(404).json({ message: 'No events found with the specified labels' });
//     }
//     res.json(events);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// Get all events
app.get("/events", ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId)
      .catch(err => {console.error("User not found");});

    const data = await Event.find({ 
      author: user.username || 
      participants.contains(user.username) // !! non funziona !!
    });

    const eventData = data.map(event => ({
      description: event.description,
      author: event.author,
      date: event.date, // Ottiene solo la parte della data
      participants: event.participants,
      location: event.location,
      color: event.color
    }));

    res.json(eventData);

  } catch (error) {
    res.status(500).json({ error: "Errore durante il recupero dei dati" });
  }
});

// Create a new event
app.post('/events', ensureAuthenticated, async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId)
    .catch(err => {console.error("User not found");});

  const event = new Event({
    description: req.body.description,
    author: user,
    date: req.body.date, // Ottiene solo la parte della data
    participants: req.body.participants,
    location: req.body.location,
    color: req.body.color
  });

  try {
    const newEvent = await event.save();
    res.status(201).json(newEvent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get a specific event by ID
app.get('/events/:id', ensureAuthenticated, async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId)
  .catch(err => {console.error("User not found");});

  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    if (event.author !== user) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/events/:id', ensureAuthenticated, async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId)
    .catch(err => {console.error("User not found");});

  try {
    const { description, date, participants, color, location, author } = req.body;
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    if (event.author !== user) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Allow updates unconditionally
    event.date = date || event.date;
    event.description = description || event.description;
    event.color = color || event.color;
    event.location = location || event.location;
    event.participants = participants || event.participants;
    event.author = author || event.author;

    const updatedEvent = await event.save();
    res.json(updatedEvent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});





// Delete an event
app.delete('/events/:id', ensureAuthenticated, async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId)
    .catch(err => {console.error("User not found");});

  try {
    const event = await Event.findById(req.params.id);
    if (event.author !== user) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const deletedEvent = await Event.findByIdAndDelete(req.params.id);
    if (!deletedEvent) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/", // Redirect after successful login
    failureRedirect: "/login", // Redirect after failed login
    failureFlash: false, // Enable flash messages
  })
);

app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      password: hashedPassword, // Store the hashed password
    });

    await newUser.save();

    req.login(newUser, (err) => {
      if (err) {
        return res.status(500).send("Error during login after registration.");
      }

      res.redirect("/"); // Redirect after successful registration
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).send("Registration failed."); // Handle registration errors
  }
});

// manca get di login e register 