/**
 * Frontend players
 *    name(id)
 *    table-position
 *    stack
 */

// initializing frontend client
const socket = io("http://localhost:3000");

// new connections only have their one
var frontendPlayers = {};

socket.on("updatePlayers", (backendPlayers) => {
  for (const id in backendPlayers) {
    if (!frontendPlayers[id]) {
      frontendPlayers[id] = new Player(id, backendPlayers[id].stack);
    }
  }
  for (const id in frontendPlayers) {
    if (!backendPlayers[id]) {
      delete frontendPlayers[id];
    }
  }
});
// event handler for dealing the user
socket.on("deal-user-hand", (player) => {
  var cardImages = document.getElementsByClassName("card");
  // console.log("data/images/cards/z" + player.hand.first + ".png);
  // for (var i = 0; i < 2; i++) {
  cardImages[0].src = "data/images/cards/z" + player.hand.first + ".png";
  cardImages[1].src = "data/images/cards/z" + player.hand.second + ".png";
  // }
  document.getElementById("friend").innerText = socket.id;
  document.getElementById("stack").innerHTML = "$" + player.stack;
  disableBetButtons();
  begin();
});

socket.on("enable-action-buttons", () => {
  enable("check_button");
  enable("raise_button");
  enable("fold_button");
});

// event handler for dealing the flop
socket.on("deal-flop", (flop_cards) => {
  var flops = document.getElementsByClassName("card_flop");
  for (var i = 0; i < 3; i++) {
    flops[i].src = "data/images/cards/z" + flop_cards[i] + ".png";
  }
});

// event handler for dealing the turn
socket.on("deal-turn", (turn) => {
  var card = document.getElementById("turn");
  card.src = "data/images/cards/z" + turn + ".png";
});

// event handler for dealing the river
socket.on("deal-river", (river) => {
  var card = document.getElementById("river");
  card.src = "data/images/cards/z" + river + ".png";
});

socket.on("start-granted", (backendPlayers) => {
  // add to the frontend players here
  console.log("start-granted");
  reset();
});

socket.on("check-granted", (prev_id, next_id) => {
  // add code that shows a check for everyone...

  //
  if (socket.id == prev_id) {
    disableBetButtons();
  }
});

socket.on("raise-granted", (id, pot, stack) => {
  updatePot(pot);
  if (socket.id == id) {
    updateStack(stack);
    disableBetButtons();
  }
});

socket.on("call-granted", (id, pot, stack) => {
  updatePot(pot);
  if (socket.id == id) {
    updateStack(stack);
    disableBetButtons();
  }
});

socket.on("switch-check-call", () => {
  // disable("check_button");
  enable("raise_button");
  enable("fold_button");
  enable("call_button");
});
socket.on("fold-granted", () => {
  disableBetButtons();
});

socket.on("showdown", () => {
  disableBetButtons();
  document.getElementById("start").style.display = "block";
});

socket.on("disconnected", (id) => {
  for (var i = 0; i < frontendPlayers.length; i++) {
    if (frontendPlayers[i].name == id) {
      frontendPlayers.splice(i, i + 1);
    }
  }
});

/*
  these next functions are all button onClick event handlers
  */

// sends a start game request
function startGame() {
  // var cards = retrieveCards(num_players);
  // const totalcards = 2 * num_players + 5;

  socket.emit("start-request");
}

// check button
function check() {
  socket.emit("check-request");
}

// raise button
function raise() {
  const raise = document.getElementById("raise_amount").value;
  if (raise != "") {
    socket.emit("raise-request", raise);
  }
}

// call button
function call() {
  socket.emit("call-request");
}
// fold button
function fold() {
  // change to "bet_call" when adding more players
  socket.emit("fold-request");
}

/* Helper methods
 */

// resets the game
function begin() {
  document.getElementById("user_hand").style.display = "inline-block";
  document.getElementById("start").style.display = "none";
  document.getElementById("bet_buttons").style.opacity = 1;
  document.getElementById("pot").style.opacity = 1;
}
function reset() {
  // reset all card elements
  var flops = document.getElementsByClassName("card_flop");
  for (var i = 0; i < 3; i++) {
    flops[i].src = "data/images/cards/card_back.png";
  }
  document.getElementById("turn").src = "data/images/cards/card_back.png";
  document.getElementById("river").src = "data/images/cards/card_back.png";

  document.getElementById("user_first").src = "data/images/cards/card_back.png";
  document.getElementById("user_second").src =
    "data/images/cards/card_back.png";

  // reset pot
  document.getElementById("pot").innerHTML = "$0";

  document.getElementById("start").style.display = "block"; // reset start button
}

// changes UI pot value
function updatePot(pot) {
  document.getElementById("pot").innerHTML = "$" + pot.toString();
}

function updateStack(stack) {
  document.getElementById("stack").innerHTML = "$" + stack.toString();
}

// disables a button(id)
function disable(id) {
  var element = document.getElementById(id);
  element.disabled = true;
  element.style.opacity = 0.5;
}

// enables a button(id)
function enable(id) {
  var element = document.getElementById(id);
  element.disabled = false;
  element.style.opacity = 1;
}

function disableBetButtons() {
  disable("check_button");
  disable("raise_button");
  disable("fold_button");
  disable("call_button");
}

class Player {
  // constructor(x, y, stack, name, image, first, second) {
  constructor(name, stack) {
    this.name = name;
    this.stack = stack;
  }
}
