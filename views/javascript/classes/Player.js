class Player {
  // constructor(x, y, stack, name, image, first, second) {
  constructor(name, hand, stack, game_position, table_position, actor) {
    this.name = name;
    this.hand = hand;
    this.stack = stack;
    this.game_position = game_position;
    this.table_position = table_position;
    this.actor = actor;
  }
}

