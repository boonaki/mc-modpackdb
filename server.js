const express = require('express')
const app = express()
const PORT = 8000
const md5 = require("md5")
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
                console.log(results)
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
                console.log(results)
                if (results.length === 1) {
                    // Login as user here?
                    res.send({ status: 200, msg: "Found user" })
                } else {
                    res.send({ status: 401, msg: "Incorrect username or password" })
                }
            })
    })

    app.get('/getall', (req, res) => {
        usersDB.find().toArray().then(results => console.log(results))
    })
})




app.listen(PORT, () => {
    console.log('server is running')
})