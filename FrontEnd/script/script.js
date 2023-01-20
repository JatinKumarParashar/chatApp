// Connection with Web socket
const socket = io("http://localhost:4000");

const container = document.getElementById("message");

// Append new message in message container
const append = (message) => {
  const div = document.createElement("div");
  div.innerHTML = message;
  div.classList.add = "message";
  container.append(div);
};

// Taking input from user for join the chat

// Send new user
const email = prompt("Enter your email to join : ");
const password = prompt("Enter your password : ");
const obj = {
  email,
  password,
};

// Send new user
socket.emit("new-user-join", obj);

// Receive new user
socket.on("user-joined", (userName) => {
  // console.log(userName);
  append(`${userName} has join the chat`);
});

// Receive old message
socket.on("loginSuccess", (data) => {
  // console.log(data.oldMessage);
  localStorage.setItem("token", data.token);
  data.oldMessage.forEach((message) => {
    append(`${message.user.username} : ${message.message}`);
  });
});

// Receive new message
socket.on("receive", (data) => {
  append(`${data.name} : ${data.message}`);
});

//Disconnect user
socket.on("left", (data) => {
  //console.log(data);
  append(`${data.data.username} has left the chat`);
});

// Send message
const sendMessage = (event) => {
  event.preventDefault();
  const message = event.target.message.value;
  const token = localStorage.getItem("token");
  const obj = {
    message,
    token,
  };
  append(`You : ${message}`);
  socket.emit("send", obj);
  event.target.message.value = "";
};

socket.on("error", (err) => {
  console.log(err);
});
