const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
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
function verifyJWT(req, res, next) {
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
}

async function run() {
    try{
        const productsCollection = client.db('usedCloth').collection('products');
        const advertiseProductsCollection = client.db('usedCloth').collection('advertiseProducts');
        const categoryProductsCollection = client.db('usedCloth').collection('categoryProducts');
        const usersCollection = client.db('usedCloth').collection('users');
        const paymentsCollection = client.db('usedCloth').collection('payments');

        //  verifyAdmin
         const verifyAdmin = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);
            if (user?.role !== 'Admin') {
                return ren.status(403).send({ message: 'Forbidden Access' })
            }
            next();
        } 


        // verifySeller
           const verifySeller = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);
            if (user?.role !== 'Seller') {
                return res.status(403).send({ message: 'Forbidden Access' })
            }
            next();
        }

        app.get('/products', async (req, res) => {
            const query = {};
            const product = await productsCollection.find(query).toArray();
            res.send(product);
        })
        app.post('/products', verifyJWT, async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.send(result);
        })
        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        })
     


        app.get('/users/buyers', verifyJWT,  async (req, res) => {
            const query = {role:"Buyer"}
            const user = await usersCollection.find(query).toArray();
            res.send(user);
        })

        app.get('/users/sellers', verifyJWT, async (req, res) => {
            const query = {role:"Seller"}
            const user = await usersCollection.find(query).toArray();
            res.send(user);
        })

        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'Admin' });
        })
        app.get('/users/Sellers/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollection.findOne(query);
            res.send({ isSeller: user?.role === 'Seller' });
        })
        app.get('/users/Buyers/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollection.findOne(query);
            res.send({ isBuyer: user?.role === 'Buyer' });
        })
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);

        });

       app.put('/users/sellers/:id',  verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    role: 'seller'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result)
        }) 
      
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '5d' })
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' })
        })
        app.delete('/users/:id',  verifyJWT, verifyAdmin,  async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id)}
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
        })


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