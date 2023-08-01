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

// state variables
var backendPlayers = {};
var num_players = 0;
var game_position = 0;
var utg;
var game;
var playerOrder = [];

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

  playerOrder.push(socket.id);

  // FIXME: make this random
  num_players += 1;
  if (num_players == 1) {
    utg = socket.id;
  }

  io.emit("updatePlayers", backendPlayers);

  /**
   * on start
   *    disable everyones actions buttons
   *    enable only current users actions buttons
   */
  socket.on("start-request", () => {
    if (playerOrder[0] == socket.id) {
      game = new Game(socket.id, playerOrder);
      console.log(playerOrder);

      for (const id in backendPlayers) {
        const user_hand = new Hand(game.cards.shift(), game.cards.shift());

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
    const isActor = game.actor == socket.id;
    console.log("isActor: " + isActor);
    if (isActor) {
      const next_actor = game.playerOrder[++game.curr_actor];
      console.log("next_actor: " + next_actor);
      for (const id in backendPlayers) {
        if (id == next_actor) {
          io.emit("check-granted", socket.id, id);
          io.to(id).emit("enable-action-buttons");
          game.actor = next_actor;
          break;
        } else if (next_actor == undefined) {
          game.curr_actor = 0;
          game.actor = game.playerOrder[0];
          // backendPlayers[utg].actor = true;
          // console.log(game.state);
          dealNextCard(game.state);
          io.emit("check-granted", socket.id, id);
          if (game.state != "showdown") {
            io.to(game.playerOrder[0]).emit("enable-action-buttons");
          }
          break;
        }
      }
    }
  });

  socket.on("raise-request", (raise) => {
    const player = backendPlayers[socket.id];
    const isActor = game.actor == socket.id;
    console.log("isActor: " + isActor);
    if (isActor && raise >= game.curr_raise * 2) {
      game.curr_actor += 1;
      const next_actor = game.playerOrder[game.curr_actor % num_players];
      console.log("next_actor: " + next_actor);
      // for (const id in backendPlayers) {
      //   backendPlayers[id].first_to_act = false;
      // }
      game.curr_raise = 0;

      const add = raise - player.stake;
      // player.first_to_act = true;
      game.first_to_act = socket.id;
      player.stack -= add;
      player.stake = raise;

      game.pot += parseInt(add);
      game.curr_raise = raise;

      for (const id in backendPlayers) {
        if (next_actor == id && game.first_to_act == id) {
          game.curr_actor = 0;
          game.actor = game.playerOrder[0]; // backendPlayers[utg].actor = true;f
          game.first_to_act = game.playerOrder[0]; // curr_player.first_to_act = false;
          console.log(game.state);
          dealNextCard(game.state);
          io.emit("check-granted", socket.id, id); // change this to a raise grainted event
          if (game.state != "showdown") {
            io.to(utg).emit("enable-action-buttons");
          }
          break;
        } else if (next_actor == id) {
          game.actor = id;
          io.emit(
            "raise-granted",
            socket.id,
            game.pot,
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
    const isActor = game.actor == socket.id;
    console.log("isActor: " + isActor);
    if (isActor) {
      game.curr_actor += 1;
      const next_actor = game.playerOrder[game.curr_actor % num_players];
      console.log("next_actor: " + next_actor);
      const match = game.curr_raise - player.stake;
      player.stack -= match;

      game.pot += parseInt(match);
      player.stake = game.curr_raise;

      for (const id in backendPlayers) {
        if (next_actor == id && game.first_to_act == id) {
          game.curr_actor = 0;
          game.actor = game.playerOrder[0];
          for (const id in backendPlayers) {
            backendPlayers[id].stake = 0;
          }
          dealNextCard(game.state);
          io.emit(
            "call-granted",
            socket.id,
            game.pot,
            backendPlayers[socket.id].stack
          );
          if (game.state != "showdown")
            io.to(game.playerOrder[0]).emit("enable-action-buttons");
          break;
        } else if (next_actor == id) {
          game.actor = id; // curr_player.actor = true;

          io.emit(
            "call-granted",
            socket.id,
            game.pot,
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
    const isActor = game.actor == socket.id;
    console.log("isActor: " + isActor);

    if (game.curr_raise != 0) {
      num_players--;

      io.to(socket.id).emit("fold-granted");
      for (var i = 0; i < game.playerOrder.length; i++) {
        const id = game.playerOrder[i];
        if (id == socket.id) {
          game.playerOrder.splice(i, 1);
          const next_actor = game.playerOrder[game.curr_actor % num_players];
          console.log("next_actor: " + next_actor);
          io.to(next_actor).emit("switch-check-call");
          game.actor = next_actor;
          // game.curr_actor += 1;
          break;
        }
      }
    }
  });
  socket.on("disconnect", (reason) => {
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
  game.curr_raise = 0;
  switch (game.state) {
    case "deal_flop":
      io.emit("deal-flop", game.flop);
      game.state = "deal_turn";
      break;
    case "deal_turn":
      io.emit("deal-turn", game.turn);
      game.state = "deal_river";
      break;
    case "deal_river":
      io.emit("deal-river", game.river);
      game.state = "final_bet";
      break;
    case "final_bet":
      game.state = "showdown";
      io.emit("showdown");
  }
}

class Game {
  constructor(id, playerOrder) {
    this.cards = retrieveCards(52);
    this.flop = this.cards.splice(0, 3);
    this.turn = this.cards.shift();
    this.river = this.cards.shift();
    this.pot = 0;
    this.state = "deal_flop";
    this.curr_raise = 0;
    this.curr_actor = 0;
    this.actor = id;
    this.first_to_act = id;
    this.playerOrder = [...playerOrder];
    // maybe add the backendplayers here
    console.log("new game");
  }
}

class Player {
  // constructor(x, y, stack, name, image, first, second) {
  constructor(name, hand, stack, game_position, actor, first_to_act) {
    this.name = name;
    this.hand = hand;
    this.stack = stack;
    this.stake = 0;

    // get rid of these
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
