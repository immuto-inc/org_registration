var express = require('express');
var path = require('path')
var bodyParser = require('body-parser')
var immuto = require('immuto-backend')
var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest


const DEFAULT_PORT = 8001
const IMMUTO_HOST = "https://dev.immuto.io" // https://dev.immuto.io for dev env


var app = express();
var im = immuto.init(true, IMMUTO_HOST) // leave blank for production use


app.use(express.static(path.join(__dirname, 'static')));
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json()) 


/******************************* Website Pages ********************************/
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'index.html'));
})

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'register.html'));
})

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'login.html'));
})

app.get('/dashboard', (req, res) => {
    user_logged_in(req.query.authToken).then((userInfo) => {
        res.end("User authenticated: " + JSON.stringify(userInfo))
    }).catch((err) => {
        if (err.code && err.code == 403) {
            res.status(403).end("Unauthorized.")
        } else {
            res.status(500).end("Internal error.")
        }
    })
})


/************************************ API *************************************/
app.post("/register-org-user", (req, res) => {
    let email = req.body.email // validate appropriately before use

    var http = new XMLHttpRequest()
    let sendstring = "email=" + email.toLowerCase()
    sendstring += "&noEmail=true" // Causes API to respond with authToken rather than emailing user
    sendstring += "&authToken=" + im.authToken // org admin authToken for permissioning new user registration
    http.open("POST", IMMUTO_HOST + "/submit-org-member", true)
    http.setRequestHeader("Content-Type", "application/x-www-form-urlencoded")
    http.onreadystatechange = () => {
        if (http.readyState == 4 && http.status == 200) {
            let regToken = http.responseText
            res.end(regToken)
        } else if (http.readyState == 4) {
            res.status(http.status).end(http.responseText)
        }
    }
    http.send(sendstring)
})


/***************************** Utility Functions ******************************/
function user_logged_in(authToken) {
    return new Promise((resolve, reject) => {
        var http = new XMLHttpRequest()

        let sendstring = "authToken=" + authToken
        http.open("POST", IMMUTO_HOST + "/verify-user-authentication", true)
        http.setRequestHeader("Content-Type", "application/x-www-form-urlencoded")
        http.onreadystatechange = () => {
            if (http.readyState == 4 && http.status == 200) {
                try {
                    let userInfo = JSON.parse(http.responseText)
                    resolve(userInfo)
                } catch(err) {
                    reject(err)
                }
            } else if (http.readyState == 4) {
                let response = {
                    responseText: http.responseText,
                    code: http.status
                }
                reject(response)
            }
        }
        http.send(sendstring)
    })
}

function get_credentials() {
    credentials = {}
    if (process.env.EMAIL && process.env.PASSWORD) {
        credentials.email = process.env.EMAIL
        credentials.password = process.env.PASSWORD
        return credentials
    } else {
        console.error("You must set EMAIL and PASSWORD env variables.")
        process.exit()
    }
}

let cred = get_credentials()
console.log("Authenticating admin Immuto account.")
im.authenticate(cred.email, cred.password).then(() => { // authentication lasts 24 hours
    console.log("Authentication successful. Starting web server.")
    app.listen((process.env.PORT || DEFAULT_PORT), function() {
        console.log('Node app is running on port: ' + (process.env.PORT || DEFAULT_PORT));
    });
}).catch((err) => {
    console.error("Error authenticating admin Immuto account:")
    console.error(err)
})
