const express = require('express')
const app = express()
const user = require('./controllers/user')
const fs = require('fs')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser');
const routing = require('./routes/routing');
const session = require('express-session');
const defaults = require('./controllers/defaults')
const MemoryStore = session.MemoryStore;
const port = 'port' in hawkConfig ? hawkConfig.port : 9021
const path = require('path');

if (fs.existsSync('/tmp/sessions')) {
    user.initialSessions(JSON.parse(fs.readFileSync('/tmp/sessions')));
}

app.set('view engine', 'pug')
app.set('views', path.join(__dirname, '/views'));

// User session middleware.
app.use(cookieParser());
app.use(user.redirectLoggedOut);
app.use(bodyParser.urlencoded({ extended: true }))
app.use(function (req, res, next) {
    res.set('Cache-control', 'no-cache')
    next();
})

// Only used for form validation.
app.use(session({
    name: 'app.sid',
    secret: 'supersecret',
    resave: true,
    saveUninitialized: true,
    store: new MemoryStore()
}))

// Load css and js
app.use(express.static(__dirname + '/public'));
app.use(express.static(defaults.imageLocation));

const server = {
    start: function() {
        routing.route(app)
        
        app.listen(port, () => {})
    }
}
module.exports = server;

