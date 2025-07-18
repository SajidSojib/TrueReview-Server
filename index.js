const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 9000;

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

async function run() {
  try {
    await client.connect();

    const serviceCollection = client.db('trueReview').collection('services');
    const reviewCollection = client.db('trueReview').collection('reviews');

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );



    app.get('/services', async (req, res) => {
        const { email } = req.query;
        const query = email ? { email: email } : {};
        const result = await serviceCollection.find(query).toArray();
        res.send(result);
    })

    app.get('/services/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await serviceCollection.findOne(query);
        res.send(result);
    })

    app.post('/services', async (req, res) => {
        const post = req.body;
        const result = await serviceCollection.insertOne(post);
        res.send(result);
    })

    app.put('/services/:id', async (req, res) => {
        const id = req.params.id;
        const updatedService = req.body;
        const query = { _id: new ObjectId(id) }
        const updatedDoc = {
            $set: {updatedService}
        }
        const result = await serviceCollection.updateOne(query, updatedDoc);
        res.send(result);
    })

    app.delete('/services/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await serviceCollection.deleteOne(query);
        res.send(result);
    })

    app.get('/reviews', async (req, res) => {
        const { email } = req.query;
        const query = email ? { email: email } : {};
        const result = await reviewCollection.find(query).toArray();
        console.log(query);

        res.send(result);
    })

    app.get('/reviews/:id', async (req, res) => {
        const id = req.params.id;
        const query = { serviceId: id }
        const result = await reviewCollection.find(query).toArray();
        res.send(result);
    })

    app.post('/reviews', async (req, res) => {
        const post = req.body;
        const result = await reviewCollection.insertOne(post);
        res.send(result);
    })

    app.patch('/reviews/:id', async (req, res) => {
        const id = req.params.id;
        const updatedReview = req.body;
        const query = { _id: new ObjectId(id) }
        const updatedDoc = {
            $set: {updatedReview}
        }
        const result = await reviewCollection.updateOne(query, updatedDoc);
        res.send(result);
    })

    app.delete('/reviews/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await reviewCollection.deleteOne(query);
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