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
  console.log("User connected:", socket.id);

  // JOIN SYSTEM
  socket.on("join", () => {

    if (socket.partner) return;

    if (waitingUser && waitingUser !== socket) {
      socket.partner = waitingUser;
      waitingUser.partner = socket;

      socket.emit("matched");
      waitingUser.emit("matched");

      waitingUser = null;
    } else {
      waitingUser = socket;
    }
  });

  // MESSAGE SYSTEM
  socket.on("message", (msg) => {
    if (socket.partner) {
      socket.partner.emit("message", msg);
    }
  });

  // NEXT USER
  socket.on("next", () => {
    if (socket.partner) {
      socket.partner.emit("partner-left");
      socket.partner.partner = null;
    }

    socket.partner = null;
    waitingUser = socket;
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    if (socket.partner) {
      socket.partner.emit("partner-left");
      socket.partner.partner = null;
    }

    if (waitingUser === socket) {
      waitingUser = null;
    }
  });

});

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
