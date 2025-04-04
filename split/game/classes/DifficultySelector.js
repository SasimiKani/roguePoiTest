// DifficultySelector クラス
class DifficultySelector {
  constructor() {
    this.gridWidth = 15;
    this.gridHeight = 15;
    this.grid = [];
    for (let y = 0; y < this.gridHeight; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.gridWidth; x++) {
        this.grid[y][x] = " ";
      }
    }
    this.options = [
      { x: 3, y: 3, difficulty: "easy", tile: difficultySettings.easy.wallEmoji },
      { x: 11, y: 3, difficulty: "normal", tile: difficultySettings.normal.wallEmoji },
      { x: 7, y: 11, difficulty: "hard", tile: difficultySettings.hard.wallEmoji }
    ];
    this.options.forEach(opt => {
      for (var pos of [[-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0]]) {
        this.grid[opt.y + pos[1]][opt.x + pos[0]] = opt.tile;
      }
    });
    this.playerX = Math.floor(this.gridWidth / 2);
    this.playerY = Math.floor(this.gridHeight / 2);
    this.inSelection = true;
    this.render();
    this.handleKeyDown = this.handleKeyDown.bind(this);
    document.addEventListener('keydown', this.handleKeyDown);
  }
  render() {
    let html = "";
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        if (x === this.playerX && y === this.playerY) {
          html += "<span>😊</span>";
        } else {
          html += `<span>${this.grid[y][x]}</span>`;
        }
      }
      html += "<br>";
    }
    document.getElementById("game").innerHTML = html;
  }
  handleKeyDown(e) {
    if (!this.inSelection) return;
    let dx = 0, dy = 0;
    if (e.key === "ArrowLeft") dx = -1;
    else if (e.key === "ArrowRight") dx = 1;
    else if (e.key === "ArrowUp") dy = -1;
    else if (e.key === "ArrowDown") dy = 1;
    if (dx !== 0 || dy !== 0) {
      let newX = this.playerX + dx;
      let newY = this.playerY + dy;
      if (newX < 0 || newX >= this.gridWidth || newY < 0 || newY >= this.gridHeight) return;
      this.playerX = newX;
      this.playerY = newY;
      this.render();
      for (let opt of this.options) {
        if (opt.x === this.playerX && opt.y === this.playerY) {
          this.inSelection = false;
          document.removeEventListener('keydown', this.handleKeyDown);
          startDungeonGame(opt.difficulty);
          break;
        }
      }
    }
  }
}
