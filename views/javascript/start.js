const socket = io("http://localhost:3000");

function createGame() {
  const code = document.getElementById("code").value;
  socket.emit("createGame", code);
}
