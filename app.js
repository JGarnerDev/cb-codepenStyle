// == Utility functions == //

// Getting elements
const getEleById = (id) => {
    return document.getElementById(id);
  },
  getEleByClass = (className) => {
    return document.getElementsByClassName(className);
  },
  // Creating elements
  //    - Messages
  formatMessageToHTML = ({ user, message }) => {
    let li = document.createElement("li");
    li.setAttribute("class", "message");
    let nameText = document.createElement("p");
    nameText.innerText = user;
    let messageText = document.createElement("p");
    messageText.innerText = message;
    li.appendChild(nameText);
    li.appendChild(messageText);
    return li;
  },
  //    - Users (in the user list)
  formatUserInfoToHTML = ({ name, currentRoom }) => {
    let li = document.createElement("li");
    li.setAttribute("class", "user");
    let nameText = document.createElement("p");
    nameText.innerText = name;
    let roomText = document.createElement("p");
    roomText.innerText = currentRoom;
    li.appendChild(nameText);
    li.appendChild(roomText);
    return li;
  };
//    - Users (in the user list)
formatRoommateInfoToHTML = ({ name }) => {
  let li = document.createElement("li");
  li.setAttribute("class", "user");
  let nameText = document.createElement("p");
  nameText.innerText = name;
  li.appendChild(nameText);
  return li;
};

// ======================= //

// == The User Schema == //

class User {
  constructor({ id, name, currentRoom }) {
    this.id = id;
    this.name = name;
    this.currentRoom = currentRoom;
  }
}

// ===================== //

// == Setup == //

let user;
let users;

const serverURL = "http://127.0.0.1:3001/";

// The client makes a websocket connection to our server
const socket = io.connect(serverURL);

// We defined the significant client-side elements by query

// === For the Login View
const loginInput = getEleById("login-input"),
  loginButton = getEleById("login-button");
// =========================

// === For the Chat View
let roomsList = getEleById("rooms"),
  allUsers = getEleById("allUsers"),
  roomUsers = getEleById("roomUsers"),
  userList = getEleByClass("userList"),
  roomChangeButton = getEleById("roomChange"),
  chatPage = getEleById("chat"),
  chatHeader = getEleById("chat-header"),
  chatMessageBox = getEleById("chat-messages"),
  chatMessages = getEleByClass("chat-messages-currentRoom"),
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
  socket.emit("send", {
    user: user.name,
    room: user.currentRoom,
    message: messageInput.value,
  });
});

roomChangeButton.addEventListener("click", (e) => {
  e.preventDefault();
  const destination = "Other ROOM";
  socket.emit("changeRoom", { user, destination });
  user.currentRoom = destination;
});

// =========================

// =========== //

// == Socket Events == //

socket.on("message", (data) => {
  chatMessages[0].appendChild(formatMessageToHTML(data));
});

socket.on("USER_LOGIN", (data) => {
  user = new User(data);
});

socket.on("allUsers", (data) => {
  let newUserList = document.createElement("ul");
  newUserList.setAttribute("class", "userList");
  [...data].forEach((user) => {
    let userLI = formatUserInfoToHTML(user);
    newUserList.appendChild(userLI);
  });
  allUsers.replaceChild(newUserList, userList[0]);
});

socket.on("roomUsers", (data) => {
  let newUserList = document.createElement("ul");
  newUserList.setAttribute("class", "userList");
  [...data].forEach((user) => {
    let userLI = formatRoommateInfoToHTML(user);
    newUserList.appendChild(userLI);
  });
  roomUsers.replaceChild(newUserList, userList[1]);
});

socket.on("roomMessages", (data) => {
  let newChatMessages = document.createElement("ul");
  newChatMessages.setAttribute("class", "chat-messages-currentRoom");
  [...data].forEach((message) => {
    let messageLI = formatMessageToHTML(message);
    newChatMessages.appendChild(messageLI);
  });
  chatMessageBox.replaceChild(newChatMessages, chatMessages[0]);
});
