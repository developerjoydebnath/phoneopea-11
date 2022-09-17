const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const verifyJWT = (req, res, next) => {
    // console.log(req?.headers?.authorization)
    const authHeader = req?.headers?.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    const token = authHeader.split(' ')[1]
    // console.log(token)
    jwt.verify(token, process.env.SECRET_PRIVET_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        // console.log(decoded)
        req.decoded = decoded;
        next();
    })
}




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xwuxkhj.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        await client.connect();
        const phonesCollection = client.db("warehouse").collection("phones");
        const reviewCollection = client.db("warehouse").collection("review");

        // load all data
        app.get("/allPhone", async (req, res)=> {
            const query = {};
            const cursor = phonesCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        // load all data for pagination
        app.get("/phones", async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            const query = {};
            const phones = phonesCollection.find(query);

            let result;
            if(page || size){
                result = await phones.skip(page * size).limit(size).toArray();
            }
            else{
                result = await phones.toArray();
            }
            res.send(result);
        });

        // load short data from database
        app.get("/shortPhones", async (req, res) => {
            // const shortResult = phonesCollection.find({}).limit(6);
            const shortResult = phonesCollection.aggregate([{ $sample: { size: 6 } }])
            const result = await shortResult.toArray();
            res.send(result);
        })

        // load search data by name
        app.get("/searchResult", async (req, res) => {
            const query = req.query.search;
            const queryAll = {}
            const cursor = phonesCollection.find(queryAll);
            const result = await cursor.toArray();
            const matched = result.filter(name => name.name.toLowerCase().includes(query));
            res.send(matched);
        })

        // load a single data by id
        app.get("/phoneDetails", async (req, res) => {
            const id = req.query.id;
            const query = { _id: ObjectId(id) };
            const result = await phonesCollection.findOne(query);
            res.send(result)
        })

        // update restock quantity of a phone 
        app.put("/restockItem", async (req, res) => {
            const id = req.query.id;
            const updateUser = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true }
            const updateDoc = {
                $set: {
                    quantity: updateUser.quantity
                }
            };
            const result = await phonesCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })


        // update delivered quantity of a phone 
        app.put("/deliveredItem", async (req, res) => {
            const id = req.query.id;
            const updateUser = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true }
            const updateDoc = {
                $set: {
                    quantity: updateUser.quantity
                }
            };
            const result = await phonesCollection.updateOne(filter, updateDoc, options);
            // console.log(result)
            res.send(result);
        })

        // add a new item to database 
        app.post("/addPhone", async (req, res) => {
            const phone = req.body;
            const result = await phonesCollection.insertOne(phone);
            res.send(result)
        })

        //find items by user email address
        app.get("/myInventory", verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.userEmail;
            const userEmail = req.query.email;
            if (decodedEmail === userEmail) {
                const query = { email: { $in: [userEmail] } };
                const cursor = phonesCollection.find(query);
                const result = await cursor.toArray();
                res.send(result);
            }
            else {
                res.status(403).send({ message: 'Forbidden access' })
            }
        })

        // delete item from database
        app.delete("/deleteItem", async (req, res) => {
            const id = req.query.id;
            // console.log(id)
            const query = { _id: ObjectId(id) };
            const result = await phonesCollection.deleteOne(query);
            res.send(result);
        })

        app.post("/login", async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.SECRET_PRIVET_TOKEN, {
                expiresIn: '1d'
            })
            res.send({ accessToken });
        })

        // product count 
        app.get("/productCount", async(req, res)=> {
            const count = await phonesCollection.estimatedDocumentCount();
            res.send({count});
        })

        // load all review data 
        app.get("/review", async (req, res)=> {
            const query = {};
            const cursor = reviewCollection.find(query).sort({_id:-1}).limit(10);
            const result = await cursor.toArray();
            res.send(result);
        });

        // add new review 
        app.post("/addReview", async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.send(result)
        })

    }
    finally {
        // await client.close();
    }
}
run().catch(console.dir);


app.get("/", async (req, res) => {
    res.send('assignment server is running!!!');
});

app.listen(port, () => {
    console.log('server is running at port :', port);
});