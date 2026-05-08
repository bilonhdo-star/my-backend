const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

const io = new Server(server, {
  cors: { origin: "*" }
});

let waitingUser = null;

app.get("/", (req, res) => {
  res.send("Backend is working 🚀");
});

io.on("connection", (socket) => {

  console.log("User connected");

  socket.on("join", () => {

    if (waitingUser) {
      socket.partner = waitingUser;
      waitingUser.partner = socket;

      socket.emit("matched");
      waitingUser.emit("matched");

      waitingUser = null;
    } else {
      waitingUser = socket;
    }

  });

  socket.on("message", (msg) => {
    if (socket.partner) {
      socket.partner.emit("message", msg);
    }
  });

  socket.on("next", () => {
    socket.partner = null;
    waitingUser = socket;
  });

});

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
