import express, { json } from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dayjs from 'dayjs'

//Config
const app = express();
app.use(cors());
app.use(json());

const mongoClient = new MongoClient("mongodb://localhost:27017");
let db;

try {
    await mongoClient.connect();
    db = mongoClient.db("uol");
} catch (err) {
    console.log(err);
}




app.post('/participants', async (req, res) => {
    const { name } = req.body

    try {
        await db.collection("participantes").insert({
            name,
            lastStatus: Date.now()
        });
        res.status(201).send("Usúario criado com sucesso!");
    } catch (err) {
        res.status(500).send(err);
    }

    try {
        await db.collection("mensagens").insert({
            from: name,
            to: 'Todos',
            text: 'entra na sala...',
            type: 'status',
            time: dayjs().format('HH:MM:SS')
        });
        res.status(201);
    } catch (err) {
        res.status(500).send(err);
    }
})

app.get('/participants', async(rq, res)=>{

    try{
        const participantes = await db.collection("participantes").find().toArray();
        res.send(receitas);
    } catch (err){
        res.sendStatus(500)
    }

})

app.listen(5000, () => console.log("Running in port: 5000"))


