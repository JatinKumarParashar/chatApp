const express = require("express");
const app = express();
const { Server } = require("socket.io");

// Dotenv
const dotenv=require('dotenv');
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
  // For New User in Room(Live User)
  socket.on("new-user-join", async (obj) => {
    users[socket.id] = obj;

    try {
      const userExist = await User.findOne({ where: { email: obj.email } });
      if (userExist) {
        // Send to all user in root except current requested user.
        socket.broadcast.emit("user-joined", obj.name);

        try {
          const oldMessage = await Message.findAll({ include: [User] });

          // Sending old messages to requested user.
          io.to(socket.id).emit("oldMessages", oldMessage);
        } catch (err) {
          console.log(err, "User Joined Error ----------- ");
          io.to(socket.id).emit('error',err);
        }
      } else {
        try {
          const create = await User.create({
            username: obj.name,
            email: obj.email,
          });
          socket.broadcast.emit("user-joined", obj.name);
          try {
            const oldMessage = await Message.findAll({ include: [User] });

            io.to(socket.id).emit("oldMessages", oldMessage);
          } catch (err) {
            console.log(err, "User Joined Error ----------- ");
            io.to(socket.id).emit('error',err);
          }
        } catch (err) {
          console.log(err);
          io.to(socket.id).emit('error',err);
        }
      }
    } catch (err) {
      console.log(err);
      io.to(socket.id).emit('error',err);
    }
  });

  socket.on("send", async (message) => {
    try {
      const fatchingUser = await User.findOne({
        where: { email: users[socket.id].email },
      });

      const messageStore = await Message.create({
        message: message,
        userId: fatchingUser.dataValues.id,
      });

      if (messageStore) {
        socket.broadcast.emit("receive", {
          message: message,
          name: fatchingUser.dataValues.username,
        });
      }
    } catch (err) {
      console.log(err);
      io.to(socket.id).emit('error',err);
    }
  });

  socket.on("disconnect", (user) => {
    socket.broadcast.emit("left", { data: users[socket.id] });
    delete users[socket.id];
  });
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
