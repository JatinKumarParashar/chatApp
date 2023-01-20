const socket = io("http://localhost:4000");

const save = async (event) => {
  event.preventDefault();
  const username = event.target.username.value;
  const email = event.target.email.value;
  const password = event.target.password.value;
  const obj = {
    username,
    email,
    password,
  };
  socket.emit("signup", obj);
};

socket.on("signupSuccess", (data) => {
  console.log(data);
  window.location.href = "C:/Users/jaykp/Desktop/chat_App/FrontEnd/index.html";
});
