const express = require('express')
const app = express()
const user = require('./services/user')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser');
const routing = require('./routes/routing')
const port = 'port' in hawkConfig ? hawkConfig.port : 9021

app.set('view engine', 'pug')

// User session middle ware
app.use(cookieParser());
app.use(user.redirectLoggedOut);
app.use(bodyParser.urlencoded({ extended: true }))
app.use(function (req, res, next) {
    res.set('Cache-control', 'no-cache')
    next();
})

// Load css and js
app.use(express.static(__dirname + '/public'));

const server = {
    start: function() {
        routing.route(app)
        
        app.listen(port, () => {
            console.log(`Example app listening at http://localhost:${port}`)
        })
    }
}
module.exports = server;

