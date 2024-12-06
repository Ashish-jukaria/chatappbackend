import { WebSocketServer, WebSocket } from "ws";
import express, { Request, Response } from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { RoomsModel, UserModel } from "./db";
import { SECRET_KEY, Auth, CustomRequest } from "./auth";
import { generateroomId } from "./utils";
import cors from 'cors'
import http from 'http';
const app = express();
const PORT = 3000;
const server = http.createServer(app);
import dotenv from 'dotenv'
dotenv.config()
if (process.env.MONGO_KEY){
  mongoose.connect(process.env.MONGO_KEY);

}
app.use(express.json());
app.use(cors())

app.post("/register", async (req: Request, res: Response) => {
  try {
    const username = req.body.username;
    const password = req.body.password;

    if (username && password) {
      const response = await UserModel.create({
        username,
        password,
      });

      res.status(200).send("User Registerd");
    }
    else{
      res.status(400).send("Username and Password are required.");

    }
  } catch (e) {
    res.status(400).send("Error");
  }
});

app.post("/login", async (req, res) => {
  try {
    const username = req.body.username;
    const password = req.body.password;
    const is_user = await UserModel.find({
      username: username,
      password: password,
    });
    if (is_user) {
      const token = jwt.sign(username, SECRET_KEY);
      res.status(200).send(token);
    }
    else{
      res.status(400).send('No user')
    }
  } catch (e) {
    res.status(400).send("Error");
  }
});

app.get("/userdata", Auth, (req: CustomRequest, res: Response) => {
  try {
    const username = req.username;
    res.status(200).send({
      username: username,
    });
  } catch (e) {
    res.status(400).send("Error");
  }
});

app.post("/createroom", Auth, async (req: CustomRequest, res: Response) => {
  try {
    const roomName = req.body.roomName;
    const user = req.username;
    const owner = user;
    const roomID = await generateroomId();

    const response = await RoomsModel.create({
      roomName: roomName,
      roomId: roomID,
      owner: owner,
      users: [owner],
    });
    res.status(200).send(roomID);
  } catch (e) {
    res.status(400).send("Error");
  }
});

app.post("/joinroom", Auth, async (req: CustomRequest, res: Response) => {
  try {
    const roomId = req.body.roomID;
    const user = req.username;

    await RoomsModel.findOneAndUpdate({roomId:roomId}, {
      $push: { users: user },
    });
    res.status(200).send("User Joined the room");
  } catch (e) {
    console.log(e)
    res.status(400).send("Error");
  }
});

app.post("/message", Auth, async (req: CustomRequest, res: Response) => {
  try {
    const roomId = req.body.roomId;
    const user = req.username;
    const message = req.body.message;
    await RoomsModel.findOneAndUpdate({roomId:roomId}, {
      $push: {
        chats: {
          user: user,
          message: message,
        },
      },
    });

    res.status(200).send("Message Send");
  } catch (e) {
    res.status(400).send("Error");
  }
});

app.get("/roomdata/:roomId", Auth, async (req: CustomRequest, res: Response) => {
  try {
    const {roomId} = req.params;
    const data = await RoomsModel.findOne({ roomId: roomId });
    res.status(200).send(data);
  } catch (e) {
    res.status(400).send("Error");
  }
});

app.get("/available", Auth, async (req: CustomRequest, res: Response) => {
  try {
    const allroom = await RoomsModel.find();
    res.status(200).send(allroom);
  } catch (e) {
    console.log(e)
    res.status(400).send("error");
  }
});


const ws = new WebSocketServer({server});
interface Room {
  [roomId: string]: WebSocket[];
}
const rooms: Room = {};
ws.on("connection", (socket) => {
  socket.send("Socket Connected");

  //message
  socket.on("message", (message: string) => {
    try {
      const {
        type,
        payload,
      }: { type: string; payload: { [key: string]: string } } =
        JSON.parse(message);

      if (type == "join") {
        if (!rooms[payload.roomId]) {
          rooms[payload.roomId] = [];
        }
      if (!rooms[payload.roomId].includes(socket)) {
        rooms[payload.roomId].push(socket);
        console.log(`Socket joined room: ${payload.roomId}`);
      } else {
        console.log(`Socket already in room: ${payload.roomId}`);
      }
      }
      
      if (type == "chat") {
              rooms[payload.roomId].forEach((client) => {
                console.log(payload.message)
                client.send(
                  JSON.stringify({
                    type: "message",
                    payload: {
                      user:payload.user,
                      message: payload.message,
                    },
                  })
                );
              });
            
        
      }
    console.log(rooms)} catch (e) {
      console.log("error");
    }
  });

  socket.on("close", () => {
    console.log(`Socket disconnected`);

    // Remove socket from all rooms
    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter((client) => client !== socket);

    }

    console.log("Updated rooms:", rooms);



});

});

server.listen(PORT, () => {
  console.log("server running");
});
