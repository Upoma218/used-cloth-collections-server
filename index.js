const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('mongodb');
require('dotenv').config();
// const jwt = require('jsonwebtoken');
// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4cizlao.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


// JWT
/* function verifyJWT(req, res, next) {
    // console.log('token inside verifyJWT', req.headers.authorization);
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('Unauthorized access')
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, 
        function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' })
        }
        req.decoded = decoded;
        next();
    })
} */

async function run() {
    try{
        const productsCollection = client.db('usedCloth').collection('products');
        const advertiseProductsCollection = client.db('usedCloth').collection('advertiseProducts');
        const usersCollection = client.db('usedCloth').collection('users');
        const paymentsCollection = client.db('usedCloth').collection('payments');

        // verifyAdmin
        /*  const verifyAdmin = async (req, res, next) => {
            // console.log('verifyAdmin', req.decoded.email);
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);
            if (user?.role !== 'admin') {
                return ren.status(403).send({ message: 'Forbidden Access' })
            }
            next();
        } */


        // verifySeller
        /*  const verifySeller = async (req, res, next) => {
            // console.log('verifySeller', req.decoded.email);
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);
            if (user?.role !== 'seller') {
                return ren.status(403).send({ message: 'Forbidden Access' })
            }
            next();
        } */

    }
    finally {

    }
}
run().catch(console.log)

app.get('/', async (req, res) => {
    res.send('Used-Cloth-Collections server is running')
});

app.listen(port, () => {
    console.log(`Used-Cloth-Collections running on ${port}`)
});