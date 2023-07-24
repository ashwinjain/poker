/* backend needs to take keep track of this

1. Each player
    - Hand - Hand
    - Stack - int
    - game-position - int
    - table-position - int
    - actor? - boolean
2. State
    - start
    - bet
      - current-actor - int
      - first-actor - int
    - deal
      - deal-user
      - deal-flop
      - deal-turn
      - deal-river
    - showdown
 */

// import { Player } from "/views/javascript/classes/Player.js";
// const Player = require("/Users/ashwinjain/Development/Personal/poker/views/javascript/classes/Player.js");
// const Hand = require("/Users/ashwinjain/Development/Personal/poker/views/javascript/classes/Hand.js");
// const Card = require("/Users/ashwinjain/Development/Personal/poker/views/javascript/classes/Card.js");

// setting up express frontend server
const express = require("express");

const app = express();

// setting up socket backend server
const io = require("socket.io")(3000, {
  cors: {
    origin: "http://localhost:5500",
  },
});

// preloading this game cards
const cards = retrieveCards(52);

const flop = cards.splice(0, 3);

const turn = cards.shift();
const river = cards.shift();

// state variables
var pot = 0;
var state = "deal_flop";
var DEAL_STATES = ["deal_flop", "deal_turn", "deal_river"];
var state = "deal_flop";
var backendPlayers = {};
var num_players = 0;
var game_position = 0;
var table_position = 0;
var utg;

// socket on connection
io.on("connection", (socket) => {
  const user_hand = new Hand(cards.shift(), cards.shift());
  const player = new Player(
    socket.id,
    user_hand,
    50,
    game_position++,
    table_position++,
    false,
    false
  );
  backendPlayers[socket.id] = player;

  num_players += 1;
  if (num_players == 1) {
    utg = socket.id;
  }
  socket.on("start-request", () => {
    const player = backendPlayers[socket.id];
    if (player.game_position == 0) {
      player.first_to_act = true;
      player.actor = true;
      io.emit("start-granted");
      for (const id in backendPlayers) {
        io.to(id).emit("deal-user-hand", backendPlayers[id]);
      }
    }
  });

  socket.on("check-request", () => {
    const player = backendPlayers[socket.id];
    console.log(player.actor);
    if (player.actor == true) {
      player.actor = false;
      const next_game_position = player.game_position + 1;
      for (const id in backendPlayers) {
        const curr_player = backendPlayers[id];
        if (curr_player.game_position == next_game_position) {
          curr_player.actor = true;
          io.emit("check-granted", socket.id, id);
          break;
        } else if (num_players == next_game_position) {
          backendPlayers[utg].actor = true;
          console.log(state);

          dealNextCard(state);

          io.to(utg).emit("dealt");
          break;
        }
      }
    }
  });

  socket.on("raise-request", (raise) => {
    console.log(backendPlayers[socket.id].actor);
    if (backendPlayers[socket.id].actor == true) {
      for (const id in backendPlayers) {
        backendPlayers[id].first_to_act = false;
      }
      backendPlayers[socket.id].first_to_act = true;
      pot += parseInt(raise);
      socket.emit("raise-granted", pot);
    }
  });
  // socket.on("disconnect", (reason) => {
  //   console.log(reason);
  //   delete backendPlayers[socket.id];
  // });
});

const port = 5500;
app.use(express.static(__dirname + "/views"));

app.set("view engine", "ejs");
app.get("/", (req, res) => {
  res.render("index");
});

app.listen(port);

// populate all 7 cards
function retrieveCards(numPlayers) {
  var retval = [];
  var totalcards = numPlayers;
  var remainingCards = 11 - totalcards;

  var suits = ["s", "c", "d", "h"];

  while (retval.length < totalcards) {
    var currCard =
      (Math.floor(Math.random() * 13) + 2).toString() +
      suits[Math.floor(Math.random() * 4)];
    if (!retval.includes(currCard)) {
      retval.push(currCard);
    }
  }
  return retval;
}

// iterator for the deal states
function dealIter() {
  let deal_state = "";
  let n = -1;
  return {
    next: function () {
      deal_state = DEAL_STATES[++n];
      return { value: deal_state, done: false };
    },
  };
}

function dealNextCard() {
  switch (state) {
    case "deal_flop":
      io.emit("deal-flop", flop);
      state = "deal_turn";
      break;
    case "deal_turn":
      io.emit("deal-turn", turn);
      state = "deal_river";
      break;
    case "deal_river":
      io.emit("deal-river", river);
      break;
  }
}

class Player {
  // constructor(x, y, stack, name, image, first, second) {
  constructor(
    name,
    hand,
    stack,
    game_position,
    table_position,
    actor,
    first_to_act
  ) {
    this.name = name;
    this.hand = hand;
    this.stack = stack;
    this.game_position = game_position;
    this.table_position = table_position;
    this.actor = actor;
    this.first_to_act = first_to_act;
  }
}

class Hand {
  constructor(first, second) {
    this.first = first;
    this.second = second;
  }
}
