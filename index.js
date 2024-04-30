import express from "express";
// import router from "./routes/quotes.js";
import cors from "cors";
import morgan from "morgan";
const server = express();
const PORT = process.env.PORT || '3000'
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import WebSocket, { WebSocketServer } from 'ws';
dotenv.config()

server.use(morgan("tiny"))
server.use(express.json());
server.use(cors());




server.get('/', (req, res) => {
    res.send("{ message: 'LANGUAGE BACKEND WORKING!' }");
  });

const httpServer = server.listen(PORT, () => console.log(`Server is running on port http://localhost:${PORT}`))
const websock = new WebSocketServer({server: httpServer}) 

const rooms = new Map();

websock.on( "connection", (websock) => {
    console.log("New Client connected")
    websock.send("Welcome Friend!")
    websock.on("message", (data) => {
        const { type, room, message } = JSON.parse(data);
        switch (type) {
            case "join":
                // Add client to the room
                websock.room = room;
                if (!rooms.has(room)) {
                    websock.send(`You have created a new chatroom: ${room}`)
                    rooms.set(room, new Set());
                }
                websock.send(`You have joined chatroom: ${room}`)

                rooms.get(room).add(websock);
                break;
            case "message":
                // Broadcast message to all clients in the room
                if (websock.room && rooms.has(websock.room)) {
                    rooms.get(websock.room).forEach((client) => {
                        if (client !== websock && client.readyState === WebSocket.OPEN) {
                            client.send(message);
                        }
                    });
                }
                break;
        }
    });

    websock.on("close", () => {
        if (websock.room && rooms.has(websock.room)) {
            rooms.get(websock.room).delete(websock);
        }
        console.log("Client disconnected");
    });
})
