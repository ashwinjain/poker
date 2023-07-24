// keeps track of pot - likely to move to backend
var pot = 0;

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
  disable("deal_button");
});

socket.on("check-granted", (prev_id, next_id) => {
  if (socket.id == prev_id) {
    disableBetButtons();
  }
});

socket.on("check", (id) => {
  console.log(id + " checks");
});

socket.on("raise-granted", () => {
  const raiseAmount = raiseInput.value;
  console.log(raiseAmount);

  pot += parseInt(raiseAmount);
  updatePot();

  disableBetButtons();
  enable("deal_button");
});
socket.on("fold-granted", () => {
  reset();
});

socket.on("dealt", () => {
  console.log("action on me ");
  enable("check_button");
  enable("raise_button");
  enable("fold_button");
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
  socket.emit("raise-request");
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
  pot = 0;
  updatePot();

  document.getElementById("start").style.display = "block"; // reset start button
}

// changes UI pot value
function updatePot() {
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
}
