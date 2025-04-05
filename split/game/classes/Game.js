// Game クラス
class Game {
  constructor() {
    this.isPlay = true;
    this.keyX = 0;
    this.keyY = 0;
    this.actionCount = 0;
    this.actionTime = 400;
    this.width = CONFIG.WIDTH;
    this.height = CONFIG.HEIGHT;
    this.initialHP = CONFIG.INITIAL_HP;
    this.floor = 1;
    this.score = 0;
    this.isGameOver = false;
    this.generateEnemyCycle = [0, CONFIG.GENERATE_ENEMY_CYCLE];
    this.restCycle = [0, CONFIG.REST_CYCLE];
    this.hungerCycle = [0, CONFIG.HUNGER_CYCLE];
    this.timeoutQueue = [];
    this.acceptingInput = true;
    this.keysDown = {};
    this.items = [];
    this.gems = [];
    this.enemies = [];
    this.stairs = { x: 0, y: 0 };
    this.player = new Player(0, 0, this.initialHP);
    this.uiManager = new UIManager();
    this.map = new DungeonMap(this.width, this.height);
    this.gameContainer = document.getElementById("game");
    this.minimapContainer = document.getElementById("minimap");
    this.inventoryOpen = false;
    // inventorySelectionの範囲は、所持品＋（足元アイテムがある場合は１つ追加）
    this.inventorySelection = 0;
    this.ctrlPressed = false;
    // 足元アイテム用プロパティ
    this.groundItem = null;
    document.getElementById("restCycle").innerText = CONFIG.REST_CYCLE;
    this.generateDungeon(false);
    this.render();
    
    EffectsManager.showFloorOverlay(this.gameContainer, this.floor);
    
    setTimeout(() => {
      new InputManager(this);
    }, 300);
  }
  
  queueTimeout(callback, delay) {
    this.acceptingInput = false;
    const id = setTimeout(() => {
      callback();
      this.timeoutQueue = this.timeoutQueue.filter(t => t !== id);
      if (this.timeoutQueue.length === 0) this.acceptingInput = true;
      this.render();
    }, delay);
    this.timeoutQueue.push(id);
  }
  
  advanceTurn() {
    this.generateEnemyCycle[0] = (this.generateEnemyCycle[0] + 1) % this.generateEnemyCycle[1];
    this.hungerCycle[0] = (this.hungerCycle[0] + 1) % this.hungerCycle[1];
  }
  updateData(inputResult) {
    if (!inputResult) return;
    this.actionCount = 0;
    const { tx, ty } = inputResult;
    let attacked = false;
    for (let i = 0; i < this.enemies.length; i++) {
      if (this.enemies[i].x === tx && this.enemies[i].y === ty) {
        attacked = true;
        this.damageEnemy(this.enemies[i], i);
        break;
      }
    }
    // 移動前に、もし足元にアイテムがあれば、プレイヤーの現在位置に残す
    if (!attacked && (this.keyX || this.keyY) && this.map.grid[ty]?.[tx] !== MAP_TILE.WALL &&
        !this.enemies.some(e => e.x === tx && e.y === ty)) {
      if (this.groundItem) {
         this.groundItem.x = this.player.x;
         this.groundItem.y = this.player.y;
         this.items.push(this.groundItem);
         this.groundItem = null;
      }
      this.player.x = tx;
      this.player.y = ty;
      this.map.visible[ty][tx] = true;
      this.map.revealRoom(tx, ty);
      this.map.revealAround(tx, ty);
    }
    if (!attacked && (this.keyX || this.keyY) && this.player.x === this.stairs.x && this.player.y === this.stairs.y) {
      // ここで選択肢のオーバーレイを表示
      EffectsManager.showStairConfirmationKeyboard(() => {
        // 「降りる」を選んだ場合
        this.generateDungeon(true);
        this.render();
        EffectsManager.showFloorOverlay(this.gameContainer, this.floor);
      }, () => {
        // 「キャンセル」を選んだ場合、必要に応じてプレイヤー位置を戻すなどの処理
        this.groundItem = new BaseEntity(tx, ty, '🔼');
        
        // 例: 現在の位置から少しずらす（ここは実装に合わせて調整）
        this.render();
      });
      
      return;
    }
    if (!this.ctrlPressed && this.player.inventory.length < CONFIG.INVENTORY_MAX) {
      this.items = this.items.filter(item => {
        if (item.x === this.player.x && item.y === this.player.y) {
          if (this.player.inventory.length < CONFIG.INVENTORY_MAX) {
            this.player.inventory.push(item);
            EffectsManager.showEffect(this.gameContainer, this.player, this.player.x, this.player.y, "GET");
            return false;
          }
        }
        return true;
      });
    } else {
      for (let i = 0; i < this.items.length; i++) {
        if (this.items[i].x === this.player.x && this.items[i].y === this.player.y) {
          if (!this.groundItem) {
            this.groundItem = this.items[i];
            EffectsManager.showEffect(this.gameContainer, this.player, this.player.x, this.player.y, `${this.groundItem.name}に乗った`);
            this.items.splice(i, 1);
          }
          break;
        }
      }
    }
    this.checkHunger();
    if (attacked) {
      this.enemyAttackPhase();
      this.queueTimeout(() => {
        this.enemyMovementPhase(tx, ty, attacked);
        this.enemyActionRefresh();
      }, (this.actionCount + 1) * this.actionTime);
    } else {
      this.enemyMovementPhase(tx, ty);
      this.enemyAttackPhase();
      this.queueTimeout(() => { this.enemyActionRefresh(); }, this.actionCount * this.actionTime);
    }
    this.checkCollisions();
    if (this.generateEnemyCycle[0] === 0) {
      this.placeEntities(this.enemies, randomInt(1, 3), "enemy");
    }
  }
  computeInput(event) {
    if (this.keysDown['ArrowLeft'] ||
        this.keysDown['ArrowRight'] ||
        this.keysDown['ArrowUp'] ||
        this.keysDown['ArrowDown'] ||
        event.key === '.') {
      this.restCycle[0] = (this.restCycle[0] + 1) % this.restCycle[1];
      if (this.restCycle[0] === 0 && this.player.hp < this.player.maxHp) this.player.hp++;
    }
    if (this.keysDown['Shift']) {
      let hor = 0, ver = 0;
      if (this.keysDown['ArrowLeft'] && !this.keysDown['ArrowRight']) { this.keyX = hor = -1; }
      else if (this.keysDown['ArrowRight'] && !this.keysDown['ArrowLeft']) { this.keyX = hor = 1; }
      if (this.keysDown['ArrowUp'] && !this.keysDown['ArrowDown']) { this.keyY = ver = -1; }
      else if (this.keysDown['ArrowDown'] && !this.keysDown['ArrowUp']) { this.keyY = ver = 1; }
      if (hor !== 0 && ver !== 0) {
        if (this.map.grid[this.player.y][this.player.x + hor] === MAP_TILE.WALL ||
            this.map.grid[this.player.y + ver][this.player.x] === MAP_TILE.WALL) return null;
        return { tx: this.player.x + hor, ty: this.player.y + ver };
      }
      return null;
    }
    if (event.key === '.') {
      this.keyX = this.keyY = 0;
      return { tx: this.player.x, ty: this.player.y };
    }
    //if (event.key === 'r') { this.showResults(); return null; }
    let dx = 0, dy = 0, count = 0;
    if (this.keysDown['ArrowLeft']) { this.keyX = dx = -1; this.keyY = 0; count++; }
    if (this.keysDown['ArrowRight']) { this.keyX = dx = 1; this.keyY = 0; count++; }
    if (this.keysDown['ArrowUp']) { this.keyY = dy = -1; this.keyX = 0; count++; }
    if (this.keysDown['ArrowDown']) { this.keyY = dy = 1; this.keyX = 0; count++; }
    if (count === 1) {
      if (this.map.grid[this.player.y + dy]?.[this.player.x + dx] === MAP_TILE.WALL) return null;
      return { tx: this.player.x + dx, ty: this.player.y + dy };
    }
    return null;
  }
  processInventoryInput(event) {
    // まず、選択範囲は所持品リスト＋足元アイテム（ある場合）
    const totalOptions = this.player.inventory.length + (this.groundItem ? 1 : 0);
    
    // デバッグ用コマンド： 'w' キーで階段ワープ
    /*if (event.key === 'w') {
      // プレイヤーを階段の位置にワープ
      this.player.x = this.stairs.x;
      this.player.y = this.stairs.y;
      // マップの視界を更新（階段周辺を見えるようにする）
      this.map.revealRoom(this.player.x, this.player.y);
      this.map.revealAround(this.player.x, this.player.y);
      // エフェクトを表示してデバッグ感を出す（例：WARP 表示）
      EffectsManager.showEffect(this.gameContainer, this.player, this.player.x, this.player.y, "WARP", "heal");
      // ターンを進めたり、レンダリングを更新
      this.advanceTurn();
      this.render();
      return;
    }*/
    
    // カーソル移動
    if (event.key === 'ArrowUp') {
      if (totalOptions > 0) {
        this.inventorySelection = (this.inventorySelection - 1 + totalOptions) % totalOptions;
        this.render();
      }
      return;
    }
    if (event.key === 'ArrowDown') {
      if (totalOptions > 0) {
        this.inventorySelection = (this.inventorySelection + 1) % totalOptions;
        this.render();
      }
      return;
    }
    // 以下、キーの処理
    // もしカーソルが足元アイテム（＝インベントリリストの最後の項目）を指している場合
    if (this.groundItem && this.inventorySelection === this.player.inventory.length) {
      if (event.key === 'p') {
        if (this.groundItem.tile === '🔼') return; // 足元が階段なら何もしない
        // 足元アイテムを拾う
        if (this.player.inventory.length < CONFIG.INVENTORY_MAX) {
          this.player.inventory.push(this.groundItem);
          EffectsManager.showEffect(this.gameContainer, this.player, this.player.x, this.player.y, "GET");
          this.groundItem = null;
          this.inventoryOpen = false;
        } else {
          this.items.push(this.groundItem);
        }
        this.render();
        return;
      }
      if (event.key === 'u') {
        // 足元が階段なら降りる
        if (this.groundItem.tile === '🔼') {
          this.inventoryOpen = false;
          this.groundItem = null;
          this.generateDungeon(true);
          this.render();
          EffectsManager.showFloorOverlay(this.gameContainer, this.floor);
          return;
        }
        // 足元アイテムを使用
        else if (this.groundItem.use) {
          // インベントリがマックスで足元の武器を装備できない
          if (this.groundItem.name.match(/武器.*/g) && this.player.inventory.length >= CONFIG.INVENTORY_MAX) return;
          this.groundItem.use(this);
          // もし足元のアイテムが武器なら、使用後にインベントリへ追加
          if (this.groundItem.name.match(/武器.*/g)) {
            if (this.player.inventory.length < CONFIG.INVENTORY_MAX) {
              this.player.inventory.push(this.groundItem);
            } else {
              this.items.push(this.groundItem);
            }
          }
          this.groundItem = null;
        }
        this.inventoryOpen = false;
        this.render();
        return;
      }
      if (event.key === 'x') {
        return;
      }
    } else {
      // 通常の所持品の操作
      if (event.key === 'u') {
        let item = this.player.inventory[this.inventorySelection];
        if (item && item.use) {
          item.use(this);
          if (item.name.match(/武器.*/g) === null) {
            this.player.inventory.splice(this.inventorySelection, 1);
            if (this.inventorySelection >= this.player.inventory.length) {
              this.inventorySelection = this.player.inventory.length - 1;
            }
          }
          this.advanceTurn();
          this.enemyMovementPhase(this.player.x, this.player.y);
          this.enemyAttackPhase();
          this.checkCollisions();
        }
        this.inventoryOpen = false;
        this.render();
        return;
      }
      if (event.key === 'd') {
        if (this.groundItem) return;
        let item = this.player.inventory[this.inventorySelection];
        if (item) {
          if (item.name.match(/武器.*/g) && this.player.weapon === item) {
            this.player.attack -= this.player.weapon.bonus;
            this.player.weapon = null;
            EffectsManager.showEffect(this.gameContainer, this.player, this.player.x, this.player.y, `装備解除-${item.bonus}`, "heal");
          }
          // ここ、アイテムを置く場合は足元に設置する
          if (!this.groundItem) {
            this.groundItem = item;
          } else {
            item.x = this.player.x;
            item.y = this.player.y;
            this.items.push(item);
          }
          this.player.inventory.splice(this.inventorySelection, 1);
          if (this.inventorySelection >= this.player.inventory.length) {
            this.inventorySelection = this.player.inventory.length - 1;
          }
        }
        this.inventoryOpen = false;
        this.render();
        return;
      }
      if (event.key === 'x') {
        if (this.groundItem.tile === '🔼') return; // 足元が階段なら何もしない
        if (this.player.inventory.length === 0) return;
        // 交換処理（所持品内の交換など）
        let invItem = this.player.inventory[this.inventorySelection];
        // ここでは、通常交換処理（例：選択中のアイテムと足元アイテムの交換）はgroundItemが存在している場合のみ行う
        if (this.groundItem) {
          let temp = invItem;
          this.player.inventory[this.inventorySelection] = this.groundItem;
          this.groundItem = temp;
          EffectsManager.showEffect(this.gameContainer, this.player, this.player.x, this.player.y, "交換");
          if (this.groundItem.name.match(/武器.*/g) && this.player.weapon) {
            // インベントリの装備している武器を交換したら外す
            this.groundItem.use(this);
          }
        }
        this.inventoryOpen = false;
        this.render();
        return;
      }
      if (event.key === 'Escape' || event.key === 'e') {
        this.inventoryOpen = false;
        this.render();
        return;
      }
    }
  }
  processInput(event) {
    if (!this.isPlay) return;
    if (this.isGameOver || !this.acceptingInput) return;
    this.ctrlPressed = event.ctrlKey;
    if (event.key === 'e') {
      this.inventoryOpen = !this.inventoryOpen;
      // カーソル初期値は0
      this.inventorySelection = 0;
      this.render();
      return;
    }
    if (this.inventoryOpen) {
      this.processInventoryInput(event);
      return;
    }
    if (window.overlayActive) return;
    const inputResult = this.computeInput(event);
    if (!inputResult) return;
    this.advanceTurn();
    this.updateData(inputResult);
    this.render();
  }
  
  findPath(startX, startY, targetX, targetY) {
    let queue = [];
    queue.push({ x: startX, y: startY, path: [] });
    let visited = new Set();
    visited.add(`${startX},${startY}`);
    const directions = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
      { dx: 1, dy: 1 },
      { dx: -1, dy: -1 },
      { dx: 1, dy: -1 },
      { dx: -1, dy: 1 }
    ];
    while (queue.length > 0) {
      const current = queue.shift();
      if (current.x === targetX && current.y === targetY) return current.path;
      for (const d of directions) {
        const nx = current.x + d.dx;
        const ny = current.y + d.dy;
        if (nx < 0 || ny < 0 || nx >= this.width || ny >= this.height) continue;
        if (this.map.grid[ny][nx] === MAP_TILE.WALL) continue;
        const key = `${nx},${ny}`;
        if (!visited.has(key)) {
          visited.add(key);
          queue.push({ x: nx, y: ny, path: current.path.concat([{ x: nx, y: ny }]) });
        }
      }
    }
    return null;
  }

  /**
   * Game インスタンスの終了・解放処理
   */
  destroy() {
    // タイマーを全て解除
    this.timeoutQueue.forEach(id => clearTimeout(id));
    this.timeoutQueue = [];
    // イベントリスナを解除
    document.removeEventListener('keydown', this.inputHandler);
    // もし他にも登録しているイベントがあれば解除する
    // 例: document.removeEventListener('keyup', this.someOtherHandler);
    
    // 必要であれば、gameContainer などの UI 要素の参照もクリア
    // これによりガベージコレクションが働き、インスタンスが解放される
    this.gameContainer = null;
    this.minimapContainer = null;
    this.isPlay = false;
    
    // 難易度選択マップに戻る
    new DifficultySelector();
  }
  
  checkCollisions() {
    this.gems = this.gems.filter(gem => {
      if (gem.x === this.player.x && gem.y === this.player.y) {
        this.score += 100;
        EffectsManager.showEffect(this.gameContainer, this.player, this.player.x, this.player.y, "+100");
        return false;
      }
      return true;
    });
    setTimeout(() => {
      if (this.player.hp <= 0) {
        this.saveResult();
        this.player = new Player(0, 0, this.initialHP);
        this.isGameOver = true;
        this.timeoutQueue.forEach(id => clearTimeout(id));
        this.timeoutQueue = [];
        this.acceptingInput = true;
        this.restCycle[0] = 0;
        this.generateEnemyCycle[0] = 0;
        this.hungerCycle[0] = 0;
        alert("倒れてしまった！");
        // ゲームオーバー時に終了処理を実行
        this.destroy();
      }
    }, this.actionCount * this.actionTime);
  }
  onHeal() {
    this.player.hp += this.player.healAmount;
    if (this.player.hp > this.player.maxHp) this.player.hp = this.player.maxHp;
    EffectsManager.showEffect(this.gameContainer, this.player, this.player.x, this.player.y, `+${this.player.healAmount}`, "heal");
  }
  gainExp(amount) {
    this.player.exp += amount;
    const expToNext = this.player.level * 10;
    if (this.player.exp >= expToNext) {
      let upAtk, upHp;
      this.player.exp -= expToNext;
      this.player.level++;
      this.player.attack += (upAtk = randomInt(1, 2));
      this.player.maxHp += (upHp = randomInt(2, 3));
      this.player.healAmount++;
      this.player.hp = this.player.maxHp;
      EffectsManager.showEffect(this.gameContainer, this.player, this.player.x, this.player.y, "LEVEL UP!", "heal");
      this.queueTimeout(() => { EffectsManager.showEffect(this.gameContainer, this.player, this.player.x, this.player.y, `HP +${upHp}`, "heal"); }, 500);
      this.queueTimeout(() => { EffectsManager.showEffect(this.gameContainer, this.player, this.player.x, this.player.y, `攻撃力 +${upAtk}`, "heal"); }, 1000);
    }
  }
  playerEat(amount) {
    this.player.hunger += amount;
    if (this.player.hunger > this.player.maxHunger) this.player.hunger = this.player.maxHunger;
    EffectsManager.showEffect(this.gameContainer, this.player, this.player.x, this.player.y, `+${amount}`, "food");
  }
  checkHunger() {
    this.hungerCycle[0] = (this.hungerCycle[0] + 1) % this.hungerCycle[1];
    if (this.hungerCycle[0] === 0) { this.player.hunger--; if (this.player.hunger < 0) this.player.hunger = 0; }
    if (this.player.hunger === 0) { this.player.hp--; EffectsManager.showEffect(this.gameContainer, this.player, this.player.x, this.player.y, "餓死", "damage"); }
  }
  enemyMovementPhase(nextPlayerX, nextPlayerY, attacked = false) {
    let occupied = new Set();
    this.enemies.forEach(e => occupied.add(`${e.x},${e.y}`));
    this.enemies.forEach((enemy) => {
      if (enemy.hp <= 0 || enemy.action === 0) return;
      let dx = Math.abs(enemy.x - this.player.x);
      let dy = Math.abs(enemy.y - this.player.y);
      if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) return;
      else if (dx === 1 && dy === 1) {
        if (this.map.grid[this.player.y][enemy.x] !== MAP_TILE.WALL &&
            this.map.grid[enemy.y][this.player.x] !== MAP_TILE.WALL) return;
      }
      const path = this.findPath(enemy.x, enemy.y, this.player.x, this.player.y);
      if (path && path.length > 0) {
        let candidate = path[0];
        if (enemy.x !== candidate.x && enemy.y !== candidate.y) {
          const horizontalBlocked = (this.map.grid[enemy.y][candidate.x] === MAP_TILE.WALL);
          const verticalBlocked = (this.map.grid[candidate.y][enemy.x] === MAP_TILE.WALL);
          if (horizontalBlocked || verticalBlocked) {
            let possibleMoves = [];
            if (!horizontalBlocked) possibleMoves.push({ x: candidate.x, y: enemy.y });
            if (!verticalBlocked) possibleMoves.push({ x: enemy.x, y: candidate.y });
            candidate = null;
            for (let move of possibleMoves) {
              if (!occupied.has(`${move.x},${move.y}`)) {
                candidate = move;
                break;
              }
            }
            if (!candidate) return;
          }
        }
        if (!attacked && candidate.x === nextPlayerX && candidate.y === nextPlayerY) return;
        if (occupied.has(`${candidate.x},${candidate.y}`)) return;
        occupied.delete(`${enemy.x},${enemy.y}`);
        enemy.action--;
        enemy.x = candidate.x;
        enemy.y = candidate.y;
        occupied.add(`${enemy.x},${enemy.y}`);
      }
    });
  }
  enemyAttackPhase() {
    this.enemies.forEach((enemy) => {
      if (enemy.hp <= 0 || enemy.action === 0) {
        this.x = this.y = -1;
        return;
      }
      const dx = Math.abs(enemy.x - this.player.x);
      const dy = Math.abs(enemy.y - this.player.y);
      if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
        enemy.action--;
        this.queueTimeout(() => {
          this.player.hp -= enemy.atk;
          if (this.player.hp < 0) this.player.hp = 0;
          EffectsManager.showEffect(this.gameContainer, this.player, this.player.x, this.player.y, `-${enemy.atk}`, "damage-me");
        }, this.actionCount * this.actionTime);
        this.actionCount++;
      }
      else if (dx === 1 && dy === 1) {
        if (this.map.grid[this.player.y][enemy.x] !== MAP_TILE.WALL &&
            this.map.grid[enemy.y][this.player.x] !== MAP_TILE.WALL) {
          enemy.action--;
          this.queueTimeout(() => {
            this.player.hp -= enemy.atk;
            if (this.player.hp < 0) this.player.hp = 0;
            EffectsManager.showEffect(this.gameContainer, this.player, this.player.x, this.player.y, `-${enemy.atk}`, "damage-me");
          }, this.actionCount * this.actionTime);
          this.actionCount++;
        }
      }
    });
  }
  enemyActionRefresh() {
    this.enemies.forEach((enemy) => { enemy.action = enemy.maxAction; });
  }
  damageEnemy(enemy, index) {
    var hor = this.keyX, ver = this.keyY;
    if (this.player.weapon)
      EffectsManager.showAttackMotionWeapon(this.gameContainer, hor, ver, this.player.weapon.tile);
    else
      EffectsManager.showAttackMotionNoWeapon(this.gameContainer, hor, ver);
    
    enemy.takeDamage(this.player.attack);
    EffectsManager.showEffect(this.gameContainer, this.player, enemy.x, enemy.y, `-${this.player.attack}`, "damage");
    this.actionCount++;
    if (enemy.hp <= 0) {
      EffectsManager.showEffect(this.gameContainer, this.player, enemy.x, enemy.y, "💥", "explosion");
      this.enemies.splice(index, 1);
      this.score += 50;
      this.gainExp(5);
    }
  }
  renderMainView() {
    let html = '';
    var radius = CONFIG.VIEW_RADIUS;
    const startX = this.player.x - radius;
    const startY = this.player.y - radius;
    for (let y = startY; y <= this.player.y + radius; y++) {
      for (let x = startX; x <= this.player.x + radius; x++) {
        let tile = MAP_TILE.WALL;
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
          if (!this.map.visible[y][x]) { html += `<span class="wall ${CONFIG.DIFFICULTY}">${MAP_TILE.WALL}</span>`; continue; }
          else if (this.player.x === x && this.player.y === y) tile = this.player.tile;
          else {
            let drawn = false;
            for (let enemy of this.enemies) {
              if (enemy.x === x && enemy.y === y) { tile = enemy.tile; drawn = true; break; }
            }
            if (!drawn) {
              for (let item of this.items) {
                if (item.x === x && item.y === y) { tile = item.tile; drawn = true; break; }
              }
              for (let gem of this.gems) {
                if (gem.x === x && gem.y === y) { tile = '💎'; drawn = true; break; }
              }
              if (!drawn && this.stairs.x === x && this.stairs.y === y) tile = MAP_TILE.STEPS;
              if (!drawn && tile === MAP_TILE.WALL) tile = this.map.grid[y][x];
            }
          }
        }
        html += `<span class="${CONFIG.DIFFICULTY}">${tile}</span>`;
      }
      html += '<br>';
    }
    this.gameContainer.innerHTML = html;
  }
  renderMinimap() {
    let html = '';
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        let style = "";
        if (this.map.visible[y][x]) {
          if (this.player.x === x && this.player.y === y) style = "background-color: yellow;";
          else if (this.enemies.some(e => e.x === x && e.y === y)) style = "background-color: red;";
          else if (this.items.some(item => item.x === x && item.y === y)) style = "background-color: cyan;";
          else if (this.stairs.x === x && this.stairs.y === y) style = "border: 1px solid cyan; background-color: transparent;";
          else style = (this.map.grid[y][x] === ' ') ? "background-color: #555;" : "background-color: #222;";
        }
        html += `<div class="minimap-cell" style="${style}"></div>`;
      }
    }
    this.minimapContainer.innerHTML = html;
    this.minimapContainer.style.gridTemplateColumns = `repeat(${this.width}, 4px)`;
  }
  render() {
    if (!this.isPlay) return;
    document.body.classList.remove("easy-dungeon", "hard-dungeon", "deep-dungeon");
    if (this.floor < 10) document.body.classList.add("easy-dungeon");
    else if (this.floor < 50) document.body.classList.add("hard-dungeon");
    else document.body.classList.add("deep-dungeon");
    const maxFloor = difficultySettings[CONFIG.DIFFICULTY].maxFloor;
    const brightness = 80 - ((this.floor - 1) / (maxFloor - 1)) * 60;
    document.body.style.backgroundColor = `hsl(0, 0%, ${brightness}%)`;
    this.renderMainView();
    this.renderMinimap();
    document.getElementById('difficulty').innerText = CONFIG.DIFFICULTY;
    document.getElementById('hp').innerText = this.player.hp;
    document.getElementById('maxhp').innerText = this.player.maxHp;
    document.getElementById('atk').innerText = this.player.attack;
    document.getElementById('lv').innerText = this.player.level;
    document.getElementById('exp').innerText = this.player.exp;
    document.getElementById('floor').innerText = this.floor;
    document.getElementById('score').innerText = this.score;
    document.getElementById('hunger').innerText = this.player.hunger;
    document.getElementById('maxhunger').innerText = this.player.maxHunger;
    this.uiManager.update(this.player);
    if (this.inventoryOpen) {
      let invHtml = `<div class="inventory-modal">`;
      invHtml += `<h3>所持品 (${this.player.inventory.length + (this.groundItem ? 1 : 0)}/${CONFIG.INVENTORY_MAX})</h3>`;
      invHtml += `<ul style="min-height:20px;">`;
      for (let i = 0; i < this.player.inventory.length; i++) {
        let selected = (i === this.inventorySelection) ? ">> " : "";
        let itemName = this.player.inventory[i].name || "アイテム";
        if (this.player.inventory[i].name.match(/武器.*/g) && this.player.weapon === this.player.inventory[i])
          itemName += " (装備中)";
        invHtml += `<li class="${(i===this.inventorySelection) ? 'selected' : ''}">${selected}${this.player.inventory[i].tile} ${itemName}</li>`;
      }
      invHtml += `</ul>`;
      invHtml += `<p>（U: 使用, ${!this.groundItem ? "D: 置く" : "X: 交換"}, ESC/E: 閉じる）</p>`;
      if (this.groundItem) {
        invHtml += `<hr>`;
        invHtml += `<h3>足元</h3>`;
        invHtml += `<ul style="min-height:20px;">`;
        let index = this.player.inventory.length;
        let selected = (index === this.inventorySelection) ? ">> " : "";
        invHtml += `<li class="${(index === this.inventorySelection) ? 'selected' : ''}">${selected}${this.groundItem.tile} ${this.groundItem.tile === '🔼' ? "階段" : this.groundItem.name}</li>`;
        invHtml += `</ul>`;
        if (this.groundItem.tile === '🔼') {
          invHtml += `<p>（U: 降りる）</p>`;
        } else {
          invHtml += `<p>（${this.player.inventory.length < CONFIG.INVENTORY_MAX ? "P: 拾う, " : ""}U: 使用）</p>`;
        }
      }
      invHtml += `</div>`;
      this.gameContainer.innerHTML += invHtml;
    }
  }
  saveResult(clear = false) {
    let results = JSON.parse(localStorage.getItem("gameResult") || "[]");
    results.push({
      date: new Date().toISOString(),
      dungeonLv: CONFIG.DIFFICULTY,
      floor: this.floor,
      clear: clear,
      lv: this.player.level,
      score: this.score
    });
    localStorage.setItem("gameResult", JSON.stringify(results));
  }
  showResults() {
    let results = JSON.parse(localStorage.getItem("gameResult") || "[]");
    let modalHtml = '<div class="results-modal" id="resultsModal">';
    modalHtml += '<h3>記録された結果</h3>';
    if (results.length === 0) modalHtml += '<p>記録がありません。</p>';
    else {
      modalHtml += '<table><tr><th>日付</th><th>難易度</th><th>フロア</th><th>結果</th><th>レベル</th><th>スコア</th></tr>';
      results.forEach(r => {
        modalHtml += `<tr><td>${new Date(r.date).toLocaleString()}</td><td>${r.dungeonLv == undefined ? "-" : r.dungeonLv}</td><td>${r.floor}</td><td>${r.clear ? "クリア" : "ゲームオーバー"}</td><td>${r.lv}</td><td>${r.score}</td></tr>`;
      });
      modalHtml += '</table>';
    }
    modalHtml += '<button onclick="closeResults()">閉じる</button>';
    modalHtml += '</div>';
    const existingModal = document.getElementById("resultsModal");
    if (!existingModal) {
      const modalDiv = document.createElement("div");
      modalDiv.innerHTML = modalHtml;
      document.body.appendChild(modalDiv);
    }
  }
  generateDungeon(keepHP = false) {
    const prevHP = this.player.hp;
    const prevScore = this.score;
    this.map.generate();
    this.enemies = [];
    this.items = [];
    this.gems = [];
    const firstRoom = this.map.rooms[0];
    this.player.x = firstRoom.x + 1;
    this.player.y = firstRoom.y + 1;
    this.map.revealRoom(this.player.x, this.player.y);
    this.map.revealAround(this.player.x, this.player.y);
    if (!keepHP) {
      this.player.hp = this.initialHP;
      this.score = 0;
      this.floor = 1;
      this.player.hunger = this.player.maxHunger;
    } else {
      this.player.hp = prevHP;
      this.score = prevScore;
      this.floor++;
      
      if (this.floor > difficultySettings[CONFIG.DIFFICULTY].maxFloor) {
        this.saveResult(true);
        alert("ダンジョンクリア！おめでとう！");
        // ゲームクリア時にも終了処理を実行
        this.destroy();
        return;
      }
    }
    
    const lastRoom = this.map.rooms.at(-1);
    this.stairs.x = lastRoom.x + 2;
    this.stairs.y = lastRoom.y + 2;
    this.map.grid[this.stairs.y][this.stairs.x] = MAP_TILE.STEPS;
    if (CONFIG.DIFFICULTY === "hard") {
      this.minMagnification = 1.4;
      this.maxMagnification = 1.7;
    } else {
      this.minMagnification = CONFIG.MIN_ENEMY_MULTIPLIER;
      this.maxMagnification = CONFIG.MAX_ENEMY_MULTIPLIER;
    }
    this.placeEntities(this.enemies, randomInt(2, 4), "enemy");
    this.placeEntities(this.gems, randomInt(1, 2), "entity");
    const maxItems = randomInt(3, 5);
    const weightedTypes = [
      ...Array(2).fill("food"),
      ...Array(2).fill("sushi"),
      ...Array(1).fill("magic"),
      ...Array(1).fill("niku"),
      ...Array(2).fill("weapon")
    ];
    for (let i = 0; i < maxItems; i++) {
      const type = weightedTypes.splice(randomInt(0, weightedTypes.length - 1), 1)[0];
      this.placeEntities(this.items, 1, type);
    }
  }
  placeEntities(arr, count, type) {
    for (let i = 0; i < count; i++) {
      let x, y, hp;
      do {
        const room = this.map.rooms[randomInt(0, this.map.rooms.length - 1)];
        x = randomInt(room.x + 1, room.x + room.w - 2);
        y = randomInt(room.y + 1, room.y + room.h - 2);
        if (type === "enemy") {
          hp = randomInt(
            Math.round(Math.pow(this.floor, this.minMagnification)),
            Math.round(Math.pow(this.floor, this.maxMagnification))
          );
        }
      } while (this.map.grid[y][x] !== ' ' || (x === this.player.x && y === this.player.y));
      if (type === "sushi") {
        arr.push(new InventoryItem(x, y, "すし", '🍣', function(game) {
          game.player.hp += 3;
          if (game.player.hp > game.player.maxHp) game.player.hp = game.player.maxHp;
          EffectsManager.showEffect(game.gameContainer, game.player, game.player.x, game.player.y, "+3", "heal");
        }));
      } else if (type === "niku") {
        arr.push(new InventoryItem(x, y, "お肉", '🍖', function(game) {
          game.player.hp += 6;
          if (game.player.hp > game.player.maxHp) game.player.hp = game.player.maxHp;
          EffectsManager.showEffect(game.gameContainer, game.player, game.player.x, game.player.y, "+6", "heal");
        }));
      } else if (type === "weapon") {
        var selection = randomInt(1, 2);
        let bonus = randomInt(1, 3);
        switch (selection) {
        case 1:
          bonus = randomInt(1, 3);
          arr.push(new WeaponItem(x, y, `武器-剣 (+${bonus})`, '🗡️', bonus));
          break;
        case 2:
          bonus = randomInt(2, 5);
          arr.push(new WeaponItem(x, y, `武器-斧 (+${bonus})`, '🪓', bonus));
          break;
        }
      } else if (type === "magic") {
        var selection = randomInt(1, 4);
        switch (selection) {
        case 1:
            arr.push(new MagicSpell(x, y, "火の玉", '🔥', '🔥', {damage: 12, area: 1, fallbackHeal: null}));
          break;
        case 2:
            arr.push(new MagicSpell(x, y, "たつまき", '🌪️', '🌪️', {damage: 10, area: 2, fallbackHeal: null}));
          break;
        case 3:
            arr.push(new MagicSpell(x, y, "大波", '🌊', '🌊', {damage: 8, area: 4, fallbackHeal: null}));
          break;
        case 4:
            arr.push(new MagicSpell(x, y, "カミナリ", '⚡️', '⚡️', {damage: 15, area: 1, fallbackHeal: null}));
          break;
        }
      } else if (type === "entity") {
        arr.push(new BaseEntity(x, y));
      } else if (type === "enemy") {
        const enemys = enemyList(this.floor, CONFIG.DIFFICULTY);
        const EnemyClass = enemys[randomInt(0, enemys.length - 1)];
        arr.push(new EnemyClass(x, y, hp));
      } else if (type === "food") {
        if (Math.random() > 0.7) {
          arr.push(new InventoryItem(x, y, "パン", '🥖', function(game) {
            game.player.hunger += 20;
            if (game.player.hunger > game.player.maxHunger) game.player.hunger = game.player.maxHunger;
            EffectsManager.showEffect(game.gameContainer, game.player, game.player.x, game.player.y, "+20", "food");
          }));
        } else {
          arr.push(new InventoryItem(x, y, "大きなパン", '🍞', function(game) {
            game.player.hunger += 50;
            if (game.player.hunger > game.player.maxHunger) game.player.hunger = game.player.maxHunger;
            EffectsManager.showEffect(game.gameContainer, game.player, game.player.x, game.player.y, "+50", "food");
          }));
        }
      }
    }
  }
}
