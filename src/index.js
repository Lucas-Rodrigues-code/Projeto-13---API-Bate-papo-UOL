import express, { json } from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dayjs from 'dayjs';
import joi from 'joi';
import dotenv from 'dotenv';

dotenv.config();

const participantsSchema = joi.object({
    name: joi.string().required()
});

const messagesSchema = joi.object({
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.valid('message').valid('private_message').required(),

});

//Config
const app = express();
app.use(cors());
app.use(json());

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

try {
    await mongoClient.connect();
    db = mongoClient.db("uol");
} catch (err) {
    console.log(err);
}

app.post('/participants', async (req, res) => {

    const {name} = req.body

    const validation = participantsSchema.validate(req.body, { abortEarly: false });

    if (validation.error) {
        const erros = validation.error.details.map((detail) => detail.message);
        res.status(422).send(erros);
        return;
    }

    if (await db.collection('participantes').findOne({name: name})) {
        res.status(409).send({message: 'Usuário já existe'});
        return;
    } 

    try {
        await db.collection("participantes").insertOne({
            name,
            lastStatus: Date.now()
        });

        await db.collection("mensagens").insert({
            from: name,
            to: 'Todos',
            text: 'entra na sala...',
            type: 'status',
            time: dayjs().format('HH:MM:ss')
        });
        res.status(201).send("Usúario criado com sucesso!");
    } catch (err) {
        res.status(500).send(err);
    }

})

app.get('/participants', async (req, res) => {

    try {
        const participantes = await db.collection("participantes").find().toArray();
        res.send(participantes);
    } catch (err) {
        res.sendStatus(500)
    }

})

app.post('/messages', async (req, res) => {

    const { to, text, type } = req.body

    const { user } = req.headers

    const usuarioValidar = await db.collection('participantes').findOne({ name: user });

    if (!usuarioValidar) {
        res.sendStatus(404)
        return;
    }; 

    const validation = messagesSchema.validate(req.body, { abortEarly: false });

    if (validation.error) {
        const erros = validation.error.details.map((detail) => detail.message);
        res.status(422).send(erros);
        return;
    }


    try {
        await db.collection("mensagens").insert({
            from: user,
            to: to,
            text: text,
            type: type,
            time: dayjs().format('HH:MM:ss')
        });
        res.send(201);
    } catch (err) {
        res.sendStatus(500)
    }






})

app.get('/messages', async (req, res) => {
    const limit = parseInt(req.query.limit);
    const user = req.headers.user;

    try {
        const messages = await db.collection("mensagens").find().toArray();
        const lastMessages = messages.filter((message) => {
            return (
                message.type === "message" ||
                message.type === "status" ||
                message.to === user ||
                message.from === user
            );
        });
        if (limit > 0) {
            res.send(lastMessages.slice(-limit));
            return;
        }
        res.send(lastMessages);
    } catch (error) {
        res.status(500).send(error);
    }


})

app.post('/status', async (req, res) => {
    const { user } = req.headers

    const UsuarioValidar = await db.collection('participantes').findOne({ name: user });

    if (!UsuarioValidar) {
        res.sendStatus(404)
        return;
    };

    try {
        res.sendStatus(200);

        const userOn = { name: user };
        const attUser = { $set: { lastStatus: Date.now() } };

        await db.collection('participantes').updateOne(userOn, attUser);

    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }

})

setInterval(async () => {
    const participantes = await db.collection('participantes').find().toArray();
    const participantesOffline = participantes.filter(participant => participant.lastStatus < (Date.now() - 10000));

    try {
        await db.collection('participantes').deleteMany({ lastStatus: { $lt: (Date.now() - 10000) } });

        participantesOffline.forEach(async (participant) => {
            await db.collection('messages').insertOne({
                from: participant.name,
                to: 'Todos',
                text: 'sai da sala...',
                type: 'status',
                time: dayjs().format('HH:mm:ss')
            });
        });

    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
}, 15000);

app.listen(5000, () => console.log("Running in port: 5000"))


