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
app.set('view engine', 'ejs')

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
    
    

    app.post('/info', (req,res) => {
        console.log(req.body.cookie.split('=')[1])
        //check if cookie is in body
        if(req.body.cookie){
            let userInfo = decryptToken(req.body.cookie.split('=')[1])
            let renderInfo = { 'database' : modDB, 'userInfo' : userInfo }
            res.render('index.ejs', { info : renderInfo })
        }
        //call decryptToken to decrypt accesstoken, store in userInfo variable
        //grab modDB
        //create new object with modDB info and userInfo
        //render ejs with object
    })

    app.get('/login', (req, res) => {
        res.sendFile(__dirname + '/login.html')
    })

    app.post('/signup', (req, res) => {
        let user = req.body.user
        let pass = md5(req.body.pass)
        // Primary key in mongodb?
        usersDB.find({ user: user }).toArray()
            .then((results) => {
                if (results.length < 1) {
                    //add isAdmin to check if admin before allowing delete methods
                    //allow user to delete their own entry
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
                    //TODO: render ejs access token
                } else {
                    res.send({ status: 401, msg: "Incorrect username or password" })
                }
            })
    })

    // app.get('/info', (req,res) => {
    //     res.render('index.ejs', { userInfo : user })
    // })

    app.post('/editor', authenticateToken, (req, res) => {
        if (req.user.name === 'admin' || req.user.name === 'josh') {
            let mpName = req.body.name,
                mpURL = req.body.url,
                mpVer = req.body.mpVer,
                mcVer = req.body.mcVer,
                mods = req.body.mods

            modDB.find({ name: mpName }).toArray()
                .then((results) => {
                    if (results.length < 1) {
                        modDB.insertOne({
                            name: mpName,
                            url: mpURL,
                            mpVer: mpVer,
                            mcVer: mcVer,
                            mods: mods
                        })
                        res.status(200)
                    }
                })
        } else {
            res.status(403)
        }
    })

    app.get('/getall', (req, res) => {
        usersDB.find().toArray().then(results => res.send({ results }))
    })

    app.get('/test', authenticateToken, (req, res) => {
        res.send({ msg: `Logged in as ${req.user.name}` })
    })
})

//Verifies user access token to make sure its real
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

const decryptToken = (token) => {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, endUser) => {
        if (err) return console.error(err)
        return endUser
    })
}

const generateAccessToken = (user) => {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET)
}

app.listen(PORT, () => {
    console.log(`server is running on http://localhost:${PORT}`)
})