const dotenv = require("dotenv").config();
const nodemailer = require('nodemailer');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const express = require('express');
const cors = require('cors'); // Add CORS middleware
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/user'); // Ensure to import the User model
const Tutor = require('./models/tutor.js');
const Teacher = require('./models/teacher.js');
const path = require('path');
const app = express();
const expressLayouts = require('express-ejs-layouts');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(expressLayouts);
app.set('layout', './layouts/boilerplate');
app.use(express.json());
app.use(cors()); // Enable CORS

// const MONGO_URI = 'mongodb://127.0.0.1:27017/Tutor';
const MONGO_URI = process.env.MONGODB_URI;
main()
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Error connecting to MongoDB:', err));

async function main() {
    await mongoose.connect(MONGO_URI);
}
app.use(session({
    secret: 'ajaypadghan13102003',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// Configure the SMTP transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    service: 'gmail',
    secure: true, // Use SSL for Gmail
    auth: {
        user: 'tutoracademy95@gmail.com', // Your email address
        pass: process.env.SMTP_PASSWORD, // App password generated in Google
    },
});

// Define the sendEmail function
async function sendEmail({ name, email, type }) {
    const subject =
        type === 'query'
            ? 'Query Confirmation - Tutor Academy'
            : 'Registration Confirmation - Tutor Academy';

    const text =
        type === 'query'
            ? `Dear ${name},\n\nThank you for submitting your query. We will get back to you shortly.\n\nBest regards,\nTutor Academy`
            : `Dear ${name},\n\nThank you for registering as a teacher. We look forward to working with you.\n\nBest regards,\nTutor Academy`;

    try {
        await transporter.sendMail({
            from: 'tutoracademy95@gmail.com', // Sender address
            to: email, // Recipient email
            subject, // Email subject
            text, // Email body
        });
        console.log(`Email sent successfully to: ${email}`);
    } catch (error) {
        console.error('Error sending email:', error.message);
        throw new Error('Failed to send email');
    }
}


// POST endpoint for registration (/register)
app.post('/register', async (req, res) => {
    const { name, college, queries, email } = req.body;

    if (!name || !email || !college || !queries) {
        return res.status(400).send('All fields are required.');
    }

    try {
        // Save data to MongoDB
        const newTutor = new Tutor({
            name,
            collegename: college, // Map 'college' to 'collegename'
            doubt: queries, // Map 'queries' to 'doubt'
            email,
        });
        await newTutor.save();
        console.log('Data saved to MongoDB');

        // Send query confirmation email
        await sendEmail({ name, email, type: 'query' });
        console.log('Query email sent successfully');

        res.status(200).send({
            message: 'Query submitted successfully, and email sent!',
        });
    } catch (error) {
        console.error('Error in registration process:', error.message);
        res.status(500).send({ error: 'Failed to process registration' });
    }
});

// POST endpoint for teacher registration (/neww)
app.post('/neww', async (req, res) => {
    const { name, subject, experience, email, photoUrl } = req.body;

    if (!name || !subject || !experience || !email || !photoUrl) {
        return res.status(400).send('All fields are required.');
    }

    try {
        // Save teacher data to MongoDB
        const newTeacher = new Teacher({
            name,
            subject,
            experience,
            email,
            photoUrl,
        });
        await newTeacher.save();
        console.log('Teacher data saved to MongoDB');

        // Send teacher registration confirmation email
        await sendEmail({ name, email, type: 'teacher' });
        console.log('Teacher email sent successfully');

        res.status(200).send({
            message: 'Teacher registration successful and email sent!',
        });
    } catch (error) {
        console.error('Error in teacher registration process :', error.message);
        res.status(500).send({ error: 'Failed to process teacher registration' });
    }
});


// Render SignUp/SignIn Page
// Render SignUp/SignIn Page
app.get('/sign', (req, res) => {
    res.render('./listings/signinup.ejs', { user: req.session.user });
});
// User Sign up
app.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).send('All fields are required.');
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send({ error: 'User already exists with this email.' });
        }

        // No manual hashing here — let the pre-save middleware handle it
        const newUser = new User({ name, email, password });
        await newUser.save();

        req.session.user = newUser;
        await sendEmail({ name, email, type: 'register' });

        res.redirect('/home');
    } catch (error) {
        console.error('Registration error:', error.message);
        res.status(500).send({ error: 'Failed to register user', details: error.message });
    }
});


// User Login Route
app.post('/signin', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).send('User not found. Please register first.');
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).send('Incorrect password.');
        }

        req.session.user = user;
        res.redirect('/home');
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).send({ error: 'Failed to login', details: error.message });
    }
});

// Logout Route
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err.message);
            return res.status(500).send('Failed to logout.');
        }
        res.redirect('/');
    });
});

// Home Page
app.get('/home', (req, res) => {
    res.render('./listings/home.ejs', { user: req.session.user });
});

app.get('/', (req, res) => {
    res.render('./listings/home.ejs', { user: req.session.user });
});
app.get('/Joiastutor', (req, res) => {
    res.render('./listings/joinastutor.ejs');
});

// Ask Query Page
app.get('/askquery', (req, res) => {
    res.render('./listings/askquery.ejs');
});

// About Us Page
app.get('/about', (req, res) => {
    res.render('./listings/about.ejs');
});

// Teachers Page
app.get('/teachers', async (req, res) => {
    try {
        const teachers = await Teacher.find(); // Fetch all teachers from the database
        res.render('./listings/teachers.ejs', { teacher: teachers }); // Pass 'teachers' data to the EJS template
    } catch (error) {
        console.error('Error fetching teachers:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

// Privacy Policy Page
app.get('/privacy', (req, res) => {
    res.render('./listings/privacy.ejs');
});

// Terms & Conditions Page
app.get('/terms', (req, res) => {
    res.render('./listings/terms.ejs');
});

// Route to display tutor details
app.get('/tuter/:id', async (req, res) => {
    try {
        const tutor = await Teacher.findById(req.params.id);
        if (!tutor) {
            return res.status(404).send('Tutor not found');
        }
        res.render('./listings/tutor.ejs', { tutor });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Start the server
const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost${PORT}`);
});
