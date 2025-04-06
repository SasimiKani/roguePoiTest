// 設定および初期化処理

const difficultySettings = {
  easy:   { name: "森レベル", wallEmoji: "🌳", maxFloor: 10, revealLv: 5 },
  normal: { name: "山レベル", wallEmoji: "⛰️", maxFloor: 20, revealLv: 3 },
  hard:   { name: "火山レベル", wallEmoji: "🌋", maxFloor: 99, revealLv: 2 }
};

const CONFIG = {
  WIDTH: 40,
  HEIGHT: 32,
  INITIAL_HP: 8,
  REST_CYCLE: 5,
  GENERATE_ENEMY_CYCLE: 30,
  HUNGER_CYCLE: 5,
  MIN_ENEMY_MULTIPLIER: 1.1,
  MAX_ENEMY_MULTIPLIER: 1.2,
  INVENTORY_MAX: 10,
  VIEW_RADIUS: 7,
  DIFFICULTY: "easy",
  REVEALLV: 3,
  FONT_SIZE: window.getComputedStyle(document.querySelector("#game")).fontSize.replace("px", "") - (-2)
};

const MAP_TILE = {
  WALL: difficultySettings.easy.wallEmoji,
  STEPS: '🔼'
};

// enemyList 関数（各敵クラスに応じたリストを返す）
function enemyList(floor, difficulty) {
  class EnemyDefinition {
    constructor(EnemyClass, floorRange) {
      this.enemy = EnemyClass;
      this.floorRange = floorRange;
    }
  }

  const list = [];
  let enemyDefinitions;
  switch (difficulty) {
    case "easy":
      enemyDefinitions = [
        new EnemyDefinition(EnemyLarvae, [1, 5]),
        new EnemyDefinition(EnemyAnt, [3, 7]),
        new EnemyDefinition(EnemyCrayfish, [4, 10]),
        new EnemyDefinition(EnemySlime, [6, 10])
      ];
      break;
    case "normal":
      enemyDefinitions = [
        new EnemyDefinition(EnemyLarvae, [1, 4]),
        new EnemyDefinition(EnemyAnt, [2, 5]),
        new EnemyDefinition(EnemyCrayfish, [4, 8]),
        new EnemyDefinition(EnemySlime, [8, 10]),
        new EnemyDefinition(EnemyBat, [12, 18]),
        new EnemyDefinition(EnemyGoblin, [16, 20]),
        new EnemyDefinition(EnemySkeleton, [19, 20])
      ];
      break;
    case "hard":
      enemyDefinitions = [
        new EnemyDefinition(EnemyLarvae, [1, null]),
        new EnemyDefinition(EnemyAnt, [2, null]),
        new EnemyDefinition(EnemyCrayfish, [4, null]),
        new EnemyDefinition(EnemySlime, [8, null]),
        new EnemyDefinition(EnemyBat, [12, null]),
        new EnemyDefinition(EnemyGoblin, [16, null]),
        new EnemyDefinition(EnemySkeleton, [19, null]),
        new EnemyDefinition(EnemySpider, [24, null]),
        new EnemyDefinition(EnemyWizard, [30, null])
      ];
      break;
    default:
      enemyDefinitions = [ new EnemyDefinition(EnemyLarvae, [1, null]) ];
  }
  
  enemyDefinitions.forEach(def => {
    if (def.floorRange[0] <= floor && (def.floorRange[1] === null || floor <= def.floorRange[1])) {
      list.push(def.enemy);
    }
  });

  if (list.length === 0) list.push( EnemyLarvae );

  return list;
}

function startDungeonGame(difficulty, myIcon="😊") {
  CONFIG.DIFFICULTY = difficulty;
  CONFIG.REVEALLV = difficultySettings[difficulty].revealLv;
  MAP_TILE.WALL = difficultySettings[difficulty].wallEmoji;
  setTimeout(() => {
    document.querySelector("button#change-icon").style.display = "none";
    new Game(myIcon);
  }, 300);
}

function closeResults() {
  const modal = document.getElementById("resultsModal");
  if (modal) modal.remove();
}

// アイコンを設定
const myIcon = document.querySelector("input[name=my-icon]");
const spanIcon  = document.querySelector("span.icon");
spanIcon.textContent = myIcon.value;

document.querySelector("button#change-icon").addEventListener("click", () => {
  const modal = document.createElement("div");
  const inputIcon = document.createElement("input");
  const confirmIcon = document.createElement("button");
  
  modal.className = "change-icon-modal";
  inputIcon.className = "change-icon-modal-input";
  inputIcon.value = myIcon.value;
  inputIcon.size = 1;
  confirmIcon.className = "change-icon-modal-button";
  
  confirmIcon.textContent = "決定";
  confirmIcon.addEventListener("click", () => {
    /*if (inputIcon.value.length != 1) {
      alert("アイコンは1文字にしてね");
      return;
    }*/
    spanIcon.textContent = myIcon.value = inputIcon.value;
    selector.changeIcon(myIcon.value);
    modal.remove();
  });
  
  modal.appendChild(inputIcon);
  modal.appendChild(confirmIcon);
  document.body.appendChild(modal);
});

// ゲーム開始のための難易度選択を開始
let selector = new DifficultySelector(myIcon.value);
