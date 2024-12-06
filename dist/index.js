"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("./db");
const auth_1 = require("./auth");
const utils_1 = require("./utils");
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const app = (0, express_1.default)();
const PORT = 3000;
const server = http_1.default.createServer(app);
mongoose_1.default.connect("mongodb+srv://mjukaria9:F04D5sFWdoWIw95f@cluster0.qzrot.mongodb.net/chatapp");
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const username = req.body.username;
        const password = req.body.password;
        if (username && password) {
            const response = yield db_1.UserModel.create({
                username,
                password,
            });
            res.status(200).send("User Registerd");
        }
        else {
            res.status(400).send("Username and Password are required.");
        }
    }
    catch (e) {
        res.status(400).send("Error");
    }
}));
app.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const username = req.body.username;
        const password = req.body.password;
        const is_user = yield db_1.UserModel.find({
            username: username,
            password: password,
        });
        if (is_user) {
            const token = jsonwebtoken_1.default.sign(username, auth_1.SECRET_KEY);
            res.status(200).send(token);
        }
        else {
            res.status(400).send('No user');
        }
    }
    catch (e) {
        res.status(400).send("Error");
    }
}));
app.get("/userdata", auth_1.Auth, (req, res) => {
    try {
        const username = req.username;
        res.status(200).send({
            username: username,
        });
    }
    catch (e) {
        res.status(400).send("Error");
    }
});
app.post("/createroom", auth_1.Auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const roomName = req.body.roomName;
        const user = req.username;
        const owner = user;
        const roomID = yield (0, utils_1.generateroomId)();
        const response = yield db_1.RoomsModel.create({
            roomName: roomName,
            roomId: roomID,
            owner: owner,
            users: [owner],
        });
        res.status(200).send(roomID);
    }
    catch (e) {
        res.status(400).send("Error");
    }
}));
app.post("/joinroom", auth_1.Auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const roomId = req.body.roomID;
        const user = req.username;
        yield db_1.RoomsModel.findOneAndUpdate({ roomId: roomId }, {
            $push: { users: user },
        });
        res.status(200).send("User Joined the room");
    }
    catch (e) {
        console.log(e);
        res.status(400).send("Error");
    }
}));
app.post("/message", auth_1.Auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const roomId = req.body.roomId;
        const user = req.username;
        const message = req.body.message;
        yield db_1.RoomsModel.findOneAndUpdate({ roomId: roomId }, {
            $push: {
                chats: {
                    user: user,
                    message: message,
                },
            },
        });
        res.status(200).send("Message Send");
    }
    catch (e) {
        res.status(400).send("Error");
    }
}));
app.get("/roomdata/:roomId", auth_1.Auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roomId } = req.params;
        const data = yield db_1.RoomsModel.findOne({ roomId: roomId });
        res.status(200).send(data);
    }
    catch (e) {
        res.status(400).send("Error");
    }
}));
app.get("/available", auth_1.Auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const allroom = yield db_1.RoomsModel.find();
        res.status(200).send(allroom);
    }
    catch (e) {
        console.log(e);
        res.status(400).send("error");
    }
}));
const ws = new ws_1.WebSocketServer({ server });
const rooms = {};
ws.on("connection", (socket) => {
    socket.send("Socket Connected");
    //message
    socket.on("message", (message) => {
        try {
            const { type, payload, } = JSON.parse(message);
            if (type == "join") {
                if (!rooms[payload.roomId]) {
                    rooms[payload.roomId] = [];
                }
                if (!rooms[payload.roomId].includes(socket)) {
                    rooms[payload.roomId].push(socket);
                    console.log(`Socket joined room: ${payload.roomId}`);
                }
                else {
                    console.log(`Socket already in room: ${payload.roomId}`);
                }
            }
            if (type == "chat") {
                rooms[payload.roomId].forEach((client) => {
                    console.log(payload.message);
                    client.send(JSON.stringify({
                        type: "message",
                        payload: {
                            user: payload.user,
                            message: payload.message,
                        },
                    }));
                });
            }
            console.log(rooms);
        }
        catch (e) {
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
