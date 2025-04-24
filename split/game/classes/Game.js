// Game クラス
class Game {
	/* 1. 初期化・セットアップ */
	// ゲームの初期状態（マップ、プレイヤー、UI、タイマー、キー入力管理など）をセットアップし、各種オブジェクトの初期化とイベント登録を行います。
	constructor(myIcon) {
		// ------------------------------
		// 基本設定とプレイヤー初期化
		// ------------------------------
		this.myIcon = myIcon;
		this.isPlay = true;
		this.initialHP = CONFIG.INITIAL_HP;
		// プレイヤーの生成とアイコンの設定
		this.player = new Player(0, 0, this.initialHP);
		this.player.tile = myIcon;

		// ------------------------------
		// キー入力関連の初期化
		// ------------------------------
		this.keyX = 0;
		this.keyY = 0;
		this.keysDown = {};
		this.acceptingInput = true;
		this.ctrlPressed = false;

		// ------------------------------
		// ゲーム進行管理
		// ------------------------------
		this.actionCount = 0;
		this.actionTime = 400;
		this.score = 0;
		this.floor = 1;
		this.isGameOver = false;

		// ------------------------------
		// マップ・画面関連設定
		// ------------------------------
		this.width = CONFIG.WIDTH;
		this.height = CONFIG.HEIGHT;
		this.map = new DungeonMap(this.width, this.height);
		this.gameContainer = document.getElementById("game");
		this.minimapContainer = document.getElementById("minimap");

		// ------------------------------
		// サイクル管理
		// ------------------------------
		// 敵生成、休息、空腹の各サイクル（初期値と設定値）
		this.generateEnemyCycle = [0, CONFIG.GENERATE_ENEMY_CYCLE];
		this.restCycle = [0, CONFIG.REST_CYCLE];
		this.hungerCycle = [0, CONFIG.HUNGER_CYCLE];
		// 休息サイクルを表示
		document.getElementById("restCycle").innerText = CONFIG.REST_CYCLE;

		// ------------------------------
		// アイテム・敵・その他のオブジェクト
		// ------------------------------
		this.timeoutQueue = [];
		this.items = [];
		this.gems = [];
		this.enemies = [];
		this.stairs = { x: 0, y: 0 };
		this.boxSelected = null;
		// 足元にあるアイテム（存在する場合）
		this.groundItem = null;
		// インベントリ状態（所持品＋足元アイテムがある場合は1つ追加）
		this.inventorySelection = 0;
		this.inventoryOpen = false;
		this.boxOverlayActive = false;

		// ------------------------------
		// UI関連の初期化
		// ------------------------------
		this.uiManager = new UIManager();

		// ------------------------------
		// ダンジョン生成と初期描画
		// ------------------------------
		this.generateDungeon(false);
		this.render();

		// ------------------------------
		// メッセージの初期化
		// ------------------------------
		this.message = new MessageManager(this)
		this.message.clear()
		////this.message.add("もちのこうげき！")
		////this.message.add("かにはぼうぎょした！")
		////this.message.add("うにがキャベツをたべている！")

		// ------------------------------
		// ※ 以下はプレイヤー初期アイテムの例（必要に応じてコメント解除）
		// ------------------------------
		// this.player.inventory.push(new ShootingItem(0, 0, "射撃-弓矢", '🏹', 5, 10, 8, "↑"));
		// this.player.inventory.push(new BoxItem());
		// this.player.inventory.push(new MagicSpell(0, 0, "炎", "🔥", "🔥", {damage: 20, area: 1, fallbackHeal: null}));
		
		EffectsManager.showFloorOverlay(this.gameContainer, this.floor)
		
		// BGM
		this.bgmBox = new BGMManager()
		this.seBox = new SEManager()
		this.seBox.loadfile()

		this.bgmBox.loadfile().then(() => {
			switch (CONFIG.DIFFICULTY) {
			case "easy":
				this.bgmBox.playEasy()
				break
			case "normal":
				this.bgmBox.playNormal()
				break
			case "normalPlus":
				//this.bgmBox.playNormal()
				break
			case "hard":
				//this.bgmBox.playNormal()
				break
			}
		})

		switch (CONFIG.DIFFICULTY) {
		case "easy":
			break
		case "normal":
			break
		case "normalPlus":
			EffectsManager.showFieldEffect(this.gameContainer, "❄", 50)
			//this.bgmBox.playNormal()
			break
		case "hard":
			EffectsManager.showFieldEffect(this.gameContainer, "🔥", 10)
			//this.bgmBox.playNormal()
			break
		}

		setTimeout(() => {
			new InputManager(this)
		}, 300)
	}
	// ターン進行中の非同期処理（タイマー）の管理を行い、指定した遅延で処理を実行します。
	queueTimeout(callback, delay) {
		this.acceptingInput = false
		const id = setTimeout(() => {
			callback()
			this.timeoutQueue = this.timeoutQueue.filter(t => t !== id)
			if (this.timeoutQueue.length === 0) this.acceptingInput = true
			this.render()
		}, delay)
		this.timeoutQueue.push(id)
	}
	
	/* 2. 入力処理 */
	// キー入力からプレイヤーの移動や休憩といった基本動作を算出します。
	computeInput(event) {
		if (this.keysDown['ArrowLeft'] ||
				this.keysDown['ArrowRight'] ||
				this.keysDown['ArrowUp'] ||
				this.keysDown['ArrowDown'] ||
				event.key === '.') {
			this.restCycle[0] = (this.restCycle[0] + 1) % this.restCycle[1]
			if (this.restCycle[0] === 0 && this.player.hp < this.player.maxHp) this.player.hp++
		}
		if (this.keysDown['Shift']) {
			let hor = 0, ver = 0
			if (this.keysDown['ArrowLeft'] && !this.keysDown['ArrowRight']) { this.keyX = hor = -1; }
			else if (this.keysDown['ArrowRight'] && !this.keysDown['ArrowLeft']) { this.keyX = hor = 1; }
			if (this.keysDown['ArrowUp'] && !this.keysDown['ArrowDown']) { this.keyY = ver = -1; }
			else if (this.keysDown['ArrowDown'] && !this.keysDown['ArrowUp']) { this.keyY = ver = 1; }
			if (hor !== 0 && ver !== 0) {
				if (this.map.grid[this.player.y][this.player.x + hor] === MAP_TILE.WALL ||
						this.map.grid[this.player.y + ver][this.player.x] === MAP_TILE.WALL) return null
				return { tx: this.player.x + hor, ty: this.player.y + ver }
			}
			return null
		}
		if (event.key === '.') {
			this.keyX = this.keyY = 0
			return { tx: this.player.x, ty: this.player.y }
		}
		//if (event.key === 'r') { this.showResults(); return null; }
		let dx = 0, dy = 0, count = 0
		if (this.keysDown['ArrowLeft']) { this.keyX = dx = -1; this.keyY = 0; count++; }
		if (this.keysDown['ArrowRight']) { this.keyX = dx = 1; this.keyY = 0; count++; }
		if (this.keysDown['ArrowUp']) { this.keyY = dy = -1; this.keyX = 0; count++; }
		if (this.keysDown['ArrowDown']) { this.keyY = dy = 1; this.keyX = 0; count++; }
		if (count === 1) {
			if (this.map.grid[this.player.y + dy]?.[this.player.x + dx] === MAP_TILE.WALL) return null
			return { tx: this.player.x + dx, ty: this.player.y + dy }
		}
		return null
	}
	// ゲーム中のキー入力を処理し、通常の移動や攻撃、インベントリ表示などを分岐します。
	processInput(event) {
		if (!this.isPlay) return
		if (this.isGameOver || !this.acceptingInput || this.boxOverlayActive || this.isAwaitingShootingDirection) return

		this.ctrlPressed = event.ctrlKey
		if (!window.overlayActive && !this.inventoryOpen && event.key === 'o') {
			this.seBox.playMenu(2)
			EffectsManager.showGiveUpConfirmationKeyboard(this)
		}
		if (event.key === 'e') {
			this.inventoryOpen = !this.inventoryOpen
			this.seBox.playMenu(this.inventoryOpen ? 2 : 4)
			// カーソル初期値は0
			this.inventorySelection = 0
			this.render()
			return;
		}
		if (this.inventoryOpen) {
			this.processInventoryInput(event)
			return;
		}
		if (window.overlayActive) { return; }
		const inputResult = this.computeInput(event)
		if (!inputResult) { return; }
		this.advanceTurn()
		this.updateData(inputResult)
		this.render()
	}
	// インベントリが開いている場合の入力（カーソル移動、使用、置く、交換、入れるなど）を処理します。
	async processInventoryInput(event) {
		// まず、選択範囲は所持品リスト＋足元アイテム（ある場合）
		const totalOptions = this.player.inventory.length + (this.groundItem ? 1 : 0)
		
		// デバッグ用コマンド： 'w' キーで階段ワープ
		/*if (event.key === 'w') {
			// プレイヤーを階段の位置にワープ
			this.player.x = this.stairs.x
			this.player.y = this.stairs.y
			// マップの視界を更新（階段周辺を見えるようにする）
			this.map.revealRoom(this.player.x, this.player.y)
			this.map.revealAround(this.player.x, this.player.y)
			// エフェクトを表示してデバッグ感を出す（例：WARP 表示）
			EffectsManager.showEffect(this.gameContainer, this.player, this.player.x, this.player.y, "WARP", "heal")
			// # MESSAGE
			// ターンを進めたり、レンダリングを更新
			this.advanceTurn()
			this.render()
			return
		}*/
		
		// カーソル移動
		if (event.key === 'ArrowUp') {
			if (totalOptions > 0) {
				this.seBox.playMenu(3)
				this.inventorySelection = (this.inventorySelection - 1 + totalOptions) % totalOptions
				this.render()
			}
			return
		}
		if (event.key === 'ArrowDown') {
			if (totalOptions > 0) {
				this.seBox.playMenu(3)
				this.inventorySelection = (this.inventorySelection + 1) % totalOptions
				this.render()
			}
			return
		}
		// 以下、キーの処理
		// もしカーソルが足元アイテム（＝インベントリリストの最後の項目）を指している場合
		if (this.groundItem && this.inventorySelection === this.player.inventory.length && !this.boxSelected) {
			if (event.key === 'p') {
				if (this.groundItem.tile === '🔼') return; // 足元が階段なら何もしない
				this.seBox.playPickup()
				// 足元アイテムを拾う
				pickupItem(this, this.groundItem)
				this.render()
				return
			}
			if (event.key === 'u') {
				// 足元が階段なら降りる
				if (this.groundItem.tile === '🔼') {
					this.inventoryOpen = false
					this.groundItem = null
					this.generateDungeon(true)
					this.render()
					EffectsManager.showFloorOverlay(this.gameContainer, this.floor)
					return
				}
				// 足元アイテムを使用
				else if (this.groundItem.use) {
					this.inventoryOpen = false
					this.render()
					// インベントリがマックスで足元の武器を装備できない
					if (this.groundItem.name.match(/武器.*/g) && this.player.inventory.length >= CONFIG.INVENTORY_MAX) return
					this.groundItem.use(this).then(()	=> {
						// もし足元のアイテムが武器なら、使用後にインベントリへ追加
						if (this.groundItem.name.match(/(武器.*)/g)) {
							if (this.player.inventory.length < CONFIG.INVENTORY_MAX) {
								this.player.inventory.push(this.groundItem)
							} else {
								this.items.push(this.groundItem)
							}
						}
						// 箱は消費しない
						if (!this.groundItem.name.match(/箱.*/g)) {
							this.groundItem = null
						}
					})
				}
				this.inventoryOpen = false
				this.render()
				return
			}
			if (event.key === 'x') {
				return
			}
		} else {
			// 通常の所持品の操作
			if (event.key === 'u' && !this.boxSelected) {
				let item = this.player.inventory[this.inventorySelection]
				this.inventoryOpen = false
				if (item && item.use) {
					this.render()
					// アイテムを使う
					await item.use(this)
					// 武器・箱じゃなければ消費する
					if (!(item instanceof WeaponItem) && !(item instanceof BoxItem) &&
							// 射撃じゃなければ消費、射撃でも数が0なら消費する
							/// item = ShootingItem && item.stack === 0
							/// !(item = ShootingItem)
							(!(item instanceof ShootingItem) || item.stack === 0)) {
						this.player.inventory.splice(this.inventorySelection, 1)
						if (this.inventorySelection >= this.player.inventory.length) {
							this.inventorySelection = this.player.inventory.length - 1
						}
					}
					// 箱を見る以外ならターンを進める
					if (!(item instanceof BoxItem)) {
						this.turn()
					}
				}
				this.render()
				return
			}
			if (event.key === 'd' && !this.boxSelected) {
				if (this.groundItem) return
				let item = this.player.inventory[this.inventorySelection]
				if (item) {
					if (item.name.match(/武器.*/g) && this.player.weapon === item) {
						this.player.attack -= this.player.weapon.bonus
						this.player.weapon = null
						EffectsManager.showEffect(this.gameContainer, this.player, this.player.x, this.player.y, `装備解除-${item.bonus}`, "heal")
						this.message.add(`${item.name}の装備を外した`)
						// # MESSAGE
					}
					// ここ、アイテムを置く場合は足元に設置する
					if (!this.groundItem) {
						this.groundItem = item
					} else {
						item.x = this.player.x
						item.y = this.player.y
						this.items.push(item)
					}
					this.player.inventory.splice(this.inventorySelection, 1)
					if (this.inventorySelection >= this.player.inventory.length) {
						this.inventorySelection = this.player.inventory.length - 1
					}
				}
				this.inventoryOpen = false
				this.render()
				return
			}
			if (event.key === 'x' && !this.boxSelected) {
				if (this.groundItem.tile === '🔼') return; // 足元が階段なら何もしない
				if (this.player.inventory.length === 0) return
				// 交換処理（所持品内の交換など）
				let invItem = this.player.inventory[this.inventorySelection]
				// ここでは、通常交換処理（例：選択中のアイテムと足元アイテムの交換）はgroundItemが存在している場合のみ行う
				if (this.groundItem) {
					let temp = invItem
					this.player.inventory[this.inventorySelection] = this.groundItem
					this.groundItem = temp
					EffectsManager.showEffect(this.gameContainer, this.player, this.player.x, this.player.y, "交換")
					this.message.add(`${temp.name}と${this.player.inventory[this.inventorySelection].name}を交換した`)
					this.seBox.playPickup()
					// # MESSAGE
					if (this.groundItem.name.match(/武器.*/g) && this.player.weapon) {
						// インベントリの装備している武器を交換したら外す
						this.groundItem.use(this)
					}
				}
				this.inventoryOpen = false
				this.render()
				return
			}
			if (event.key === 'i') { // 入れる操作
				const selectedItem = this.player.inventory[this.inventorySelection] || this.groundItem
				//console.group("選択中")
				//console.log(selectedItem)
				//console.groupEnd("選択中")
				//console.group("足元")
				//console.log(this.groundItem)
				//console.groupEnd("足元")
				//console.group("一致")
				//console.log(this.groundItem === selectedItem)
				//console.groupEnd("一致")
				// 仮に、別途箱用の選択状態（this.boxSelected）があれば、その箱に入れる
				if (this.boxSelected && !(selectedItem instanceof BoxItem)) {
					if (this.boxSelected.insertItem(selectedItem)) {
						if (selectedItem instanceof WeaponItem) {
							// 箱に入れたので、装備を解除
							selectedItem.use(this)
						}
						if (this.groundItem === selectedItem) {
							// 足元のアイテムを入れたら足元を削除
							this.groundItem = null
						} else {
							// 箱に入れたので、インベントリから削除
							this.player.inventory.splice(this.inventorySelection, 1)
						}
						
						// インベントリの参照を修正する
						if (this.player.inventory.length <= this.inventorySelection) {
							this.inventorySelection--
						}
						
						this.boxSelected.updateName()
						this.render()
						return
					} else {
						EffectsManager.showEffect(this.gameContainer, this.player, this.player.x, this.player.y, "容量オーバー", "damage")
						this.message.add(`これ以上入れられない`)
						// # MESSAGE
					}
				} else if (this.boxSelected === selectedItem) {
					this.boxSelected = null
				} else if (selectedItem instanceof BoxItem) {
					this.boxSelected = selectedItem
				}
				this.render()
			}
			if (event.key === 'Escape' || event.key === 'e') {
				this.seBox.playMenu(4)
				this.inventoryOpen = false
				this.boxSelected = null
				this.render()
				return
			}
		}
	}
	
	/* 3. ターン進行・ゲームロジック */
	// ターン毎のカウンター（敵生成、飢餓、休憩回復など）の進行処理を行います。
	advanceTurn() {
		this.generateEnemyCycle[0] = (this.generateEnemyCycle[0] + 1) % this.generateEnemyCycle[1]
		this.hungerCycle[0] = (this.hungerCycle[0] + 1) % this.hungerCycle[1]
	}
	// プレイヤーの移動や攻撃後のゲーム状態（敵へのダメージ、アイテム取得、マップの視界更新など）を更新します。
	async updateData(inputResult) {
		if (!inputResult) return
		this.actionCount = 0
		const { tx, ty } = inputResult
		let attacked = false
		for (let i = 0; i < this.enemies.length; i++) {
			if (this.enemies[i].x === tx && this.enemies[i].y === ty) {
				attacked = true
				this.damageEnemy(this.enemies[i], i)
				break
			}
		}
		// 移動前に、もし足元にアイテムがあれば、プレイヤーの現在位置に残す
		if (!attacked && (this.keyX || this.keyY) && this.map.grid[ty]?.[tx] !== MAP_TILE.WALL &&
				!this.enemies.some(e => e.x === tx && e.y === ty)) {
			if (this.groundItem) {
				 this.groundItem.x = this.player.x
				 this.groundItem.y = this.player.y
				 this.items.push(this.groundItem)
				 this.groundItem = null
			}
			this.player.x = tx
			this.player.y = ty
			this.map.visible[ty][tx] = true
			this.map.revealRoom(tx, ty)
			this.map.revealAround(tx, ty)
		}
		if (!attacked && (this.keyX || this.keyY) && this.player.x === this.stairs.x && this.player.y === this.stairs.y) {
			this.seBox.playMenu(2)
			// ここで選択肢のオーバーレイを表示
			EffectsManager.showStairConfirmationKeyboard(() => {
				// 「降りる」を選んだ場合
				this.generateDungeon(true)
				this.render()
				EffectsManager.showFloorOverlay(this.gameContainer, this.floor)
			}, () => {
				this.seBox.playMenu(4)
				// 「キャンセル」を選んだ場合、必要に応じてプレイヤー位置を戻すなどの処理
				this.groundItem = new BaseEntity(tx, ty, '🔼')
				
				// 例: 現在の位置から少しずらす（ここは実装に合わせて調整）
				this.render()
			})
			
			return
		}
		this.items = this.items.filter(item => {
			if (item.x === this.player.x && item.y === this.player.y) {
				// アイテムを拾う
				if (!this.ctrlPressed && !pickupItem(this, item)) {
					this.message.add(`${item.name}を拾った`);
					this.seBox.playPickup()
					return false; // マップ上から削除
				} else {
					// 拾わなかった場合の処理
					if (!this.groundItem) {
						this.groundItem = item
						EffectsManager.showEffect(this.gameContainer, this.player, this.player.x, this.player.y, `${this.groundItem.name}に乗った`)
						this.message.add(`${this.groundItem.name}に乗った`)
						// # MESSAGE
						return false; // マップ上から削除
					}
				}
			}
			return true; // マップ上に残す
		})
		this.checkHunger()
		
		// 敵の最大行動回数を取得
		let maxAction = Math.max(...(this.enemies.map(e => e.maxAction)))
		for (var i=0; i<maxAction; i++) {
			await new Promise((resolve) => {
				if (attacked) {
					this.enemyAttackPhase()
					this.enemyMovementPhase(tx, ty, attacked)
				} else {
					this.enemyMovementPhase(tx, ty)
					this.enemyAttackPhase()
				}
				resolve()
			})
			this.queueTimeout(() => { this.enemyActionRefresh(); }, this.actionCount * this.actionTime)
		}
		this.checkCollisions()
		if (this.generateEnemyCycle[0] === 0) {
			this.placeEntities(this.enemies, randomInt(1, 3), "enemy")
		}
	}
	// プレイヤーの飢餓状態を管理し、一定タイミングで飢えによるダメージなどを適用します。
	checkHunger() {
		if (this.hungerCycle[0] === 0) { this.player.hunger--; if (this.player.hunger < 0) this.player.hunger = 0; }
		if (this.player.hunger === 0) {
			this.player.hp--; EffectsManager.showEffect(this.gameContainer, this.player, this.player.x, this.player.y, "餓死", "damage");
			this.message.add(`空腹でダメージを受けた`)
			this.seBox.playDamageMe()
			// # MESSAGE
		}
	}
	// プレイヤーと他エンティティとの衝突判定を行い、スコア加算やゲームオーバー処理などに反映させます。
	checkCollisions() {
		this.gems = this.gems.filter(gem => {
			if (gem.x === this.player.x && gem.y === this.player.y) {
				this.score += 100
				EffectsManager.showEffect(this.gameContainer, this.player, this.player.x, this.player.y, "+100")
				this.message.add(`宝石を拾った`)
				// # MESSAGE
				return false
			}
			return true
		})
		setTimeout(() => {
			if (this.player.hp <= 0) {
				this.saveResult()
				this.player = new Player(0, 0, this.initialHP)
				this.isGameOver = true
				this.timeoutQueue.forEach(id => clearTimeout(id))
				this.timeoutQueue = []
				this.acceptingInput = true
				this.restCycle[0] = 0
				this.generateEnemyCycle[0] = 0
				this.hungerCycle[0] = 0
				alert("倒れてしまった！")
				// ゲームオーバー時に終了処理を実行
				this.destroy()
			}
		}, this.actionCount * this.actionTime)
	}
	// 敵の移動のために、プレイヤーまでの経路を探索します（経路探索アルゴリズム）。
	findPath(startX, startY, targetX, targetY) {
		const queue = [{ x: startX, y: startY, path: [] }];
		const visited = new Set();
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
			// ゴールに到達したら経路を返す
			if (current.x === targetX && current.y === targetY) {
				return current.path;
			}
			
			for (const d of directions) {
				const nx = current.x + d.dx;
				const ny = current.y + d.dy;
				
				// グリッド外は除外
				if (nx < 0 || ny < 0 || nx >= this.width || ny >= this.height) continue;
				// 壁なら除外（この条件はグリッドデータと MAP_TILE.WALL の値が一致している前提）
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
	// 敵の移動処理を行い、プレイヤーとの距離や障害物を考慮して移動先を決定します。
	enemyMovementPhase(nextPlayerX, nextPlayerY, attacked = false) {
		let occupied = new Set()
		this.enemies.forEach(e => occupied.add(`${e.x},${e.y}`))
		
		this.enemies.forEach((enemy) => {
			if (enemy.hp <= 0 || enemy.action === 0) return
			
			let dx = Math.abs(enemy.x - this.player.x)
			let dy = Math.abs(enemy.y - this.player.y)
			if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) return
			else if (dx === 1 && dy === 1) {
				if (this.map.grid[this.player.y][enemy.x] !== MAP_TILE.WALL &&
						this.map.grid[enemy.y][this.player.x] !== MAP_TILE.WALL) return
			}
			
			let path = this.findPath(enemy.x, enemy.y, this.player.x, this.player.y)
			if (path && path.length > 0) {
				let candidate = path[0]
				// もし候補セルが既に occupied に含まれている場合
				if (occupied.has(`${candidate.x},${candidate.y}`)) {
					// そのセルを壁として扱い、再計算する
					let altPath = this.findPathWithExtraBlocker(enemy.x, enemy.y, this.player.x, this.player.y, candidate)
					if (altPath && altPath.length > 0) {
						candidate = altPath[0]
						path = altPath
					} else {
						// 再計算でも通れなければ、この敵は動かさない
						return
					}
				}
				
				if (enemy.x !== candidate.x && enemy.y !== candidate.y) {
					const horizontalBlocked = (this.map.grid[enemy.y][candidate.x] === MAP_TILE.WALL)
					const verticalBlocked = (this.map.grid[candidate.y][enemy.x] === MAP_TILE.WALL)
					if (horizontalBlocked || verticalBlocked) {
						let possibleMoves = []
						if (!horizontalBlocked) possibleMoves.push({ x: candidate.x, y: enemy.y })
						if (!verticalBlocked) possibleMoves.push({ x: enemy.x, y: candidate.y })
						candidate = null
						for (let move of possibleMoves) {
							if (!occupied.has(`${move.x},${move.y}`)) {
								candidate = move
								break
							}
						}
						if (!candidate) return
					}
				}
				
				if (!attacked && candidate.x === nextPlayerX && candidate.y === nextPlayerY) return
				if (occupied.has(`${candidate.x},${candidate.y}`)) return
				
				occupied.delete(`${enemy.x},${enemy.y}`)
				enemy.action--
				enemy.x = candidate.x
				enemy.y = candidate.y
				occupied.add(`${enemy.x},${enemy.y}`)
			}
		})
	}
	// 補助メソッド：指定したブロッカーセルを壁として扱い再計算する
	findPathWithExtraBlocker(startX, startY, targetX, targetY, blocker) {
		// map.grid をコピーして、ブロッカーセルを壁に設定
		const tempGrid = this.map.grid.map(row => row.slice())
		tempGrid[blocker.y][blocker.x] = MAP_TILE.WALL
		const originalGrid = this.map.grid
		this.map.grid = tempGrid
		const path = this.findPath(startX, startY, targetX, targetY)
		this.map.grid = originalGrid
		return path
	}
	// プレイヤーに隣接している敵が攻撃を仕掛ける処理を実行します。
	enemyAttackPhase() {
		this.enemies.forEach((enemy) => {
			if (enemy.hp <= 0 || enemy.action === 0) {
				this.x = this.y = -1
				return
			}
			const dx = Math.abs(enemy.x - this.player.x)
			const dy = Math.abs(enemy.y - this.player.y)
			if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
				enemy.action--
				this.queueTimeout(() => {
					this.player.hp -= enemy.atk
					if (this.player.hp < 0) this.player.hp = 0
					EffectsManager.showEffect(this.gameContainer, this.player, this.player.x, this.player.y, `-${enemy.atk}`, "damage-me")
					this.message.add(`${enemy.name}の攻撃　${enemy.atk}ダメージ`)
					this.seBox.playDamageMe()
					// # MESSAGE
				}, this.actionCount * this.actionTime)
				this.actionCount++
			}
			else if (dx === 1 && dy === 1) {
				if (this.map.grid[this.player.y][enemy.x] !== MAP_TILE.WALL &&
						this.map.grid[enemy.y][this.player.x] !== MAP_TILE.WALL) {
					enemy.action--
					this.queueTimeout(() => {
						this.player.hp -= enemy.atk
						if (this.player.hp < 0) this.player.hp = 0
						EffectsManager.showEffect(this.gameContainer, this.player, this.player.x, this.player.y, `-${enemy.atk}`, "damage-me")
						this.message.add(`${enemy.name}の攻撃　${enemy.atk}ダメージ`)
						this.seBox.playDamageMe()
						// # MESSAGE
					}, this.actionCount * this.actionTime)
					this.actionCount++
				}
			}
		})
	}
	// 各敵の行動回数などのリセットを行い、次ターンへの準備をします。
	enemyActionRefresh() {
		this.enemies.forEach((enemy) => { enemy.action = enemy.maxAction; })
	}
	// プレイヤーの攻撃により、敵にダメージを与え、敵の体力がゼロになった場合の処理（スコア加算、EXP獲得、エフェクト表示など）を実施します。
	damageEnemy(enemy, index) {
		var hor = this.keyX, ver = this.keyY
		if (this.player.weapon)
			EffectsManager.showAttackMotionWeapon(this.gameContainer, hor, ver, this.player.weapon.tile)
		else
			EffectsManager.showAttackMotionNoWeapon(this.gameContainer, hor, ver)
		
		enemy.takeDamage(this.player.attack)
		EffectsManager.showEffect(this.gameContainer, this.player, enemy.x, enemy.y, `-${this.player.attack}`, "damage")
		this.message.add(`${enemy.name}に${this.player.attack}ダメージ`)
		this.seBox.playDamage()
		// # MESSAGE
		this.actionCount++
		if (enemy.hp <= 0) {
			EffectsManager.showEffect(this.gameContainer, this.player, enemy.x, enemy.y, "💥", "explosion")
			// # MESSAGE
			this.enemies.splice(index, 1)
			this.score += 50
			this.gainExp(enemy.exp)
			setTimeout(() => {
				this.message.add(`${enemy.name}を倒した`)
				setTimeout(() => {
					EffectsManager.showEffect(this.gameContainer, this.player, enemy.x, enemy.y, `+${enemy.exp} EXP`, "heal")
					this.message.add(`経験値を${enemy.exp}ポイント得た`)
					// # MESSAGE
				}, 300)
			}, 300)
		}
	}
	
	/* 4. レンダリング・UI更新 */
	// ゲーム画面（マップ、敵、アイテム、プレイヤーなど）のメインビューを描画します。
	renderMainView() {
		let html = ''
		var radius = CONFIG.VIEW_RADIUS
		const startX = this.player.x - radius
		const startY = this.player.y - radius
		for (let y = startY; y <= this.player.y + radius; y++) {
			for (let x = startX; x <= this.player.x + radius; x++) {
				let tile = MAP_TILE.WALL
				if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
					if (!this.map.visible[y][x]) { html += `<span class="wall ${CONFIG.DIFFICULTY}">${MAP_TILE.WALL}</span>`; continue; }
					else if (this.player.x === x && this.player.y === y) tile = this.player.tile
					else {
						let drawn = false
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
							if (!drawn && this.stairs.x === x && this.stairs.y === y) tile = MAP_TILE.STEPS
							if (!drawn && tile === MAP_TILE.WALL) tile = this.map.grid[y][x]
						}
					}
				}
				html += `<span class="${CONFIG.DIFFICULTY}">${tile}</span>`
			}
			html += '<br>'
		}
		this.gameContainer.innerHTML = html
	}
	// ミニマップを生成し、現在の視界状態や各エンティティの位置を反映します。
	renderMinimap() {
		let html = ''
		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				let style = ""
				if (this.map.visible[y][x]) {
					if (this.player.x === x && this.player.y === y) style = "background-color: yellow;"
					else if (this.enemies.some(e => e.x === x && e.y === y)) style = "background-color: red;"
					else if (this.items.some(item => item.x === x && item.y === y)) style = "background-color: cyan;"
					else if (this.stairs.x === x && this.stairs.y === y) style = "border: 1px solid cyan; background-color: transparent;"
					else style = (this.map.grid[y][x] === ' ') ? "background-color: #555;" : "background-color: #222;"
				}
				html += `<div class="minimap-cell" style="${style}"></div>`
			}
		}
		this.minimapContainer.innerHTML = html
		this.minimapContainer.style.gridTemplateColumns = `repeat(${this.width}, 4px)`
	}
	// 上記のメインビューとミニマップの更新、及びインベントリオーバーレイなどのUI要素の再描画を統合的に行います。
	render() {
		if (!this.isPlay) return
		document.body.classList.remove("easy-dungeon", "hard-dungeon", "deep-dungeon")
		if (this.floor < 10) document.body.classList.add("easy-dungeon")
		else if (this.floor < 50) document.body.classList.add("hard-dungeon")
		else document.body.classList.add("deep-dungeon")
		const maxFloor = difficultySettings[CONFIG.DIFFICULTY].maxFloor
		const brightness = 80 - ((this.floor - 1) / (maxFloor - 1)) * 60
		document.body.style.backgroundColor = `hsl(0, 0%, ${brightness}%)`
		this.renderMainView()
		this.renderMinimap()
		document.getElementById('difficulty').innerText = CONFIG.DIFFICULTY
		document.getElementById('hp').innerText = this.player.hp
		document.getElementById('maxhp').innerText = this.player.maxHp
		document.getElementById('atk').innerText = this.player.attack
		document.getElementById('lv').innerText = this.player.level
		document.getElementById('exp').innerText = this.player.exp
		document.getElementById('floor').innerText = this.floor
		document.getElementById('score').innerText = this.score
		document.getElementById('hunger').innerText = this.player.hunger
		document.getElementById('maxhunger').innerText = this.player.maxHunger
		// プレイヤーのHPや満腹度などのステータスバーを更新します。
		this.uiManager.update(this.player)
		if (this.inventoryOpen) {
			let invHtml = `<div class="inventory-modal">`
			invHtml += `<h3>所持品 (${this.player.inventory.length + (this.groundItem ? 1 : 0)}/${CONFIG.INVENTORY_MAX})</h3>`
			invHtml += `<ul style="min-height:20px;">`
			for (let i = 0; i < this.player.inventory.length; i++) {
				let selected = (i === this.inventorySelection) ? ">> " : ""
				let itemName = this.player.inventory[i].name || "アイテム"
				if (this.player.inventory[i].name.match(/武器.*/g) && this.player.weapon === this.player.inventory[i])
					itemName += " (装備中)"
				if (this.player.inventory[i] === this.boxSelected)
					itemName += "（この箱に入れる）"
				invHtml += `<li class="${(i === this.inventorySelection) ? 'selected' : ''} ${this.player.inventory[i] === this.boxSelected ? 'boxSelected' : ''}">${selected}${this.player.inventory[i].tile} ${itemName}</li>`
			}
			invHtml += `</ul>`
		
			// コマンド表示用の配列（インベントリ側）
			let invCommands = []
			
			// 選択中のアイテム
			let selectedItem = this.player.inventory[this.inventorySelection]
			
			if (this.boxSelected) {
				if (selectedItem === this.boxSelected) {
					// 選択中の箱が選択されている場合は「I: 入れる」を表示
					invCommands.push("I: キャンセル")
				} else {
					// 箱が選択されている場合は「I: 入れる」を表示
					invCommands.push("I: 入れる")
				}
			}
			
			// クラスごとのコマンド
			if (selectedItem instanceof BoxItem && !this.boxSelected) {
				// 箱の場合は「」を表示
				invCommands.push("I: 箱に入れる")
				invCommands.push("U: 見る")
			}
			else if (selectedItem instanceof MagicSpell) {
				// 魔法の場合は「」を表示
				invCommands.push("U: 唱える")
			}
			else if (selectedItem instanceof WeaponItem) {
				// 武器の場合の場合は「」を表示
				if (this.player.weapon === selectedItem) {
					invCommands.push("U: 外す")
				} else {
					invCommands.push("U: 装備")
				}
			}
			else {
				invCommands.push("U: 使う")
			}
			
			if (this.groundItem) {
				invCommands.push("X: 交換")
			} else {
				invCommands.push("D: 置く")
			}
			
			// それ以外の基本コマンド
			invCommands.push("ESC/E: 閉じる")
		
			invHtml += `<p>（${invCommands.join(", ")}）</p>`
		
			// 足元アイテムの表示
			if (this.groundItem) {
				invHtml += `<hr>`
				invHtml += `<h3>足元</h3>`
				invHtml += `<ul style="min-height:20px;">`
				let index = this.player.inventory.length
				let selected = (index === this.inventorySelection) ? ">> " : ""
				invHtml += `<li class="${(index === this.inventorySelection) ? 'selected' : ''}">${selected}${this.groundItem.tile} ${this.groundItem.tile === '🔼' ? "階段" : this.groundItem.name}</li>`
				invHtml += `</ul>`
				// コマンド表示用の配列（足元）
				let grdCommands = []
				if (this.groundItem.tile === '🔼') {
					grdCommands.push("U: 降りる")
				} else {
					if (this.player.inventory.length < CONFIG.INVENTORY_MAX) {
						grdCommands.push("P: 拾う")
					}
					
					// クラスごとのコマンド
					if (this.groundItem instanceof MagicSpell) {
						// 魔法の場合は「」を表示
						grdCommands.push("U: 唱える")
					}
					else if (this.groundItem instanceof WeaponItem) {
						grdCommands.push("U: 装備")
					}
					else {
						grdCommands.push("U: 使う")
					}
				}
				invHtml += `<p>（${grdCommands.join(", ")}）</p>`
			}
			invHtml += `</div>`
			this.gameContainer.innerHTML += invHtml
		}
	}
	// プレイヤーのHPや満腹度などのステータスバーを更新します。
	
	/* 5. ダンジョン生成・レベル管理 */
	// 新しいダンジョン（または階層）の生成を行い、プレイヤー位置、エンティティ配置、階段設定などを更新します。
	generateDungeon(keepHP = false) {
		const prevHP = this.player.hp
		const prevScore = this.score
		this.map.generate()
		this.enemies = []
		this.items = []
		this.gems = []
		const firstRoom = this.map.rooms[0]
		this.player.x = firstRoom.x + 1
		this.player.y = firstRoom.y + 1
		this.map.revealRoom(this.player.x, this.player.y)
		this.map.revealAround(this.player.x, this.player.y)
		if (!keepHP) {
			this.player.hp = this.initialHP
			this.score = 0
			this.floor = 1
			this.player.hunger = this.player.maxHunger
		} else {
			this.player.hp = prevHP
			this.score = prevScore
			this.floor++
			
			if (this.floor > difficultySettings[CONFIG.DIFFICULTY].maxFloor) {
				this.saveResult(true)
				alert("ダンジョンクリア！おめでとう！")
				// ゲームクリア時にも終了処理を実行
				this.destroy()
				return
			}
		}
		
		// 設定値の基準として使う値
		const maxFloor = difficultySettings[CONFIG.DIFFICULTY].maxFloor // 最大階層からの割合で調整
		const dif = CONFIG.DIFFICULTY // 難易度で調整
		const SettingValues = {
			easy: {
				enemy: {min: 2, max: 4},
				entity: {min: 1, max: 2},
				maxItems: {min: 3, max: 5},
				itemWeights: {
					food: 40,
					sushi: 40,
					magic: 20,
					niku: 20,
					weapon: 20,
					shooting: 20,
					box: 10
				}
			},
			normal: {
				enemy: {min: 2, max: 4},
				entity: {min: 1, max: 2},
				maxItems: {min: 3, max: 4},
				itemWeights: {
					food: 40,
					sushi: 40,
					magic: 20,
					niku: 20,
					weapon: 20,
					shooting: 15,
					box: 8
				}
			},
			normalPlus: {
				enemy:    {min: 2, max: 4},
				entity:   {min: 1, max: 2},
				// ↓ 出現アイテム数を 1～3 に絞る
				maxItems: {min: 2, max: 4},
				itemWeights: {
					food:     35,
					sushi:    20,
					magic:    10,
					niku:     10,
					weapon:   10,
					shooting: 10,
					box:      7 
				}
			},
			hard: {
				enemy: {min: 2, max: 4},
				entity: {min: 1, max: 2},
				maxItems: {min: 2, max: 4},
				itemWeights: {
					food:     30,
					sushi:    20,
					magic:    10,
					niku:     10,
					weapon:   7,
					shooting: 10,
					box:      5
				}
			}
		}
		// 難易度の設定値を取得
		const sv = SettingValues[CONFIG.DIFFICULTY]
		
		const lastRoom = this.map.rooms.at(-1)
		this.stairs.x = lastRoom.x + 2
		this.stairs.y = lastRoom.y + 2
		this.map.grid[this.stairs.y][this.stairs.x] = MAP_TILE.STEPS
		if (CONFIG.DIFFICULTY === "hard") {
			this.minMagnification = 1.3
			this.maxMagnification = 1.4
		} else {
			this.minMagnification = CONFIG.MIN_ENEMY_MULTIPLIER
			this.maxMagnification = CONFIG.MAX_ENEMY_MULTIPLIER
		}

		this.placeEntities(this.enemies, randomInt(sv.enemy.min, sv.enemy.max), "enemy")
		//this.placeEntities(this.gems, randomInt(sv.entity.min, sv.entity.max), "entity")
		const maxItems = randomInt(sv.maxItems.min, sv.maxItems.max)
		const weightedTypes = [
			...Array(sv.itemWeights.food).fill("food"),
			...Array(sv.itemWeights.sushi).fill("sushi"),
			...Array(sv.itemWeights.magic).fill("magic"),
			...Array(sv.itemWeights.niku).fill("niku"),
			...Array(sv.itemWeights.weapon).fill("weapon"),
			...Array(sv.itemWeights.shooting).fill("shooting"),
			...Array(sv.itemWeights.box).fill("box")
		]
		for (let i = 0; i < maxItems; i++) {
			const type = weightedTypes.splice(randomInt(0, weightedTypes.length - 1), 1)[0]
			this.placeEntities(this.items, 1, type)
		}
		/////console.log(JSON.stringify(this.enemies))
		/////console.log(JSON.stringify(this.items, null, "\t"))

	}
	// 敵やアイテムなどのエンティティをマップ上にランダム配置する処理です。
	placeEntities(arr, count, type) {
		for (let i = 0; i < count; i++) {
			let x, y, hp
			do {
				const room = this.map.rooms[randomInt(0, this.map.rooms.length - 1)]
				x = randomInt(room.x + 1, room.x + room.w - 2)
				y = randomInt(room.y + 1, room.y + room.h - 2)
				if (type === "enemy") {
					// プレイヤーのいる部屋なら飛ばす
					for (const inPlayerRoom of getPlayerRoom(this)) { // プレイヤーのいる部屋を取得
						if (isInRoom(x, y, inPlayerRoom)) {
							x = this.player.x
							y = this.player.y
							break
						}
					}
					
					hp = randomInt(
						Math.round(Math.pow(this.floor, this.minMagnification)),
						Math.round(Math.pow(this.floor, this.maxMagnification))
					)
				}
			} while (this.map.grid[y][x] !== ' ' || (x === this.player.x && y === this.player.y))
			if (type === "sushi") {
				arr.push(new InventoryItem(x, y, "すし", '🍣', async function(game) {
					game.seBox.playEat()
					game.player.hp += 5
					if (game.player.hp > game.player.maxHp) game.player.hp = game.player.maxHp
					EffectsManager.showEffect(game.gameContainer, game.player, game.player.x, game.player.y, "+5", "heal")
					game.message.add(`すしを食べて5ポイント回復`)

					game.player.hunger += 5 // 食事ボーナス
					if (game.player.hunger > game.player.maxHunger) game.player.hunger = game.player.maxHunger
					EffectsManager.showEffect(game.gameContainer, game.player, game.player.x, game.player.y, "+5", "food")
					game.message.add(`少しお腹がふくれた`)
					// # MESSAGE
				}))
			} else if (type === "niku") {
				arr.push(new InventoryItem(x, y, "お肉", '🍖', async function(game) {
					game.seBox.playEat()
					game.player.hp += 10
					if (game.player.hp > game.player.maxHp) game.player.hp = game.player.maxHp
					EffectsManager.showEffect(game.gameContainer, game.player, game.player.x, game.player.y, "+10", "heal")
					game.message.add(`お肉を食べて10ポイント回復`)

					game.player.hunger += 5 // 食事ボーナス
					if (game.player.hunger > game.player.maxHunger) game.player.hunger = game.player.maxHunger
					EffectsManager.showEffect(game.gameContainer, game.player, game.player.x, game.player.y, "+5", "food")
					game.message.add(`少しお腹がふくれた`)
					// # MESSAGE
				}))
			} else if (type === "weapon") {
				var selection = randomInt(1, 2)
				let bonus = randomInt(1, 3)
				switch (selection) {
				case 1:
					bonus = randomInt(1, 3)
					arr.push(new WeaponItem(x, y, `武器-剣 (+${bonus})`, '🗡️', bonus))
					break
				case 2:
					bonus = randomInt(2, 5)
					arr.push(new WeaponItem(x, y, `武器-斧 (+${bonus})`, '🪓', bonus))
					break
				}
			} else if (type === "shooting") {
				//// 射撃武器
				arr.push(new ShootingItem(x, y, "射撃-弓矢", '🏹', /* 数 */ 5, /* ダメージ */ 10, /* 距離 */ 8, "↑"))
			} else if (type === "magic") {
				const weightedMagics = [
				//// 攻撃魔法
					...Array(30).fill({name: "火の玉", tile: '🔥', damage: 20, area: 1, fallbackHeal: null}),
					...Array(20).fill({name: "たつまき", tile: '🌪️', damage: 15, area: 2, fallbackHeal: null}),
					...Array(10).fill({name: "大波", tile: '🌊', damage: 25, area: 4, fallbackHeal: null}),
					...Array(5).fill({name: "カミナリ", tile: '⚡️', damage: 30, area: 1, fallbackHeal: null}),
					...Array(1).fill({name: "エクスプロージョン", tile: '💥', damage: 50, area: 3, fallbackHeal: null}),
					...Array(1).fill({name: "メテオ", tile: '🌠', damage: 30, area: 5, fallbackHeal: null}),
				//// 回復魔法
					...Array(10).fill({name: "リカバーオール", tile: '✨️', damage: null, area: null, fallbackHeal: 100}),
				]
				let magic = weightedMagics.splice(randomInt(1, weightedMagics.length - 1), 1)[0]
				arr.push(new MagicSpell(x, y, magic.name, magic.tile, magic.tile, {damage: magic.damage, area: magic.area, fallbackHeal: magic.fallbackHeal}))
			} else if (type === "entity") {
				arr.push(new BaseEntity(x, y))
			} else if (type === "enemy") {
				const enemys = enemyList(this.floor, CONFIG.DIFFICULTY)
				const EnemyClass = enemys[randomInt(0, enemys.length - 1)]
				arr.push(new EnemyClass(x, y, hp))
			} else if (type === "food") {
				if (Math.random() > 0.7) {
					arr.push(new InventoryItem(x, y, "パン", '🥖', async function(game) {
						game.seBox.playEat()
						game.player.hunger += 20
						if (game.player.hunger > game.player.maxHunger) game.player.hunger = game.player.maxHunger
						EffectsManager.showEffect(game.gameContainer, game.player, game.player.x, game.player.y, "+20", "food")
						game.message.add(`パンを食べて少しお腹がふくれた`)
						// # MESSAGE
					}))
				} else {
					arr.push(new InventoryItem(x, y, "大きなパン", '🍞', async function(game) {
						game.seBox.playEat()
						game.player.hunger += 50
						if (game.player.hunger > game.player.maxHunger) game.player.hunger = game.player.maxHunger
						EffectsManager.showEffect(game.gameContainer, game.player, game.player.x, game.player.y, "+50", "food")
						game.message.add(`大きなパンを食べてお腹がふくれた`)
						// # MESSAGE
					}))
				}
			} else if (type === "box") {
				arr.push(new BoxItem(x, y, 5))
			}
		}
	}
	
	/* 6. プレイヤー・敵の相互作用 */
	// 敵を倒した際に、経験値を加算し、レベルアップ条件に応じた能力向上を処理します。
	gainExp(amount) {
		this.player.exp += amount
		const expToNext = this.player.level * 10
		if (this.player.exp >= expToNext) {
			let upAtk, upHp
			this.player.exp -= expToNext
			this.player.level++
			this.player.attack += (upAtk = randomInt(1, 2))
			this.player.maxHp += (upHp = randomInt(2, 3))
			this.player.healAmount++
			this.player.hp = this.player.maxHp
			this.queueTimeout(() => {
				EffectsManager.showEffect(this.gameContainer, this.player, this.player.x, this.player.y, "LEVEL UP!", "heal");
				this.message.add("レベルが上がった!")
			}, 1100)
			// # MESSAGE
			this.queueTimeout(() => {
				EffectsManager.showEffect(this.gameContainer, this.player, this.player.x, this.player.y, `HP +${upHp}`, "heal");
				this.message.add(`HP +${upHp}`)
			}, 1600)
			// # MESSAGE
			this.queueTimeout(() => {
				EffectsManager.showEffect(this.gameContainer, this.player, this.player.x, this.player.y, `攻撃力 +${upAtk}`, "heal");
				this.message.add(`攻撃力 +${upAtk}`)
			}, 2100)
			// # MESSAGE
		}
	}
	// プレイヤーがアイテムを食べた際の飢餓回復処理を行います。
	playerEat(amount) {
		this.player.hunger += amount
		if (this.player.hunger > this.player.maxHunger) this.player.hunger = this.player.maxHunger
		EffectsManager.showEffect(this.gameContainer, this.player, this.player.x, this.player.y, `+${amount}`, "food")
		// # MESSAGE
		this.message.add(`${amount}ポイント回復した`)
	}
	// プレイヤーが回復アイテムなどでHPを回復する処理です。
	onHeal() {
		this.player.hp += this.player.healAmount
		if (this.player.hp > this.player.maxHp) this.player.hp = this.player.maxHp
		EffectsManager.showEffect(this.gameContainer, this.player, this.player.x, this.player.y, `+${this.player.healAmount}`, "heal")
		// # MESSAGE
		this.message.add(`${amount}ポイント回復した`)
	}
	
	/* 7. 結果・スコアの管理 */
	// ゲームオーバーやクリア時に、ゲーム結果（日時、難易度、フロア、レベル、スコアなど）を localStorage に保存します。
	saveResult(clear = false) {
		let results = JSON.parse(localStorage.getItem("gameResult") || "[]")
		results.push({
			date: new Date().toISOString(),
			dungeonLv: CONFIG.DIFFICULTY,
			floor: this.floor,
			clear: clear,
			lv: this.player.level,
			score: this.score
		})
		localStorage.setItem("gameResult", JSON.stringify(results))
	}
	// 保存された結果をモーダル画面で表示します。
	showResults() {
		let results = JSON.parse(localStorage.getItem("gameResult") || "[]")
		let modalHtml = '<div class="results-modal" id="resultsModal">'
		modalHtml += '<h3>記録された結果</h3>'
		if (results.length === 0) modalHtml += '<p>記録がありません。</p>'
		else {
			modalHtml += '<table><tr><th>日付</th><th>難易度</th><th>フロア</th><th>結果</th><th>レベル</th><th>スコア</th></tr>'
			results.forEach(r => {
				modalHtml += `<tr><td>${new Date(r.date).toLocaleString()}</td><td>${r.dungeonLv == undefined ? "-" : r.dungeonLv}</td><td>${r.floor}</td><td>${r.clear ? "クリア" : "ゲームオーバー"}</td><td>${r.lv}</td><td>${r.score}</td></tr>`
			})
			modalHtml += '</table>'
		}
		modalHtml += '<button onclick="closeResults()">閉じる</button>'
		modalHtml += '</div>'
		const existingModal = document.getElementById("resultsModal")
		if (!existingModal) {
			const modalDiv = document.createElement("div")
			modalDiv.innerHTML = modalHtml
			document.body.appendChild(modalDiv)
		}
	}
	
	/* 8. ゲーム終了・リソース解放 */
	// ゲームオーバーまたはクリア時に、登録済みのタイマーやイベントリスナーを解除して、Game インスタンスのリソースを解放します。
	destroy() {
		// タイマーを全て解除
		this.timeoutQueue.forEach(id => clearTimeout(id))
		this.timeoutQueue = []
		// イベントリスナを解除
		document.removeEventListener('keydown', this.inputHandler)
		// もし他にも登録しているイベントがあれば解除する
		// 例: document.removeEventListener('keyup', this.someOtherHandler)
		
		// 必要であれば、gameContainer などの UI 要素の参照もクリア
		// これによりガベージコレクションが働き、インスタンスが解放される
		this.gameContainer = null
		this.minimapContainer = null
		this.isPlay = false
		
		// フィールドエフェクトを削除
		Array.from(document.querySelectorAll(".field-effects")).forEach(e => {
			e.remove()
		})

		// BGMを停止
		this.bgmBox.stopBGM()
		
		// グリッドを削除
		switchGrid(this.gameContainer, false);
		
		// 難易度選択マップに戻る
		selector = new DifficultySelector(this.myIcon)
	}
	
	/* 9. 箱操作（入れ子アイテムの操作） */
	// 箱アイテムの use 操作として呼ばれ、箱内に入れたアイテム一覧をオーバーレイ表示して、以下の操作を可能にします。
	// ・出す：箱からアイテムを取り出しインベントリに戻す。
	// ・使う：箱内のアイテムを使用する。
	// ・置く：箱内のアイテムを取り出して地面に配置する。
	openBox(box) {
		// 箱オーバーレイ中は通常操作を停止
		this.boxOverlayActive = true
		let selectionIndex = 0; // 現在選択中の箱内アイテムのインデックス
	
		// オーバーレイ要素の生成
		const overlay = document.createElement("div")
		overlay.className = "box-overlay"
	
		// タイトル：箱内のアイテム数と容量を表示
		const title = document.createElement("h3")
		title.textContent = `箱の中身 (${box.contents.length}/${box.capacity})`
		overlay.appendChild(title)
	
		// アイテム一覧表示用コンテナ（スクロール可能）
		const listContainer = document.createElement("div")
		listContainer.className = "box-item-list-container"
		const list = document.createElement("ul")
		list.className = "box-item-list"
		listContainer.appendChild(list)
		overlay.appendChild(listContainer)
	
		// 操作方法の説明
		const instructions = document.createElement("p")
		instructions.textContent = "↑/↓: 選択	D: 出す	U: 使う	X: 置く	Esc: 閉じる"
		overlay.appendChild(instructions)
	
		document.body.appendChild(overlay)
	
		// オーバーレイ内のリストを描画
		function renderList() {
			title.textContent = `箱の中身 (${box.contents.length}/${box.capacity})`
			list.innerHTML = ""
			box.contents.forEach((item, index) => {
				const li = document.createElement("li")
				li.textContent = `${item.tile} ${item.name}`
				// カーソル位置の場合は背景色を変更
				if (index === selectionIndex) {
					li.style.backgroundColor = "#444"
					li.style.color = "#fff"
				}
				list.appendChild(li)
			})
		}
		renderList()
	
		// キーボード入力ハンドラ
		function onKeyDown(e) {
			if (!this.boxOverlayActive) return
			// ↑/↓でカーソル移動
			if (e.key === "ArrowUp") {
				e.preventDefault()
				this.seBox.playMenu(3)
				if (box.contents.length > 0) {
					selectionIndex = (selectionIndex - 1 + box.contents.length) % box.contents.length
					renderList()
				}
			} else if (e.key === "ArrowDown") {
				e.preventDefault()
				this.seBox.playMenu(3)
				if (box.contents.length > 0) {
					selectionIndex = (selectionIndex + 1) % box.contents.length
					renderList()
				}
			}
			// 出す：箱内の選択アイテムを取り出してインベントリへ
			else if (e.key.toLowerCase() === "d") {
				e.preventDefault()
				const inventory = this.player.inventory
				const maxInventory = CONFIG.INVENTORY_MAX
				// インベントリがいっぱいなら出せない
				if (inventory.length === maxInventory) {
					this.message.add("これ以上出せない")
				} else if (box.contents.length > 0) {
					const item = box.removeItem(selectionIndex)
					this.player.inventory.push(item)
					if (selectionIndex >= box.contents.length) {
						selectionIndex = Math.max(0, box.contents.length - 1)
					}
					renderList()
				}
			}
			// 使う：箱内の選択アイテムを使用
			else if (e.key.toLowerCase() === 'u') {
				e.preventDefault()
				if (box.contents.length > 0) {
					const item = box.contents[selectionIndex]
					cleanup()
					renderList()
					if (item.use) item.use(this).then(() => {
						// 使用後、アイテムが消費されるなら削除する
						box.contents.splice(selectionIndex, 1)
						if (selectionIndex >= box.contents.length) {
							selectionIndex = Math.max(0, box.contents.length - 1)
						}
						// 名前の隣の数字を更新
						box.updateName()
						// 使ったら箱を閉じてターンを進める
						this.turn()
					})
				}
			}
			// 置く：箱内の選択アイテムを取り出して地面に設置
			else if (e.key.toLowerCase() === "x") {
				e.preventDefault()
				if (box.contents.length > 0) {
					const item = box.removeItem(selectionIndex)
					item.x = this.player.x
					item.y = this.player.y
					this.items.push(item)
					if (selectionIndex >= box.contents.length) {
						selectionIndex = Math.max(0, box.contents.length - 1)
					}
					// 置いたら箱を閉じてターンを進める
					cleanup()
					renderList()
					this.turn()
				}
			}
			// Esc でオーバーレイを閉じる
			else if (e.key === "Escape") {
				e.preventDefault()
				cleanup()
			}
			box.updateName()
		}
		// bind して Game インスタンスの this を保持
		const boundOnKeyDown = onKeyDown.bind(this)
		document.addEventListener("keydown", boundOnKeyDown)
	
		const cleanup = () => {
			this.boxOverlayActive = false
			document.removeEventListener("keydown", boundOnKeyDown)
			overlay.remove()
			box.updateName()
			this.boxSelected = null
			// オーバーレイ終了後、ゲームの再描画
			this.render()
		}
	}
	
	turn() {
		const syncTimeout = (time) => {
			return new Promise((resolve) => {
				setTimeout(() => { resolve("ok"); }, time)
			})
		}
		// 待ってからターンを進める
		syncTimeout(400).then(() => {
			this.advanceTurn()
			this.queueTimeout(() => {
				this.enemyAttackPhase()
			}, this.actionCount * this.actionTime)
			this.queueTimeout(() => {
				this.enemyMovementPhase(this.player.x, this.player.y)
			}, this.actionCount * this.actionTime)
			this.queueTimeout(() => {
				this.enemyActionRefresh()
				this.checkCollisions()
				this.render()
			}, (this.actionCount + 1) * this.actionTime)
		})
	}
}
