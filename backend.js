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
var cards;

var flop;

var turn;
var river;

// state variables
var pot = 0;
var state = "deal_flop";
var backendPlayers = {};
var num_players = 0;
var game_position = 0;
var utg;
var curr_raise = 0;

// socket on connection
io.on("connection", (socket) => {
  backendPlayers[socket.id] = new Player(
    socket.id,
    null,
    50,
    game_position++,
    false,
    false
  );

  // FIXME: make this random
  num_players += 1;
  if (num_players == 1) {
    utg = socket.id;
    backendPlayers[socket.id].first_to_act = true;
    backendPlayers[socket.id].actor = true;
  }

  io.emit("updatePlayers", backendPlayers);

  /**
   * on start
   *    disable everyones actions buttons
   *    enable only current users actions buttons
   */
  socket.on("start-request", () => {
    // console.log(backendPlayers[socket.id].game_position)
    if (backendPlayers[socket.id].game_position == 0) {
      // const game = new Game();
      newGame();

      for (const id in backendPlayers) {
        const user_hand = new Hand(cards.shift(), cards.shift());

        backendPlayers[id].hand = user_hand;
      }
      io.emit("start-granted");
      for (const id in backendPlayers) {
        var frontendPlayers = Object.assign({}, backendPlayers);
        delete frontendPlayers[id];
        io.to(id).emit("deal-user-hand", backendPlayers[id], frontendPlayers);
      }
      io.to(socket.id).emit("enable-action-buttons");
    }
  });

  socket.on("check-request", () => {
    const player = backendPlayers[socket.id];
    console.log(player.actor);
    console.log("num_players: " + num_players);
    if (player.actor == true) {
      player.actor = false;
      const next_game_position = player.game_position + 1;
      console.log("next_game_position: " + next_game_position);
      for (const id in backendPlayers) {
        const curr_player = backendPlayers[id];
        if (curr_player.game_position == next_game_position) {
          curr_player.actor = true;
          io.emit("check-granted", socket.id, id);
          io.to(id).emit("enable-action-buttons");
          break;
        } else if (num_players == next_game_position) {
          backendPlayers[utg].actor = true;
          console.log(state);
          dealNextCard(state);
          io.emit("check-granted", socket.id, id);
          if (state != "showdown") {
            io.to(utg).emit("enable-action-buttons");
          }
          break;
        }
      }
    }
  });

  socket.on("raise-request", (raise) => {
    const player = backendPlayers[socket.id];
    console.log(player.actor);
    if (player.actor == true && raise >= curr_raise * 2) {
      const next_game_position = (player.game_position + 1) % num_players;
      for (const id in backendPlayers) {
        backendPlayers[id].first_to_act = false;
      }
      curr_raise = 0;

      const add = raise - player.stake;
      player.first_to_act = true;
      player.stack = player.stack - add;
      player.stake = raise;

      pot += parseInt(add);
      curr_raise = raise;

      for (const id in backendPlayers) {
        const curr_player = backendPlayers[id];
        if (
          curr_player.game_position == next_game_position &&
          curr_player.first_to_act == true
        ) {
          curr_player.first_to_act = false;
          backendPlayers[utg].actor = true;
          console.log(state);
          dealNextCard(state);
          io.emit("check-granted", socket.id, id); // change this to a raise grainted event
          if (state != "showdown") {
            io.to(utg).emit("enable-action-buttons");
          }
          break;
        } else if (curr_player.game_position == next_game_position) {
          curr_player.actor = true;
          io.emit(
            "raise-granted",
            socket.id,
            pot,
            backendPlayers[socket.id].stack
          );
          // emit disable check, enable call button
          io.to(id).emit("switch-check-call");
          break;
        }
      }
    }
  });

  socket.on("call-request", () => {
    const player = backendPlayers[socket.id];
    console.log(player.actor);
    if (player.actor == true) {
      const next_game_position = (player.game_position + 1) % num_players;
      const match = curr_raise - player.stake;
      console.log(match);
      player.stack -= match;

      pot += parseInt(match);
      player.stake = curr_raise;

      for (const id in backendPlayers) {
        const curr_player = backendPlayers[id];
        if (
          curr_player.game_position == next_game_position &&
          curr_player.first_to_act == true
        ) {
          curr_player.first_to_act = false;
          backendPlayers[utg].actor = true;
          for (const id in backendPlayers) {
            backendPlayers[id].stake = 0;
          }
          dealNextCard(state);
          io.emit(
            "call-granted",
            socket.id,
            pot,
            backendPlayers[socket.id].stack
          );
          if (state != "showdown") io.to(utg).emit("enable-action-buttons");
          break;
        } else if (curr_player.game_position == next_game_position) {
          curr_player.actor = true;
          io.emit(
            "call-granted",
            socket.id,
            pot,
            backendPlayers[socket.id].stack
          );
          // emit disable check, enable call button
          io.to(id).emit("switch-check-call");
          break;
        }
      }
    }
  });

  socket.on("fold-request", () => {
    if (curr_raise != 0) {
      const position = backendPlayers[socket.id].game_position;
      backendPlayers[socket.id].game_position = -1;
      num_players--;
      io.to(socket.id).emit("fold-granted");
      for (const id in backendPlayers) {
        const player = backendPlayers[id];
        if (player.game_position > position) {
          player.game_position--;
          if (player.game_position == position) {
            player.actor = true;
            io.to(id).emit("switch-check-call");
          }
        }
      }
    }
  });
  socket.on("disconnect", (reason) => {
    // console.log(reason);
    io.emit("disconnected", socket.id);
    if (backendPlayers[socket.id]) {
      console.log(socket.id + " disconnected");
      const position = backendPlayers[socket.id].game_position;
      for (const id in backendPlayers) {
        const player = backendPlayers[id];
        if (player.game_position > position) {
          player.game_position--;
        }
      }

      game_position--;
      num_players--;
      delete backendPlayers[socket.id];
      io.emit("updatePlayers", backendPlayers);
      if (num_players == 0) {
        newGame();
      }
    }
  });
});

const port = 5500;
app.use(express.static(__dirname + "/views"));

app.set("view engine", "ejs");
app.get("/", (req, res) => {
  res.render("index");
});

app.listen(port);

console.log("listening on port " + port);

// populate all 7 cards
// FIXME: change to shuffled array of cards
function retrieveCards(numPlayers) {
  var retval = [];
  var totalcards = numPlayers;

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

function dealNextCard() {
  curr_raise = 0;
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
      state = "final_bet";
      break;
    case "final_bet":
      state = "showdown";
      io.emit("showdown");
  }
}

function newGame() {
  cards = [];
  cards = retrieveCards(52);

  flop = cards.splice(0, 3);

  turn = cards.shift();
  river = cards.shift();
  pot = 0;
  state = "deal_flop";
  console.log("resetting state");
  curr_raise = 0;
}

class Game {
  constructor() {
    this.cards = retrieveCards(52);
    this.flop = cards.splice(0, 3);
    this.turn = cards.shift();
    this.river = cards.shift();
    this.pot = 0;
    this.state = "deal_flop";
    this.curr_raise = 0;
    // maybe add the backendplayers here
  }
  newGame() {
    cards = [];
    cards = retrieveCards(52);

    flop = cards.splice(0, 3);

    turn = cards.shift();
    river = cards.shift();
    pot = 0;
    state = "deal_flop";
    console.log("resetting state");
    curr_raise = 0;
  }
}

class Player {
  // constructor(x, y, stack, name, image, first, second) {
  constructor(name, hand, stack, game_position, actor, first_to_act) {
    this.name = name;
    this.hand = hand;
    this.stack = stack;
    this.stake = 0;
    this.game_position = game_position;
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
