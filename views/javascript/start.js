const form = document.getElementById("room_form");
var rooms = {};

form.addEventListener("submit", (e) => {
  e.preventDefault();
  code = document.forms["room_form"]["code"].value;

  if (rooms[code]) {
    console.log("Room Joined: " + code);
  } else {
    rooms[code] = new Room(code);
    console.log("Room Created: " + code);
  }
  form.submit();
});

class Room {
  constructor(name) {
    this.name = name;
    this.players = [];
  }
}
