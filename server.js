const express = require('express')
const app = express()
const PORT = 8000
const md5 = require("md5")
const jwt = require('jsonwebtoken')
require('dotenv').config()
const MongoClient = require('mongodb').MongoClient
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

//connect to db
MongoClient.connect(process.env.CONNSTRING, (err, client) => {
    if (err) return console.error(err)
    console.log('connected to db')

    const db = client.db('MC-Modpack')
    const usersDB = db.collection('Users')
    const modDB = db.collection('Modpack')

    app.get('/login', (req, res) => {
        res.sendFile(__dirname + '/login.html')
    })

    app.post('/signup', (req, res) => {
        let user = req.body.user
        let pass = md5(req.body.pass)
        // attempt to add user to db maybe check to see if user already exist
        // Primary key in mongodb?
        usersDB.find({ user: user }).toArray()
            .then((results) => {
                if (results.length < 1) {
                    usersDB.insertOne({ user: user, pass: pass })
                    // Login as newly created user here?
                    res.send({ status: 200, msg: "Added user" })
                } else {
                    res.send({ status: 401, msg: "User already exists" })
                }
            })
    })

    app.post('/login', (req, res) => {
        let user = req.body.user
        let pass = md5(req.body.pass)
        // search db using user and pass then return status code and required data

        usersDB.find({ user: user, pass: pass }).toArray()
            .then((results) => {
                if (results.length === 1) {
                    // Login as user here?
                    const endUser = { name: user }
                    const accessToken = generateAccessToken(endUser)
                    res.send({ status: 200, accessToken: accessToken })
                } else {
                    res.send({ status: 401, msg: "Incorrect username or password" })
                }
            })
    })

    app.get('/getall', (req, res) => {
        usersDB.find().toArray().then(results => console.log(results))
    })

    app.get('/test', authenticateToken, (req, res) => {
        res.send({ msg: `Logged in as ${req.user.name}` })
    })
})

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) return res.sendStatus(401)

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, endUser) => {
        if (err) return res.sendStatus(403)
        req.user = endUser
        next()
    })
}

const generateAccessToken = (user) => {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET)
}

app.listen(PORT, () => {
    console.log(`server is running on http://localhost:${PORT}`)
})