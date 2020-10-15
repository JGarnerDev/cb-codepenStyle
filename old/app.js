// Utility functions

//      Getting elements
const getEleById = (id) => {
  return document.getElementById(id);
};
const getEleByClass = (className) => {
  return document.getElementsByClassName(className);
};

// DOM Elements
const loginPage = getEleById("login");
const loginForm = getEleById("login-form");
const loginButton = getEleById("login-submit");

const chatPage = getEleById("chat");
const chatHeader = getEleById("chat-header");
const chatInput = getEleById("chat-input");
const chatButton = getEleById("chat-submit");
const chatMessages = getEleById("chat-messages");

const roomsList = getEleById("rooms");

// Socket connection

const socket = io.connect("http://127.0.0.1:3001/");

// Firebase connection
var firebaseConfig = {
  apiKey: "AIzaSyCgkjk9hPKgGIJOfjLNotj46_J4ViNT5Zs",
  authDomain: "codepen-chatterbox.firebaseapp.com",
  databaseURL: "https://codepen-chatterbox.firebaseio.com",
  projectId: "codepen-chatterbox",
  storageBucket: "codepen-chatterbox.appspot.com",
  messagingSenderId: "73501066368",
  appId: "1:73501066368:web:ae74ab2e3f91ae97751265",
  measurementId: "G-5FBB9TH8Q5",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Database references

//      Reference for rooms
const roomsRef = db.ref("/rooms");
//      We will support multiple rooms, so the reference will be made dynamically
const roomMessagesRef = (room) => {
  return db.ref(`/rooms/${room}/messages`);
};
const roomUsersRef = (room) => {
  return db.ref(`/rooms/${room}/users`);
};

//      There will be another collection just for the users
const usersRef = db.ref("/users");

// Event handlers

//    The login button takes the username from the form and makes a new user object
loginButton.addEventListener("click", (e) => {
  e.preventDefault();
  // Take the username value from the form
  const username = loginForm.username.value;
  // redefine the user variable as class object with the name
  user = new User(username);
  // Take away the login page element from the DOM
  loginPage.remove();
  // Bring the chat page element out of the hide class
  chatPage.classList.remove("hide");
  // Change the chat header to the room the user is in
  chatHeader.innerText = user.currentRoom;
  // Show messages of the room that they're in
});

//    The chat button sends the input value as a message
chatButton.addEventListener("click", (e) => {
  e.preventDefault();
  //   Take the message value from the form
  const message = chatInput.value;
  //   Use the class method to send the message
  user.sendMessage(message);
  //   Emit the websocket event
});

//    We need a list of current rooms for the user to navigate to
roomsRef.once("value", (snapshot) => {
  snapshot.forEach((child) => {
    let liChild = document.createElement("li");
    liChild.textContent = child.key;
    liChild.addEventListener("click", () => {
      user.changeRoom(child.key);
      chatHeader.innerText = user.currentRoom;
    });
    roomsList.appendChild(liChild);
  });
});

let user;

class User {
  constructor(name) {
    this.name = name;
    this.currentRoom = "Main Room";
    this.login();
  }
  login() {
    //   Add the user to users db collection, keep the id from database
    this.id = usersRef.push(this).getKey();
    //   Add the user to the current room's list of users with their id
    roomUsersRef(this.currentRoom).child(this.id).update(this);
  }
  logout() {
    usersRef.child(this.id).remove();
    roomUsersRef(this.currentRoom).child(this.id).remove();
  }
  sendMessage(body) {
    const message = { name: this.name, body };
    roomMessagesRef(this.currentRoom).push(message);
  }
  changeRoom(room) {
    //   remove them from current room
    roomUsersRef(this.currentRoom).child(this.id).remove();
    // redefine the user's current room property
    this.currentRoom = room;
    //   add them to the desired room, creating it if it doesn't exist
    roomUsersRef(room).child(this.id).update(this);
    // update the users collection with the new info
    usersRef.child(this.id).update(this);
  }
}

// User manual tests

setTimeout(() => {}, 2000);
setTimeout(() => {}, 4000);
setTimeout(() => {}, 6000);
setTimeout(() => {}, 8000);
setTimeout(() => {}, 10000);
