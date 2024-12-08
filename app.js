const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const routes = require('./routes/routes');


const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: '_',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

app.set('view engine', 'ejs');

// Routes
app.use(routes);

app.listen(3000);