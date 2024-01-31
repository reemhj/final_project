const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const basicAuth = require('express-basic-auth');

const app = express();
const PORT = process.env.PORT || 3001;

// MongoDB setup
mongoose.connect('mongodb://localhost:27017/weatherapp', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Create a user schema and model for MongoDB
const userSchema = new mongoose.Schema({
  email: String,
  preferences: Object,
});

const User = mongoose.model('User', userSchema);

// Express Basic Auth
const users = { 'admin': 'supersecret' };
app.use(basicAuth({ users, challenge: true, unauthorizedResponse: 'Unauthorized' }));

// Express middleware to parse JSON
app.use(express.json());

// Weather API endpoint
app.post('/api/weather', async (req, res) => {
  try {
    const { email, location } = req.body;

    // Call weather API (replace with your API key)
    const apiKey = 'YOUR_WEATHER_API_KEY';
    const weatherResponse = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}`);
	
	//call weather API for 7 day-If you want 7-day weather forecasts, you need to use a different API endpoint that supports forecast data.
	const forecastResponse = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${apiKey}`);


    // Save weather result to MongoDB
    const user = await User.findOne({ email });

    if (user) {
      user.preferences = { location, weather: weatherResponse.data };
      await user.save();
    } else {
      const newUser = new User({
        email,
        preferences: { location, weather: weatherResponse.data },
      });
      await newUser.save();
    }

    res.json({ success: true, message: 'Weather data saved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
