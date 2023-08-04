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
var rooms = {};
var roomName;
var waitingList = [];

const port = 5500;
app.use(express.static(__dirname + "/views"));
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.get("/", (req, res) => {
  res.render("start");
});

app.get("/test", (req, res) => {
  res.render("index");
});

app.post("/rooms", (req, res) => {
  res.render("index", { roomName: req.body.code });
  roomName = req.body.code;
});

// app.post("/rooms", (req, res) => {
//   res.render("index");
// });

app.listen(port);

console.log("listening on port " + port);

io.on("connection", (socket) => {
  backendPlayers[socket.id] = new Player(socket.id, 50, roomName);

  socket.join(roomName);
  console.log(roomName);
  if (!rooms[roomName]) {
    rooms[roomName] = new Game(socket.id);
    console.log(socket.id + " created room: " + roomName);
  } else {
    if (
      rooms[roomName].state == "start" ||
      rooms[roomName].state == "showdown"
    ) {
      rooms[roomName].playerOrder.push(socket.id);
    } else {
      waitingList.push(socket.id);
    }
    console.log(socket.id + " connected to room: " + roomName);
  }

  io.to(roomName).emit("updatePlayers", backendPlayers);

  // FIXME: make this random

  roomName = "";

  /**
   * on start
   *    disable everyones actions buttons
   *    enable only current users actions buttons
   */

  socket.on("start-request", () => {
    const player = backendPlayers[socket.id];
    const roomName = player.room;
    const game = rooms[roomName];
    const playerOrder = game.playerOrder;

    console.log(game.state);

    for (var i = 0; i < waitingList.length; i++) {
      game.playerOrder.push(waitingList[i]);
    }

    waitingList = [];

    if (playerOrder[0] == socket.id) {
      game.startGame();

      io.to(roomName).emit("start-granted");
      for (var i = 0; i < game.num_players; i++) {
        const id = playerOrder[i];
        const user_hand = new Hand(game.cards.shift(), game.cards.shift());
        backendPlayers[id].hand = user_hand;
        io.to(id).emit("deal-user-hand", backendPlayers[id]);
      }
      // playerOrder.push(playerOrder.shift());

      // var frontendPlayers = Object.assign({}, backendPlayers);
      // delete frontendPlayers[id];
      io.to(socket.id).emit("enable-action-buttons");
    }
  });

  socket.on("check-request", () => {
    const player = backendPlayers[socket.id];
    const roomName = player.room;
    const game = rooms[roomName];
    const playerOrder = game.playerOrder;
    const num_players = game.num_players;
    const isActor = game.actor == socket.id;
    console.log("isActor: " + isActor);
    console.log(game.state);
    if (isActor) {
      game.curr_actor += 1;
      const nextIndex = game.curr_actor % num_players;
      const next_actor = playerOrder[nextIndex];
      console.log("next_actor: " + next_actor);
      for (var i = 0; i < num_players; i++) {
        const id = playerOrder[i];
        if (next_actor == playerOrder[0]) {
          game.curr_actor = 0;
          game.actor = game.playerOrder[0];
          // backendPlayers[utg].actor = true;
          // console.log(game.state);
          dealNextCard(socket);
          io.to(roomName).emit("check-granted", socket.id, id);
          if (game.state != "showdown") {
            io.to(playerOrder[0]).emit("enable-action-buttons");
          }
          break;
        } else if (id == next_actor) {
          io.to(roomName).emit("check-granted", socket.id, id);
          io.to(id).emit("enable-action-buttons");
          game.actor = id;
          break;
        }
      }
    }
  });

  socket.on("raise-request", (raise) => {
    const player = backendPlayers[socket.id];
    const roomName = player.room;
    const game = rooms[roomName];
    const playerOrder = game.playerOrder;
    const num_players = game.num_players;
    const isActor = game.actor == socket.id;
    console.log("isActor: " + isActor);
    console.log(game.state);
    if (
      isActor &&
      raise >= game.curr_raise * 2 &&
      backendPlayers[socket.id].stack >= raise
    ) {
      const next_actor = game.playerOrder[++game.curr_actor % num_players];
      console.log("next_actor: " + next_actor);
      game.curr_raise = 0;

      const add = raise - player.stake;
      game.first_to_act = socket.id;
      player.stack -= add;
      player.stake = raise;

      game.pot += parseInt(add);
      game.curr_raise = raise;

      for (var i = 0; i < playerOrder.length; i++) {
        const id = playerOrder[i];
        if (next_actor == id && game.first_to_act == id) {
          game.curr_actor = 0;
          game.actor = game.playerOrder[0]; // backendPlayers[utg].actor = true;f
          game.first_to_act = game.playerOrder[0]; // curr_player.first_to_act = false;
          console.log(game.state);
          dealNextCard(socket);
          io.to(roomName).emit("check-granted", socket.id, id); // change this to a raise grainted event
          if (game.state != "showdown") {
            io.to(game.utg).emit("enable-action-buttons");
          }
          break;
        } else if (next_actor == id) {
          game.actor = id;
          io.to(roomName).emit(
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
    const roomName = player.room;
    const game = rooms[roomName];
    const playerOrder = game.playerOrder;
    const num_players = game.num_players;
    const isActor = game.actor == socket.id;
    console.log("isActor: " + isActor);
    console.log(game.state);

    if (isActor) {
      const next_actor = game.playerOrder[++game.curr_actor % num_players];
      console.log("next_actor: " + next_actor);
      const match = game.curr_raise - player.stake;
      player.stack -= match;

      game.pot += parseInt(match);
      player.stake = game.curr_raise;

      for (var i = 0; i < game.num_players; i++) {
        const id = playerOrder[i];
        if (next_actor == id && game.first_to_act == id) {
          game.curr_actor = 0;
          game.actor = game.playerOrder[0];
          for (const id in backendPlayers) {
            backendPlayers[id].stake = 0;
          }
          dealNextCard(socket);
          io.to(roomName).emit(
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

          io.to(roomName).emit(
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
    const player = backendPlayers[socket.id];
    const roomName = player.room;
    const game = rooms[roomName];
    const playerOrder = game.playerOrder;
    var num_players = game.num_players;
    const isActor = game.actor == socket.id;
    console.log("isActor: " + isActor);

    if (game.curr_raise != 0) {
      const next_actor = playerOrder[(game.curr_actor + 1) % num_players];
      for (var i = 0; i < num_players; i++) {
        const id = game.playerOrder[i];
        if (id == socket.id) {
          game.num_players--;
          playerOrder.splice(i, 1);
          game.folded_players[id] = i;
          io.to(next_actor).emit("switch-check-call");
          break;
        }
      }
      game.actor = next_actor;
      console.log("next_actor: " + next_actor);
      io.to(socket.id).emit("fold-granted");
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

      delete backendPlayers[socket.id];
      io.emit("updatePlayers", backendPlayers);
    }
  });
});

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

function dealNextCard(socket) {
  const player = backendPlayers[socket.id];
  const roomName = player.room;
  const game = rooms[roomName];
  const playerOrder = game.playerOrder;

  game.curr_raise = 0;
  switch (game.state) {
    case "deal_flop":
      io.to(roomName).emit("deal-flop", game.flop);
      game.state = "deal_turn";
      break;
    case "deal_turn":
      io.to(roomName).emit("deal-turn", game.turn);
      game.state = "deal_river";
      break;
    case "deal_river":
      io.to(roomName).emit("deal-river", game.river);
      game.state = "final_bet";
      break;
    case "final_bet":
      game.state = "showdown";
      io.to(roomName).emit("showdown");
  }
}

class Room {
  constructor(name) {
    this.name = name;
  }

  setGame(game) {
    this.game = game;
  }
}
class Game {
  constructor(id) {
    this.playerOrder = [id];
    this.state = "start";
  }
  startGame() {
    // this.playerOrder.push(this.playerOrder.shift());

    for (const id in this.folded_players) {
      this.playerOrder.splice(this.folded_players[id], 0, id);
    }
    this.first_to_act = this.playerOrder[0];
    this.cards = retrieveCards(52);
    this.flop = this.cards.splice(0, 3);
    this.turn = this.cards.shift();
    this.river = this.cards.shift();
    this.pot = 0;
    this.state = "deal_flop";
    this.curr_raise = 0;
    this.curr_actor = 0;
    this.actor = this.playerOrder[0];
    this.first_to_act = this.actor;
    this.utg = this.actor;
    this.num_players = this.playerOrder.length;
    this.folded_players = {};
  }
}

class Player {
  // constructor(x, y, stack, name, image, first, second) {
  constructor(name, stack, room) {
    this.name = name;
    this.hand = {};
    this.stack = stack;
    this.stake = 0;
    this.room = room;
  }
}

class Hand {
  constructor(first, second) {
    this.first = first;
    this.second = second;
  }
}
