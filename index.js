const express = require("express");
const fs = require("fs");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const bodyParser = require("body-parser");

app.use(bodyParser.json());

app.get("/", (req, res) => res.render("index"));

app.post("/user", (req, res) => {
  let users = fs.existsSync("user.json") ? JSON.parse(fs.readFileSync("user.json", "utf8")) : {};
  const { username, password, action } = req.body;

  switch(action) {
    case "create":
      if (users[username]) return res.status(400).send("El usuario ya existe.");
      users[username] = { password };
      break;
    case "login":
      if (!users[username] || users[username].password !== password) return res.status(401).send("Usuario o contraseña incorrectos.");
      break;
    default:
      return res.status(400).send("Acción no válida.");
  }

  fs.writeFileSync("user.json", JSON.stringify(users));
  res.send("Operación exitosa.");
});

io.on("connection", socket => {
  socket.on("username", username => {
    socket.username = username;
    io.emit("is_online", "🔵 <i>" + socket.username + " se une al chat.</i>");
  });

  socket.on("disconnect", () => io.emit("is_online", "🔴 <i>" + socket.username + " ha dejado el chat.</i>"));

  socket.on("chat_message", message => io.emit("chat_message", "<strong>" + socket.username + "</strong>: " + message));
});

const port = process.env.PORT || 8080;
http.listen(port, () => console.log("Escuchando en *:" + port));