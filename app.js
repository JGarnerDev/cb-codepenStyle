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

// Removing the chat

// Models

class User {
  constructor(name) {
    this.name = name;
    this.currentRoom = "Main Room";
    this.login();
  }
  login() {
    this.id = usersRef.push(this).getKey();
  }
  logout() {
    usersRef.child(this.id).remove();
  }
  sendMessage(body) {
    const message = { name: this.name, body };
    messageRef(this.currentRoom).push(message);
  }
}

let user;

// Database references

//      We will support multiple rooms, so the reference will be made dynamically
const messageRef = (room) => {
  return db.ref(`/rooms/${room}/messages`);
};
//      There will be another collection just for the users
const usersRef = db.ref("/users");

// Utility functions

//      Getting elements
const getEleById = (id) => {
  return document.getElementById(id);
};
const getEleByClass = (className) => {
  return document.getElementsByClassName(className);
};

const loginPage = getEleById("login");
const loginForm = getEleById("login-form");
const loginButton = getEleById("login-submit");

const chatPage = getEleById("chat");

loginButton.addEventListener("click", (e) => {
  e.preventDefault();
  // Take the username value from the form
  const username = loginForm.username.value;

  user = new User(username);
  loginPage.remove();
  chatPage.classList.remove("hide");
});
