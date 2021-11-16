const express = require('express')
const app = express()
const user = require('./services/user')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser');
const routing = require('./routes/routing');
const session = require('express-session');
const MemoryStore = session.MemoryStore;
const port = 'port' in hawkConfig ? hawkConfig.port : 9021

app.set('view engine', 'pug')

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
app.use(express.static(__dirname + '/images'));

const server = {
    start: function() {
        routing.route(app)
        
        app.listen(port, () => {
            console.log(`Example app listening at http://localhost:${port}`)
        })
    }
}
module.exports = server;

