// initializing frontend client
const socket = io("http://localhost:3000");

var players = {};
// event handler for dealing the user
socket.on("deal-user-hand", (player) => {
  var cardImages = document.getElementsByClassName("card");
  // for (var i = 0; i < 2; i++) {
  cardImages[0].src = "data/images/cards/z" + player.hand.first + ".png";
  cardImages[1].src = "data/images/cards/z" + player.hand.second + ".png";
  // }
  document.getElementById("friend").innerText = socket.id;
  console.log(player);
  disableBetButtons();
});

socket.on("enable-action-buttons", () => {
  enable("check_button");
  enable("raise_button");
  enable("fold_button");
  console.log("enabled");
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

socket.on("start-granted", () => {
  document.getElementById("user_hand").style.display = "inline-block";
  document.getElementById("start").style.display = "none";
  document.getElementById("bet_buttons").style.opacity = 1;
  document.getElementById("pot").style.opacity = 1;
});

socket.on("check-granted", (prev_id, next_id) => {
  // add code that shows a check for everyone...

  //
  if (socket.id == prev_id) {
    disableBetButtons();
  }
});

socket.on("raise-granted", (id, pot) => {
  updatePot(pot);
  if (socket.id == id) {
    disableBetButtons();
  }
});

socket.on("call-granted", (id, pot) => {
  updatePot(pot);
  if (socket.id == id) {
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
  // reset();
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
  socket.emit("raise-request", raise);
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
function reset() {
  // reset all card elements
  var flops = document.getElementsByClassName("flop");
  for (var i = 0; i < 3; i++) {
    flops[i].style.opacity = "0";
  }
  document.getElementById("turn").style.opacity = 0;
  document.getElementById("river").style.opacity = 0;

  var cardImages = document.getElementsByClassName("user_card");
  for (var i = 0; i < cardImages.length; i++) {
    cardImages[i].children[0].src = "data/images/cards/card_back.png";
  }

  // reset pot

  document.getElementById("start").style.display = "block"; // reset start button
}

// changes UI pot value
function updatePot(pot) {
  document.getElementById("pot").innerHTML = "$" + pot.toString();
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
