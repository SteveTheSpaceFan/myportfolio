const MongoClient = require('mongodb').MongoClient
const express = require('express')
const app = express();
const ip = require('ip')

let local_ipAddress = ip.address()
let port = 5001

const connectionString = "mongodb+srv://steve:Yuyu1984@clusterofsteve.k4plc.mongodb.net/"

const dbName = "myPortfolio"
const collectionName = 'comments'


MongoClient.connect(connectionString)
    .then(client => {
        console.log('\n' + 'Connected to Database')
        const collection = client.db(dbName).collection(collectionName)

        app.use(express.urlencoded({ extended: false }))
        app.use(express.json())
        app.use(express.static('./static'))

        app.get('/data/comments', function (req, res) {
            const findObj = {}
            const sortObj = { timeOfPost: -1 }
            const limit = 30
            collection.find(findObj).sort(sortObj).limit(limit).toArray()
                .then(results => {
                    res.send(results)
                })
                .catch(error => console.error(error))
        })

        app.post('/data/comments', (req, res) => {
            req.body.ip_adress = req.ip;

            collection.insertOne(req.body)
                .then(results => {
                    console.log('\nSomeone posted:')
                    console.log(req.body)
                })
                .catch(error => console.error(error))
        })

        app.listen(port, local_ipAddress, () => {
            console.log(local_ipAddress + ':' + port);
        })
    })
    .catch(console.error)


