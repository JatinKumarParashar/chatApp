const User = require("./models/user");
const Message = require("./models/message");

exports.userConnection = (io, socket, users) => {
  const connectionHandler = async (obj) => {
    users[socket.id] = obj;
    try {
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
    } catch (err) {
      io.to(socket.id).emit("error", err);
    }
  };
  socket.on("new-user-join", connectionHandler);
};

exports.receiveMessage = (io, socket, users) => {
  const receiveHandler = async (message) => {
    try {
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
    } catch (err) {
      io.to(socket.id).emit("error", err);
    }
  };
  socket.on("send", receiveHandler);
};

exports.userDisconnect = (io, socket, users) => {
  try {
    socket.on("disconnect", (user) => {
      socket.broadcast.emit("left", { data: users[socket.id] });
      delete users[socket.id];
    });
  } catch (err) {
    io.to(socket.id).emit("error", err);
  }
};
