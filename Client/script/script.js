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
const name = prompt("Enter your name to join : ");
const email = prompt("Enter your email : ");
const obj = {
  name,
  email,
};

// Send new user 
socket.emit("new-user-join", obj);

// Receive new user 
socket.on("user-joined", (userName) => {
  append(`${userName} has join the chat`);
});

// Receive old message 
socket.on("oldMessages", (oldMessage) => {
  console.log(oldMessage);
  oldMessage.forEach((message) => {
    append(`${message.user.username} : ${message.message}`);
  });
});

// Receive new message
socket.on("receive", (data) => {
  append(`${data.name} : ${data.message}`);
});

// Disconnect user
socket.on("left", (data) => {
  console.log(data.data.name);
  append(`${data.data.name} has left the chat`);
});

// Send message
const sendMessage = (event) => {
  event.preventDefault();
  const message = event.target.message.value;
  append(`You : ${message}`);
  socket.emit("send", message);
  event.target.message.value = "";
};
