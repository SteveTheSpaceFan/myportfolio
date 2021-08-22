const MongoClient = require('mongodb').MongoClient
const express = require('express')
const app = express();

let port = process.env.PORT || 5555

const connectionString = "mongodb+srv://steve:Yuyu1984@clusterofsteve.k4plc.mongodb.net/"

const dbName = "myPortfolio"
const collectionName = 'comments'


MongoClient.connect(connectionString)
    .then(client => {
        console.log('\n' + 'Connected to Database')
        const collection = client.db(dbName).collection(collectionName)

        app.use(express.urlencoded({ extended: false }))
        app.use(express.json())
        app.use(express.static('./public'))

        app.get('/data/comments', function (req, res) {
            const findObj = {}
            const sortObj = { timeOfPost: -1 }
            const limit = 15
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

        app.delete('/data/comments', (req, res) => {

            let query = req.body
            collection.deleteOne(query)
                .then(results => {
                    console.log('\nSomeone deleted:')
                    console.log(req.body)
                })
                .catch(error => console.error(error))
        })

        app.listen(port, () => {
            console.log(port);
        })
    })
    .catch(console.error)


