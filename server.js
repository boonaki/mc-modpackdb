const express = require('express')
const app = express()
const PORT = 8000
const md5 = require("md5")
const jwt = require('jsonwebtoken')
const fetch = require('node-fetch')
const cors = require('cors')
const { render } = require('ejs')
require('dotenv').config()
const MongoClient = require('mongodb').MongoClient
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs')

//connect to db
MongoClient.connect(process.env.CONNSTRING, (err, client) => {
    if (err) return console.error(err)
    console.log('connected to db')

    const db = client.db('MC-Modpack')

    //stores database collections into variables
    const usersDB = db.collection('Users')
    const modDB = db.collection('Modpack')

    //on pagelaod
    app.get('/', (req, res) => {
        res.sendFile(__dirname + '/public/pages/login.html')
    })

    //renders database
    app.get('/info', (req, res) => {
        modDB.find().toArray()
            .then((results) => {
                let renderInfo = { 'database': results }
                // console.log(renderInfo)
                res.render('index.ejs', { info: renderInfo })
            })
    })

    //sends token to info
    app.post('/info', (req, res) => {
        //grabs encoded username from token
        let userInfo = decryptToken(req.body.cookie.split('=')[1])
        res.send({ user: userInfo })
    })

    //sends login
    app.get('/login', (req, res) => {
        res.sendFile(__dirname + '/login.html')
    })

    //adds user to database
    app.post('/signup', (req, res) => {
        let user = req.body.user
        //hashes password using library
        let pass = md5(req.body.pass)
        //checks if user is already in database
        usersDB.find({ user: user }).toArray()
            .then((results) => {
                //if there isnt a user, then add into database
                if (results.length < 1) {
                    //TODO:
                    //add isAdmin to check if admin before allowing delete methods
                    //allow user to delete their own entry
                    usersDB.insertOne({ user: user, pass: pass, admin: false })
                    // Login as newly created user here?
                    res.send({ status: 200, msg: "Added user" })
                } else { //if user exists, send message that username is taken
                    res.send({ status: 401, msg: "Username is taken" })
                }
            })
    })

    //login to the site
    app.post('/login', (req, res) => {
        let user = req.body.user
        //hashes password
        let pass = md5(req.body.pass)

        // search db using user and pass then return status code and required data
        usersDB.find({ user: user, pass: pass }).toArray()
            .then((results) => {
                if (results.length === 1) {
                    // sets user as user from database and admin verification
                    const endUser = { name: user, admin: results[0].admin }
                    //creates encrypted accesstoken for specific user
                    const accessToken = generateAccessToken(endUser)
                    res.send({ status: 200, accessToken: accessToken })
                } else {
                    res.send({ status: 401, msg: "Incorrect username or password" })
                }
            })
    })

    //accessing DB editor
    app.get('/tempeditor', (req, res) => {
        //checks if there is a cookie
        if (req.headers.cookie) {
            let searchData = []
            //if the query in URL is empty
            if (req.query.name == undefined || req.query.name == '') {
                modDB.find().toArray()
                    .then((results) => {
                        //initializes userinfo to send
                        const _userInfo = req.headers.cookie.split('=')[1]
                        //sends neccessary data to render ejs file
                        res.render("mpeditor.ejs", { user: decryptToken(_userInfo), database: results, searchData : searchData })
                    })
                // fetch(`https://www.modpackindex.com/api/v1/modpacks?limit=0&page=1`)
                //     .then(result => result.json())
                //     .then((result) => {
                //         // store data (sent in as an array), into declared array
                //         searchData = result.data
                //         //waits for result from api call, then grabs the modpack database
                        // modDB.find().toArray()
                        //     .then((results) => {
                        //         //initializes userinfo to send
                        //         const _userInfo = req.headers.cookie.split('=')[1]
                        //         //sends neccessary data to render ejs file
                        //         res.render("mpeditor.ejs", { user: decryptToken(_userInfo), database: results, searchData : searchData })
                        //     })
                //     })
            //if the query in URL is not empty
            } else {
                //replace parameter in api call with the query value
                fetch(`https://www.modpackindex.com/api/v1/modpacks?limit=50&page=1&name=${req.query.name}`)
                    .then(result => result.json())
                    .then((result) => {
                        searchData = result.data
                        //waits for result from api call
                        modDB.find().toArray()
                            .then((results) => {
                                const _userInfo = req.headers.cookie.split('=')[1]
                                res.render("mpeditor.ejs", { user: decryptToken(_userInfo), database: results, searchData : searchData })
                            })
                    })
            }
        //if there is no cookie, declare user as guest user
        } else {
            res.render("mpeditor.ejs", { user: { admin: false } })
        }
    })

    //hides a modpack
    app.put('/hideMP/:modpackID', (req,res) => {
        modDB.findOneAndUpdate(
            //filter database based on given modpackID
            { id : +req.params.modpackID},
            { $set : {showing: false}},
            { upsert: true}
        )
            .catch(err => console.error(err))
    })

    //TODO: add endpoint that removes the modpack from the database

    //grabs a single modpack based on modpackID
    app.get('/retrievemp/:modpackID', (req,res) => {
        modDB.find({ id: +req.params.modpackID }).toArray()
            .then((result) => {
                res.json(result)
            })
    })

    //If selected modpack is already in our database, flip the showing boolean to true
    app.put('/showMP/:modpackID', (req,res) => {
        modDB.findOneAndUpdate(
            //filter database based on given modpackID
            { id : +req.params.modpackID},
            { $set : {showing: true}},
            { upsert: true}
        )
            .then((result) => {
                console.log(result)
            })
            .catch(err => console.error(err))
    })

    //If selected modpack is *not* already in our database, add it
    app.get('/addMP/:modpackID', (req,res) => {
        let modpacks = []
        // Fetch mod list from modpackindex for selected modpack (ID)
        fetch(`https://www.modpackindex.com/api/v1/modpack/${req.params.modpackID}/mods`)
            .then(result => result.json())
            .then((result) => {
                //for every mod for selected modpack
                for (let j = 0; j < result.data.length; j++) {
                    // grab curseID from previous fetch, and input into api call from curse forge
                    fetch(`https://api.curseforge.com/v1/mods/${result.data[j].curse_info.curse_id}`, {
                        method: 'GET',
                        headers: { 'Content-type': 'application/json', "x-api-key": process.env.CURSEKEY }
                    })
                        .then(curseRes => curseRes.json())
                        .then((curseRes) => {
                            //grabs and formats data into object
                            let tempObj = {
                                id: result.data[j].id,
                                modName: result.data[j].name,
                                modSlug: result.data[j].slug,
                                modURL: result.data[j].url,
                                modAuthor: curseRes.data.authors[0].name
                            }
                            //pushes into modpacks array
                            modpacks.push(tempObj)
                        })
                        .catch(err => console.error(err))
                }
            })
            //after above is finished, find the information for the specific modpack
            .then((result) => {
                fetch(`https://www.modpackindex.com/api/v1/modpack/${req.params.modpackID}`)
                    .then(mpRes => mpRes.json())
                    .then((mpRes) => {
                        //format data and store into object
                        let mp = {
                            id: mpRes.data.id,
                            mpName: mpRes.data.name,
                            slug: mpRes.data.slug,
                            thumb: mpRes.data.thumbnail_url,
                            url: mpRes.data.url,
                            summ: mpRes.data.summary,
                            mpAuthor: mpRes.data.authors[0].name,
                            mcVer: mpRes.data.minecraft_versions[0].name,
                            //modpacks retrieved from previous fetch
                            mods: modpacks,
                            //displays into visualizer
                            showing: true
                        }
                        res.json(mp)
                            
                    })
                    .catch(err => console.error(err))
            })
    })

    //adds modpack into our database
    app.post('/editor', authenticateToken, (req, res) => {
        if (req.user.name === 'admin' || req.user.name === 'josh') {
            //finds by ID
            modDB.find({ id: req.body.id }).toArray()
                .then((results) => {
                    if (results.length < 1) {
                        modDB.insertOne(req.body)
                        res.status(200)
                    }
                })
        } else {
            res.status(403)
        }
    })

    //grabs all users in database
    app.get('/getall', (req, res) => {
        usersDB.find().toArray().then(results => res.send({ results }))
    })

    //verifies who is logged in
    app.get('/test', authenticateToken, (req, res) => {
        res.send({ msg: `Logged in as ${req.user.name}` })
    })
})

//Verifies user access token to make sure its real
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization']
    let token = authHeader && authHeader.split(' ')[1]
    token = token.split('=')[1]
    if (token == null) return res.sendStatus(401)

    //user verification
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, endUser) => {
        if (err) return res.sendStatus(403)
        req.user = endUser
        //goes back to endpoint
        next()
    })
}

//decrypts token using secret access token
const decryptToken = (token) => {
    let result
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, endUser) => {
        if (err) return console.error(err)
        result = endUser
    })
    return result
}

//generates access token using secret access token
const generateAccessToken = (user) => {
    //encrypts user information as JSON webtoken using access token
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET)
}

app.listen(PORT, () => {
    console.log(`server is running on http://localhost:${PORT}`)
})