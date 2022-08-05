const express = require('express')
const app = express()
const PORT = 8000
const md5 = require("md5")
const jwt = require('jsonwebtoken')
const fetch = require('node-fetch')
const { render } = require('ejs')
require('dotenv').config()
const MongoClient = require('mongodb').MongoClient
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs')

// app.get('/', (req, res) => {
//     res.sendFile(__dirname + '/index.html')
// })



//connect to db
MongoClient.connect(process.env.CONNSTRING, (err, client) => {
    if (err) return console.error(err)
    console.log('connected to db')

    const db = client.db('MC-Modpack')

    const usersDB = db.collection('Users')
    const modDB = db.collection('Modpack')

    app.get('/', (req, res) => {
        res.sendFile(__dirname + '/public/pages/signup.html')
    })

    /**** PAGE 1 ****/
    // app.get('/apibutton', (req,res) => {
    //     fetch("https://www.modpackindex.com/api/v1/modpacks?limit=50&page=1")
    //         .then(res => res.json())
    //         .then((res) => {
    //             // console.log(res.data)
    //             //for every modpack in dudes database
    //             for(let i = 0; i < res.data.length; i++){
    //                 setTimeout(() => {
    //                     let modpacks = []
    //                     fetch(`https://www.modpackindex.com/api/v1/modpack/${res.data[i].id}/mods`)
    //                         .then(result => result.json())
    //                         .then((result) => {
    //                             //for every mod in each modpack from dudes db
    //                             for(let j = 0; j < result.data.length; j++){
    //                                 // console.log(result.data[j].curse_info)
    //                                 fetch(`https://api.curseforge.com/v1/mods/${result.data[j].curse_info.curse_id}`, {
    //                                     method : 'GET',
    //                                     headers : { 'Content-type': 'application/json', "x-api-key" : process.env.CURSEKEY }
    //                                 })
    //                                     .then(curseRes => curseRes.json())
    //                                     .then((curseRes) => {
    //                                         // console.log(curseRes.data.authors[0].name)
    //                                         let tempObj = {
    //                                             id : result.data[j].id,
    //                                             modName : result.data[j].name,
    //                                             modSlug : result.data[j].slug,
    //                                             modURL : result.data[j].url,
    //                                             modAuthor : curseRes.data.authors[0].name
    //                                         }
    //                                         modpacks.push(tempObj)
    //                                     })
    //                                     .catch(err => console.error(err))

    //                             }

    //                                 fetch(`https://www.modpackindex.com/api/v1/modpack/${res.data[i].id}`)
    //                                     .then(mpRes => mpRes.json())
    //                                     .then((mpRes) => {
    //                                         modDB.insertOne({
    //                                             id : res.data[i].id, 
    //                                             mpName : res.data[i].name,
    //                                             slug : res.data[i].slug,
    //                                             thumb : res.data[i].thumbnail_url,
    //                                             url : res.data[i].url,
    //                                             summ : res.data[i].summary,
    //                                             mpAuthor : mpRes.data.authors[0].name,
    //                                             mcVer : mpRes.data.minecraft_versions[0].name,
    //                                             mods : modpacks,
    //                                             showing : false 
    //                                         })
    //                                     })
    //                                     .catch(err => console.error(err))
    //                             //for eachmodpack, fetch dudes modpack information with modpackid
    //                                 //grab working mc version and author
    //                         })
    //                 }, 30000)
    //                 // console.log(res.data[i].name)
    //             }
    //         })
    // })

    app.get('/info', (req, res) => {
        // console.log(req.body.cookie.split('=')[1])
        //check if cookie is in body
        // let userInfo = ""
        // if(req.body.cookie){
        //     userInfo = decryptToken(req.body.cookie.split('=')[1])
        // let renderInfo = { 'database' : results, 'userInfo' : userInfo }
        // }

        modDB.find().toArray()
            .then((results) => {
                let renderInfo = { 'database': results }
                // console.log(renderInfo)
                res.render('index.ejs', { info: renderInfo })
            })
        //call decryptToken to decrypt accesstoken, store in userInfo variable
        //grab modDB
        //create new object with modDB info and userInfo
        //render ejs with object
    })

    app.post('/info', (req, res) => {
        let userInfo = decryptToken(req.body.cookie.split('=')[1])
        res.send({ user: userInfo })
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
                    usersDB.insertOne({ user: user, pass: pass, admin: false })
                    // Login as newly created user here?
                    res.send({ status: 200, msg: "Added user" })
                } else {
                    res.send({ status: 401, msg: "Username is taken" })
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
                    const endUser = { name: user, admin: results[0].admin }
                    const accessToken = generateAccessToken(endUser)
                    res.send({ status: 200, accessToken: accessToken })
                    //TODO: render ejs access token
                } else {
                    res.send({ status: 401, msg: "Incorrect username or password" })
                }
            })
    })

    app.get('/tempeditor', (req, res) => {
        if (req.headers.cookie) {
            modDB.find().toArray()
                .then((results) => {
                    const _userInfo = req.headers.cookie.split('=')[1]
                    res.render("mpeditor.ejs", { user: decryptToken(_userInfo), database: results })
                })
        } else {
            res.render("mpeditor.ejs", { user: { admin: false } })
        }
    })

    app.get('/mpgetter', (req, res) => {
        if (req.headers.cookie) {
            if (req.query.name == undefined || req.query.name == '') {
                fetch(`https://www.modpackindex.com/api/v1/modpacks?limit=3&page=1`)
                    .then(result => result.json())
                    .then((result) => {
                        const _userInfo = req.headers.cookie.split('=')[1]
                        res.render("mpgetter.ejs", { user: decryptToken(_userInfo), data: result.data})
                    })
            } else {
                fetch(`https://www.modpackindex.com/api/v1/modpacks?limit=50&page=1&name=${req.query.name}`)
                    .then(result => result.json())
                    .then((result) => {
                        console.log(result)
                        const _userInfo = req.headers.cookie.split('=')[1]
                        res.render("mpgetter.ejs", { user: decryptToken(_userInfo), data: result.data})
                    })
            }
        } else {
            res.render("mpgetter.ejs", { user: { admin: false }, data: [] })
        }
    })

    app.delete('/removeMP', (req, res) => {
        modDB.deleteOne({ mpID: req.body.mpID })
            .then((result) => {
                return res.json('deleted')
            })
            .catch(err => console.error(err))
    })

    // app.post('/editor', authenticateToken, (req, res) => {
    //     if (req.user.name === 'admin' || req.user.name === 'josh') {
    //         let mpName = req.body.name,
    //             mpAuthor = req.body.author,
    //             mpURL = req.body.url,
    //             mpVer = req.body.mpVer,
    //             mcVer = req.body.mcVer,
    //             mpIcon = req.body.mpIcon,
    //             // mpDate = req.body.mpDate,
    //             mods = req.body.mods

    //         modDB.find({ name: mpName }).toArray()
    //             .then((results) => {
    //                 if (results.length < 1) {
    //                     modDB.insertOne({
    //                         name: mpName,
    //                         author: mpAuthor,
    //                         url: mpURL,
    //                         mpVer: mpVer,
    //                         mcVer: mcVer,
    //                         mpIcon: mpIcon,
    //                         // mpDate: mpDate,
    //                         mods: mods
    //                     })
    //                     res.status(200)
    //                 }
    //             })
    //     } else {
    //         res.status(403)
    //     }
    // })

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
    let token = authHeader && authHeader.split(' ')[1]
    token = token.split('=')[1]
    if (token == null) return res.sendStatus(401)

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, endUser) => {
        if (err) return res.sendStatus(403)
        req.user = endUser
        next()
    })
}

const decryptToken = (token) => {
    let result
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, endUser) => {
        if (err) return console.error(err)
        result = endUser
    })
    return result
}

const generateAccessToken = (user) => {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET)
}

app.listen(PORT, () => {
    console.log(`server is running on http://localhost:${PORT}`)
})