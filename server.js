const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');


const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(cookieParser());

// MongoDB Connection
mongoose.connect('mongodb+srv://marcoguiidi:marcoprova@cluster0.lfjcmtr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Import routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const eventRoutes = require('./routes/events');
app.use('/api/events', eventRoutes);

const userRoutes = require('./routes/user');
app.use('/api/users', userRoutes);

const pomodoroRoutes = require('./routes/pomodoro');
app.use('/api/pomodoro', pomodoroRoutes);
// Middleware per proteggere le rotte
const ensureAuthenticated = (req, res, next) => {
    const authHeader = req.headers.authorization; // richiede l'autorizzazione nell'header
    const token = authHeader && authHeader.split(' ')[1]; // Ottieni il token dal header Authorization

    if (!token) {
        return res.status(401).json({ message: 'Access Denied: No Token Provided!' });
    }

    try {
        const decoded = jwt.verify(token, 'your_jwt_secret'); // Verifica il token
        req.user = decoded; // Aggiungi l'utente decodificato alla richiesta
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid Token' });
    }
};

// Usa ensureAuthenticated per proteggere le rotte
app.get('/api/protected-route', ensureAuthenticated, (req, res) => {
    res.json({ message: 'This is a protected route' });
});

app.use(express.static(path.join(__dirname, 'client/build')));

  // servela build statica, sovrascritto poi dalle routes di App.js
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
