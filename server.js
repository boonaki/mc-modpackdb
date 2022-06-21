const express = require('express')
const app = express()
const PORT = 8000
const md5 = require("md5")
require('dotenv').config()
const MongoClient = require('mongodb').MongoClient
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


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
        let found = usersDB.find({ user: user })
        /* 
        if !found:
            db.usersDB.insertOne(
                { user: user, pass: pass }
            )
            login as newly created user
        else: 
            res.send error
        */
    })

    app.post('/login', (req, res) => {
        let user = req.body.user
        let pass = md5(req.body.pass)
        // search db using user and pass then return status code and required data
    
        let found = usersDB.find({ user: user, pass: pass })
        /* 
        if found:
            login as user
        else: 
            res.send error
        */
    })
})



app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

app.listen(PORT, () => {
    console.log('server is running')
})