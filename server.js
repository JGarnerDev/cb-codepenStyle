var app = require("express")();
var firebase = require("firebase");
var socket = require("socket.io");

var cors = require("cors");

require("dotenv").config();

app.use(cors);

// Port is established by finding the value in environment variables, or choosing '3001' if failing to do so
var PORT = process.env.PORT || 3001;

// Starting the server on the established port
var server = app.listen(PORT, () => {
  console.log(`Server is up on port ${PORT}`);
});

// Firebase connectivity

var firebaseConfig = {
  apiKey: process.env.DB_apiKey,
  authDomain: process.env.DB_authDomain,
  databaseURL: process.env.DB_databaseURL,
  projectId: process.env.DB_projectId,
  storageBucket: process.env.DB_storageBucket,
  messagingSenderId: process.env.DB_messagingSenderId,
  appId: process.env.DB_appId,
  measurementId: process.env.DB_measurementId,
};

// Initialize Firebase
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

const addUserToRoom = (user, room) => {
  roomUsersRef(room).child(user.id).update(user);
};
const removeUserFromRoom = (user) => {
  roomUsersRef(user.currentRoom).child(user.id).remove();
};

//      There will be another collection just for the users
const usersRef = db.ref("/users");

const updateUserData = (user) => {
  usersRef.child(user.id).update(user);
};
const removeUserByID = (id) => {
  usersRef.child(id).remove();
};

async function findUserBySocketID(id, cb) {
  usersRef
    .orderByChild("socket")
    .equalTo(id)
    .on("child_added", function (snapshot) {
      cb(snapshot.val(), snapshot.key);
    });
}

// Socket setup (binding the socket to this server)
var io = socket(server);

// Socket events, beginning with a client connection (someone making a request to the server by going to the website)
io.on("connection", (socket) => {
  // == Logging in == //
  socket.on("login", (name) => {
    // Apply default properties to the user
    const user = { name, currentRoom: "Main Room" };
    // Establish the socket id
    const socketID = socket.id;
    // Add socket id to user object
    user.socket = socketID;
    // add user to the user's collection, retain their id
    user.id = usersRef.push(user).getKey();
    // Send the information back to the unique socket connection
    io.to(socketID).emit("USER_LOGIN", user);
    // Add the user to the room's current users collection
    addUserToRoom(user, user.currentRoom);
  });
  // =============== //

  // == Messaging == //

  //   When the message event occurs, we take the data
  socket.on("message", ({ user, room, message }) => {
    //   ...push the message to the db under the room's message collection...
    roomMessagesRef(room).push({ user, message });
    //   ...and emit a message event to all other sockets containing that data
    io.sockets.emit("message", { user, room, message });
  });
  // =============== //

  // == Room changing == //

  //   When the change room event occurs, we take the data
  socket.on("changeRoom", ({ user, destination }) => {
    // remove the user from their current room
    removeUserFromRoom(user);
    // Update the user object
    user.currentRoom = destination;
    // add user to destination's user collection
    addUserToRoom(user, destination);
    // update the user's collection to relfect the change
    updateUserData(user);
  });
  // =============== //
  socket.on("disconnect", async function () {
    findUserBySocketID(socket.id, (user, key) => {
      user.id = key;
      removeUserFromRoom(user);
      removeUserByID(key);
    });
  });
});
