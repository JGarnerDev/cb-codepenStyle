var app = require("express")();
var socket = require("socket.io");

// Port is established by finding the value in environment variables, or choosing '3001' if failing to do so
var PORT = process.env.PORT || 3001;

// Starting the server on the established port
var server = app.listen(PORT, () => {
  console.log(`Server is up on port ${PORT}`);
});

// Socket setup (binding the socket to this server)
var io = socket(server);

// Socket events, beginning with a client connection (someone making a request to the server by going to the website)
io.on("connection", (socket) => {
  console.log("connection made", socket.id);

  //   When the message even occurs, we take the data
  socket.on("message", (data) => {
    //   ...emit a message event to all other sockets containing that data
    io.sockets.emit("message", data);
  });
});
