// == Utility functions == //

// Getting elements
const getEleById = (id) => {
    return document.getElementById(id);
  },
  getEleByClass = (className) => {
    return document.getElementsByClassName(className);
  };

// ======================= //

// == Setup == //

const serverURL = "http://127.0.0.1:3001/";

// The client makes a websocket connection to our server
const socket = io.connect(serverURL);

// We defined the significant client-side elements by query

const roomsList = getEleById("rooms"),
  usersList = getEleById("users"),
  chatPage = getEleById("chat"),
  chatHeader = getEleById("chat-header"),
  chatMessages = getEleById("chat-messages"),
  messageInput = getEleById("chat-input"),
  sendMessageButton = getEleById("chat-submit");

// ...then define their event listeners (what happens when specified events happen to them)

// the 'send' button takes the value of the message input, and emits it via socket as a message event
sendMessageButton.addEventListener("click", (e) => {
  e.preventDefault();
  socket.emit("message", {
    user: "George",
    message: messageInput.value,
  });
});

// =========== //

//  == Socket Events == //

socket.on("message", (data) => {
  chatMessages.innerHTML += `<div class="message"><p class="message-username">${data.user}</p><p class="message-text">${data.message}</p></div>`;
});
