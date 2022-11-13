import express, { json } from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dayjs from 'dayjs';
import joi from 'joi';


const participantsSchema = joi.object({
    name: joi.string().required()
});

const messagesSchema = joi.object({
    to: joi.string().required(),
    text: joi.string().required(),
    type: 
  });

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


    const validation = participantsSchema.validate(req.body, { abortEarly: false });

    if (validation.error) {
        const erros = validation.error.details.map((detail) => detail.message);
        res.status(422).send(erros);
        return;
    }

    try {
        if (name === await db.collection("participantes").find({ name: name }).toArray()) {
            res.sendStatus(409)
            return;
        }
    } catch (err) {
        console.log(err)
    }


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

app.get('/participants', async (rq, res) => {

    try {
        const participantes = await db.collection("participantes").find().toArray();
        res.send(participantes);
    } catch (err) {
        res.sendStatus(500)
    }

})

app.post('/messages', async (req, res) => {

    const { to, text, type } = req.body

    const { user } = req.header

 

})

app.listen(5000, () => console.log("Running in port: 5000"))


