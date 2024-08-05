const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 5000;

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

// Route middleware
app.use('/api/auth', authRoutes);

app.use(express.static(path.join(__dirname, 'client/build')));

  // Serve the static build file for any route not handled by the API
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token'); // Cancella il cookie di autenticazione
  res.status(200).json({ message: 'Logout successful' });
});


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
