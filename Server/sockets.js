const User = require("./models/user");
const Message = require("./models/message");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Generate jsonwebtoken for user
function generateAccessToken(id) {
  return jwt.sign(
    {
      user: id,
    },
    process.env.SCREATE_KEY_FOR_TOKEN
  );
}

// New user signup
exports.newUserSignup = async (io, socket, users) => {
  const signupHandler = (obj) => {
    try {
      // Encrypt the password
      bcrypt.hash(obj.password, 10, async (err, hash) => {
        const createUser = await User.create({
          username: obj.username,
          email: obj.email,
          password: hash,
        });
        if (createUser) {
          io.to(socket.id).emit("signupSuccess", "signup Successfully");
        } else {
          throw "Unable to create user";
        }
      });
    } catch (err) {
      io.to(socket.id).emit("error", err);
    }
  };
  socket.on("signup", signupHandler);
};

// Login user
exports.userConnection = async (io, socket, users) => {
  const connectionHandler = async (obj) => {
    users[socket.id] = obj;
    try {
      const userExist = await User.findOne({ where: { email: obj.email } });
      users[socket.id] = userExist.dataValues;
      if (userExist) {
        // Compare user password
        bcrypt.compare(
          obj.password,
          userExist.dataValues.password,
          async (err, result) => {
            if (result == true) {
              socket.broadcast.emit(
                "user-joined",
                userExist.dataValues.username
              );

              const oldMessage = await Message.findAll({ include: [User] });

              // Sending old messages to requested user.
              io.to(socket.id).emit("loginSuccess", {
                oldMessage: oldMessage,
                // Send login token
                token: generateAccessToken(userExist.dataValues.id),
              });
            } else {
              throw "password incorrect";
            }
          }
        );
      } else {
        throw "user does not exist";
      }
    } catch (err) {
      // Send Error to User
      io.to(socket.id).emit("error", err);
    }
  };
  socket.on("new-user-join", connectionHandler);
};

exports.receiveMessage = (io, socket, users) => {
  const receiveHandler = async (obj) => {
    try {
      // Verify user token
      const userId = jwt.verify(obj.token, process.env.SCREATE_KEY_FOR_TOKEN);
      console.log(userId.user, "-----user id from token");
      const fatchingUser = await User.findByPk(userId.user);
      if (fatchingUser) {
        //store new message into database
        const messageStore = await Message.create({
          message: obj.message,
          userId: fatchingUser.dataValues.id,
        });

        if (messageStore) {
          //Sending message to user
          socket.broadcast.emit("receive", {
            message: obj.message,
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
    // Disconnect user
    socket.on("disconnect", (user) => {
      socket.broadcast.emit("left", { data: users[socket.id] });
      delete users[socket.id];
    });
  } catch (err) {
    io.to(socket.id).emit("error", err);
  }
};
