const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('hello from genius-car-server');
});

console.log(process.env.DB_USER);
console.log(process.env.DB_PASSWORD);


function varifyJwt(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('Unauthorized Access');
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(401).send('Unauthorized Access');
        }
        req.decoded = decoded;
        next();
    })
}



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.tzinyke.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const servicesesCollection = client.db('genius-car-db').collection('services');
        const ordersCollection = client.db('genius-car-db').collection('orders');

        app.get('/services', async (req, res) => {
            const query = {};
            const cursor = servicesesCollection.find(query);
            const result = await cursor.toArray();
            console.log(result);
            res.send(result);
        });

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await servicesesCollection.findOne(query);
            console.log(service);
            res.send(service);
        });

        app.post('/orders', varifyJwt, async (req, res) => {
            const order = req.body;
            const result = await ordersCollection.insertOne(order);
            console.log(result);
            res.send(result);
        });

        app.get('/orders', varifyJwt, async (req, res) => {
            const decoded = req.decoded;

            if (decoded.email !== req.query.email) {
                return res.status(403).send({ message: 'Unauthorized Access' })
            }

            let query = {};
            if (req.query.email) {
                query = { "customerInfo.email": req.query.email }
            }
            const cursor = ordersCollection.find(query);
            const result = await cursor.toArray();
            console.log(result);
            res.send(result);
        });

        app.get('/orders/:id', varifyJwt, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const order = await ordersCollection.findOne(query);
            console.log(order);
            res.send(order);
        });

        app.delete('/orders/:id', varifyJwt, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await ordersCollection.deleteOne(query);
            console.log(result);
            res.send(result);
        })

        app.patch('/orders/:id', varifyJwt, async (req, res) => {
            const id = req.params.id;
            const status = req.body.status;
            const query = { _id: ObjectId(id) };
            const updatedDoc = {
                $set: {
                    status: status
                }
            }

            const result = await ordersCollection.updateOne(query, updatedDoc);
            res.send(result);
        });

        app.post('/jwt', (req, res) => {
            const user = req.body;
            console.log(user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.send({ token });
        })

    }
    finally {

    }
};

run().catch(error => console.log(error));

app.listen(port, () => {
    console.log('genius-car-server is running on port :', port);
});