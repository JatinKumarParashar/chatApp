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

// Models
const User = require("./models/user");
const Message = require("./models/message");

// Current Connected Users
const users = {};

// Socket IO Code for Connection and Message Sending System
io.on("connection", async (socket) => {
  try {
    socket.on("new-user-join", async (obj) => {
      users[socket.id] = obj;

      const userExist = await User.findOne({ where: { email: obj.email } });
      if (userExist) {
        // Send to all user in root except current requested user.
        socket.broadcast.emit("user-joined", obj.name);

        const oldMessage = await Message.findAll({ include: [User] });

        // Sending old messages to requested user.
        io.to(socket.id).emit("oldMessages", oldMessage);
      } else {
        const create = await User.create({
          username: obj.name,
          email: obj.email,
        });
        if (create) {
          socket.broadcast.emit("user-joined", obj.name);

          const oldMessage = await Message.findAll({ include: [User] });
          // Sending old messages to requested user.
          io.to(socket.id).emit("oldMessages", oldMessage);
        } else {
          throw "Error in user creating";
        }
      }
    });
    // Receive message from user
    socket.on("send", async (message) => {
      const fatchingUser = await User.findOne({
        where: { email: users[socket.id].email },
      });
      if (fatchingUser) {
        //store new message into database
        const messageStore = await Message.create({
          message: message,
          userId: fatchingUser.dataValues.id,
        });

        if (messageStore) {
          //Sending message to user
          socket.broadcast.emit("receive", {
            message: message,
            name: fatchingUser.dataValues.username,
          });
        } else {
          throw "Message can not store in database";
        }
      } else {
        throw "can not send message";
      }
    });
    //Disconnect user
    socket.on("disconnect", (user) => {
      socket.broadcast.emit("left", { data: users[socket.id] });
      delete users[socket.id];
    });
  } catch (err) {
    io.to(socket.id).emit("error", err);
  }
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
