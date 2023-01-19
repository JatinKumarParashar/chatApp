const express = require("express");
const app = express();
const { Server } = require("socket.io");

// Dotenv
const dotenv = require("dotenv");
dotenv.config();

// Database
const sequelize = require("./util/database");

// Express Server
const http = require("http").createServer(app);

// Websocket Server Initialization
const io = new Server(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POSt"],
  },
});

const { userConnection, receiveMessage, userDisconnect } = require("./sockets");

// Models
const User = require("./models/user");
const Message = require("./models/message");

// Current Connected Users
const users = {};

// Socket IO Code for Connection and Message Sending System
io.on("connection", async (socket) => {
  userConnection(io, socket, users);
  receiveMessage(io, socket, users);
  userDisconnect(io, socket, users);
});

// Database sync and server listen port
sequelize.sync().then(() => {
  // Models Relationship
  User.hasMany(Message, {
    onDelete: "CASCADE",
  });
  Message.belongsTo(User);

  http.listen(4000, () => {
    console.log("listening on *:4000");
  });
});
