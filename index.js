require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 9000;
const admin = require("firebase-admin");
const serviceAccount = require("./firebase-admin-key.json");
const { getAuth } = require('firebase-admin/auth');

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('hellow from true review server');
})


const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.r8enovj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});


const verifyTokenEmail = (req, res, next) => {
    if(req?.query?.email) {
      if (req.decoded.email !== req.query.email) {
          return res.status(403).send({ error: true, message: 'forbidden access' })
      }
    }
    next();
}

const verifyFirebaseToken = async (req, res, next) => {
    if(req?.query?.email || req.method !== 'GET') {
        const authorization = req.headers.authorization;
        if (!authorization || !authorization.startsWith("Bearer ")) {
          return res
            .status(401)
            .send({ error: true, message: "unauthorized access" });
        }
        const token = authorization.split(" ")[1];
        try {
          const decoded = await admin.auth().verifyIdToken(token);
          req.decoded = decoded;
          next();
        } catch (error) {
          return res
            .status(401)
            .send({ error: true, message: "unauthorized access" });
        }
    } else {
        next();
    }
}

async function run() {
  try {
    // await client.connect();

    const serviceCollection = client.db('trueReview').collection('services');
    const reviewCollection = client.db('trueReview').collection('reviews');

    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );



    app.get('/services', verifyFirebaseToken, verifyTokenEmail, async (req, res) => {
        const { email } = req.query;
        const { search } = req.query;
        const {filterParam} = req.query;

        let query = {};
        if (email) {
            query = { email: email }
        }
        if (search) {
            query = {
                $or: [
                  { title: { $regex: search, $options: "i" } },
                  { category: { $regex: search, $options: "i" } },
                  { company: { $regex: search, $options: "i" } },
                  { price: { $regex: search, $options: "i" } },
                ],
        }
        };
        if (filterParam) {
            query = { category: filterParam }
        }
        const result = await serviceCollection.find(query).toArray();
        res.send(result);
    })

    app.get('/services/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await serviceCollection.findOne(query);
        res.send(result);
    })

    app.post('/services', verifyFirebaseToken, async (req, res) => {
        const post = req.body;
        const result = await serviceCollection.insertOne(post);
        res.send(result);
    })

    app.put('/services/:id', verifyFirebaseToken, async (req, res) => {
        const id = req.params.id;
        const updatedService = req.body;
        const query = { _id: new ObjectId(id) }
        const updatedDoc = {
            $set: {updatedService}
        }
        const result = await serviceCollection.updateOne(query, updatedDoc);
        res.send(result);
    })

    app.delete('/services/:id', verifyFirebaseToken, async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await serviceCollection.deleteOne(query);
        res.send(result);
    })

    app.get('/limitedServices', async (req, res) => {
        const result = await serviceCollection.find().limit(6).toArray();
        res.send(result);
    })

    app.get('/reviews', verifyFirebaseToken, verifyTokenEmail, async (req, res) => {
        const { email } = req.query;
        const query = email ? { email: email } : {};
        const result = await reviewCollection.find(query).toArray();

        res.send(result);
    })

    app.get('/reviews/:id', async (req, res) => {
        const id = req.params.id;
        const query = { serviceId: id }
        const result = await reviewCollection.find(query).toArray();
        res.send(result);
    })

    app.post('/reviews', verifyFirebaseToken, async (req, res) => {
        const post = req.body;
        const result = await reviewCollection.insertOne(post);
        res.send(result);
    })

    app.patch('/reviews/:id', verifyFirebaseToken, async (req, res) => {
        const id = req.params.id;
        const updatedReview = req.body;
        const query = { _id: new ObjectId(id) }
        const updatedDoc = {
            $set: {updatedReview}
        }
        const result = await reviewCollection.updateOne(query, updatedDoc);
        res.send(result);
    })

    app.delete('/reviews/:id', verifyFirebaseToken, async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await reviewCollection.deleteOne(query);
        res.send(result);
    })

    app.get('/count', async (req, res) => {
        const serviceCount = await serviceCollection.estimatedDocumentCount();
        const reviewCount = await reviewCollection.estimatedDocumentCount();
        let count = 0;
        const listAllUsers = async (nextPageToken) => {
          // List batch of users, 1000 at a time.
          await getAuth()
            .listUsers(1000, nextPageToken)
            .then(async (listUsersResult) => {
              listUsersResult.users.forEach((userRecord) => {
                count++;
              });
              if (listUsersResult.pageToken) {
                // List next batch of users.
                await listAllUsers(listUsersResult.pageToken);
              }
            })
            .catch((error) => {
              console.log("Error listing users:", error);
            });
          return count;
        };

        // Start listing users from the beginning, 1000 at a time.
        const userCount = await listAllUsers();

        const result = {serviceCount, reviewCount, userCount};
        res.send(result);
    })

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log(`listening to port ${port}`);
})