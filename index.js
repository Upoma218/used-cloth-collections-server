const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
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
    try {
        const productsCollection = client.db('usedCloth').collection('products');
        const categoriesCollection = client.db('usedCloth').collection('category');
        const usersCollection = client.db('usedCloth').collection('users');
        const bookingsCollection = client.db('usedCloth').collection('bookings');
        const paymentsCollection = client.db('usedCloth').collection('payments');
        const reviewsCollection = client.db('usedCloth').collection('reviews');

        //  verifyAdmin
        const verifyAdmin = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);
            if (user?.role !== 'Admin') {
                return res.status(403).send({ message: 'Forbidden Access' })
            }
            next();
        }


        // verifySeller
        //    const verifySeller = async (req, res, next) => {
        //     const decodedEmail = req.decoded.email;
        //     const query = { email: decodedEmail };
        //     const user = await usersCollection.findOne(query);
        //     if (user?.role !== 'Seller') {
        //         return res.status(403).send({ message: 'Forbidden Access' })
        //     }
        //     next();
        // }

        // JWT verification api
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

        // Products get api
        app.get('/products', async (req, res) => {
            const query = {};
            const product = await productsCollection.find(query).toArray();
            res.send(product);
        })
        app.get('/reviews', async (req, res) => {
            const query = {};
            const review = await reviewsCollection.find(query).toArray();
            res.send(review);
        })
        app.get('/bookings',verifyJWT, async (req, res) => {
            const query = {};
            const booking = await bookingsCollection.find(query).toArray();
            res.send(booking);
        })

        app.get('/myProducts', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'Forbidden Access' })
            }
            const query = { email: email };
            const myProducts = await productsCollection.find(query).toArray();
            res.send(myProducts);

        })

        app.get('/myBookings', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'Forbidden Access' })
            }
            const query = { email: email };
            const myBookings = await bookingsCollection.find(query).toArray();
            res.send(myBookings);

        })

        // Products get api
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await productsCollection.findOne(filter);
            res.send(result);
        })

        // Reported products api

        app.get('/reported', verifyJWT, async (req, res) => {
            const query = { report: "reported" }
            const product = await productsCollection.find(query).toArray();
            res.send(product);
        })

        app.get('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const booking = await bookingsCollection.findOne(query);
            res.send(booking);

        })


        // Categories get api
        app.get('/categories', async (req, res) => {
            const query = {};
            const category = await categoriesCollection.find(query).toArray();
            res.send(category);
        })

        // All users api
        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        })

        // Products get api according to category
        app.get('/categories/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const category = await categoriesCollection.findOne(filter);
            const query = { category: category.category };
            const result = await productsCollection.find(query).toArray();
            res.send(result);
        })

        // Check login user api
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollection.findOne(query);
            res.send(user);
        })

        // All Buyers api
        app.get('/buyerUser', verifyJWT, /* verifyAdmin, */ async (req, res) => {
            const query = { role: "Buyer" }
            const user = await usersCollection.find(query).toArray();
            res.send(user);
        })

        // All Sellers api
        app.get('/sellerUser', verifyJWT, /* verifyAdmin, */ async (req, res) => {
            const query = { role: "Seller" }
            const user = await usersCollection.find(query).toArray();
            res.send(user);
        })
        app.get('/advertised', async (req, res) => {
            const query = { advertise: 'advertised' }
            const user = await productsCollection.find(query).toArray();
            res.send(user);
        })

        app.get('/sellerUser/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const email = await usersCollection.findOne(filter);
            const query = { email: email.email };
            const result = await productsCollection.findOne(query);
            res.send(result);
        })


        // Verified seller display
        app.get('/userEmail', async (req, res) => {
            const userEmail = req.query.email;
            const query = { email: userEmail };
            const result = await usersCollection.find(query).toArray();
            res.send(result)
        })

        // Check admin api
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'Admin' });
        })

        // Check seller api
        app.get('/usersSellers/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollection.findOne(query);
            res.send({ isSeller: user?.role === 'Seller' });
        })

        // Check buyer api
        app.get('/usersBuyers/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollection.findOne(query);
            res.send({ isBuyer: user?.role === 'Buyer' });
        })

        app.post('/products', async (req, res) => {
            const products = req.body;
            const result = await productsCollection.insertOne(products);
            res.send(result);

        });
        app.post('/reviews', async (req, res) => {
            const reviews = req.body;
            const result = await reviewsCollection.insertOne(reviews);
            res.send(result);

        });

        // bookings
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            // console.log(booking);
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        })



        // User post api
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);

        });


        // Payment
        app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body;
            const price = booking.originalPrice.split("tk").join('');
            console.log(price)
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            // console.log(paymentIntent);
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const id = payment.bookingId;
            const filter = { _id: ObjectId(id) };
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updateResult = await bookingsCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })


        app.put('/reportedProducts/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    report: 'reported'
                }
            }
            const result = await productsCollection.updateOne(filter, updatedDoc, options);
            res.send(result)
        })



        // Seller verification api
        app.put('/users/Sellers/:id', verifyJWT, /* verifyAdmin, */ async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    verification: 'verified'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result)
        })

        // payment put
        app.put('/products/:id', verifyJWT, async (req, res) => {

            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    status: 'paid'
                }
            }
            const result = await productsCollection.updateOne(filter, updatedDoc, options);
            res.send(result)
        })
        app.put('/advertised/:id', verifyJWT, async (req, res) => {

            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    advertise: 'advertised'
                }
            }
            const result = await productsCollection.updateOne(filter, updatedDoc, options);
            res.send(result)
        })


        // Delete product api
        app.delete('/products/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const result = await productsCollection.deleteOne(filter);
            res.send(result);
        })
        // Delete seller api
        app.delete('/users/:id', verifyJWT, /* verifyAdmin, */  async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
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