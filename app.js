// == Utility functions == //

// Getting elements
const getEleById = (id) => {
    return document.getElementById(id);
  },
  getEleByClass = (className) => {
    return document.getElementsByClassName(className);
  },
  // Creating elements
  formatMessageToHTML = ({ user, message }) => {
    return `<div class="message"><p class="message-username">${user}</p><p class="message-text">${message}</p></div>`;
  };

// ======================= //

// == The User Schema == //

// ===================== //

// == Setup == //

const serverURL = "http://127.0.0.1:3001/";

// The client makes a websocket connection to our server
const socket = io.connect(serverURL);

// We defined the significant client-side elements by query

// === For the Login View
const loginInput = getEleById("login-input"),
  loginButton = getEleById("login-button");
// =========================

// === For the Chat View
const roomsList = getEleById("rooms"),
  usersList = getEleById("users"),
  chatPage = getEleById("chat"),
  chatHeader = getEleById("chat-header"),
  chatMessages = getEleById("chat-messages"),
  messageInput = getEleById("chat-input"),
  sendMessageButton = getEleById("chat-submit");
//  =========================

// == Event Listeners == //

// === For the Login View ===

loginButton.addEventListener("click", (e) => {
  e.preventDefault();
  const name = loginInput.value;
  socket.emit("login", name);
});

// =========================

// === For the Chat View ===

// the 'send' button takes the value of the message input, and emits it via socket as a message event
sendMessageButton.addEventListener("click", (e) => {
  e.preventDefault();
  socket.emit("message", {
    user: "George",
    room: "Main Room",
    message: messageInput.value,
  });
});
// =========================

// =========== //

// == Socket Events == //

socket.on("message", (data) => {
  chatMessages.innerHTML += formatMessageToHTML(data);
});

socket.on("USER_DATA", (data) => {
  console.log(data);
});
