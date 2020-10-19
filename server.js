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

//      The reference for messages in a room
const roomMessagesRef = (room) => {
  return db.ref(`/rooms/${room}/messages`);
};
//      The reference for users in a room
const roomUsersRef = (room) => {
  return db.ref(`/rooms/${room}/users`);
};

const addUserToRoom = (socket, user, room) => {
  socket.join(room);
  roomUsersRef(room).child(user.id).update(user);
};

const removeUserFromRoom = (socket, user) => {
  socket.leave(user.currentRoom);
  roomUsersRef(user.currentRoom).child(user.id).remove();
};

//    Reference for users
const usersRef = db.ref("/users");

const updateUserData = (user) => {
  usersRef.child(user.id).update(user);
};
const removeUserByID = (id) => {
  usersRef.child(id).remove();
};

const sendAllUsersList = () => {
  usersRef.on("value", (snapshot) => {
    if (!snapshot.val()) {
      return;
    }
    users = Object.values(snapshot.val());
    users.forEach((user) => {
      delete user.id;
      delete user.socket;
    });
    io.emit("allUsers", users);
  });
};

const sendRoomUsersList = (socket, room) => {
  roomUsersRef(room).on("value", (snapshot) => {
    if (!snapshot.val()) {
      return;
    }
    users = Object.values(snapshot.val());
    users.forEach((user) => {
      delete user.id;
      delete user.socket;
      delete user.currentRoom;
    });
    io.to(socket.id).emit("roomUsers", users);
  });
};

// Messages

const sendRoomMessages = (room) => {
  roomMessagesRef(room).on("value", (snapshot) => {
    if (!snapshot.val()) {
      io.to(room).emit("roomMessages", []);
      return;
    }
    messages = Object.values(snapshot.val());
    io.to(room).emit("roomMessages", messages);
  });
};
const sendRooms = (socket) => {
  roomsRef.on("value", (snapshot) => {
    rooms = Object.keys(snapshot.val());
    io.to(socket.id).emit("rooms", rooms);
  });
};

// Finding user by their socket id, used for removing user from db when they navigate elsewhere
function findUserBySocketID(id, cb) {
  // Query the users collection for the socket value
  usersRef
    .orderByChild("socket")
    .equalTo(id)
    .on("child_added", function (snapshot) {
      // callback with the key and the value associated
      cb(snapshot.val(), snapshot.key);
    });
}

// Socket setup (binding the socket to this server)
var io = socket(server);

// Socket events, beginning with a client connection (someone making a request to the server by going to the website)
io.on("connection", (socket) => {
  // Maintain a list of users
  let users = [];
  // == Logging in == //
  socket.on("login", (name) => {
    // Get a list of the current users
    sendAllUsersList();
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
    addUserToRoom(socket, user, user.currentRoom);
    //
    sendRoomMessages(user.currentRoom);
    //
    sendRoomUsersList(socket, user.currentRoom);
    //
    sendRooms(socket);
  });
  // =============== //

  // == Messaging == //

  //   When the message event occurs, we take the data
  socket.on("send", ({ user, room, message }) => {
    //   ...push the message to the db under the room's message collection...
    roomMessagesRef(room).push({ user, message });
  });
  // =============== //

  // == Room changing == //

  //   When the change room event occurs, we take the data
  socket.on("changeRoom", ({ user, destination }) => {
    // remove the user from their current room
    removeUserFromRoom(socket, user);
    // Update the user object
    user.currentRoom = destination;
    // add user to destination's user collection
    addUserToRoom(socket, user, destination);
    // update the user's collection to relfect the change
    updateUserData(user);
    //

    sendRoomMessages(user.currentRoom);
    sendRoomUsersList(socket, user.currentRoom);
  });
  // =============== //

  // == Disconnection == //
  socket.on("disconnect", function () {
    // We find the user by their socket value
    findUserBySocketID(socket.id, (user, key) => {
      // since the user returned by the callback is what is found at the db key, we add this value for convenience...
      user.id = key;
      // ...to remove them easily from the room's user collection
      removeUserFromRoom(socket, user);
      // then to remove them from the global users collection
      removeUserByID(key);
      //
    });
  });
  // =================== //
});
