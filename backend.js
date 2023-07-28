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
const cards = retrieveCards(52);

const flop = cards.splice(0, 3);

const turn = cards.shift();
const river = cards.shift();

// state variables
var pot = 0;
var state = "deal_flop";
var backendPlayers = {};
var num_players = 0;
var game_position = 0;
var table_position = 0;
var utg;
var curr_raise = 0;

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

  /**
   * on start
   *    disable everyones actions buttons
   *    enable only current users actions buttons
   */
  socket.on("start-request", () => {
    const player = backendPlayers[socket.id];
    if (player.game_position == 0) {
      player.first_to_act = true;
      player.actor = true;
      io.emit("start-granted");
      for (const id in backendPlayers) {
        io.to(id).emit("deal-user-hand", backendPlayers[id]);
      }
      io.to(socket.id).emit("enable-action-buttons");
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

      player.first_to_act = true;
      player.stack -= raise;
      player.stake = raise;

      pot += parseInt(raise);
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
          io.emit("raise-granted", socket.id, pot);
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
          io.emit("call-granted", socket.id, pot);
          if (state != "showdown") io.to(utg).emit("enable-action-buttons");
          break;
        } else if (curr_player.game_position == next_game_position) {
          curr_player.actor = true;
          io.emit("call-granted", socket.id, pot);
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
    this.stake = 0;
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
