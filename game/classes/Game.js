// Game クラス
class Game {
	/* 1. 初期化・セットアップ */
	// ゲームの初期状態（マップ、プレイヤー、UI、タイマー、キー入力管理など）をセットアップし、各種オブジェクトの初期化とイベント登録を行います。
	constructor(myIcon) {
		// ------------------------------
		// 基本設定とプレイヤー初期化
		// ------------------------------
		this.myIcon = myIcon
		this.isPlay = true
		this.initialHP = CONFIG.INITIAL_HP
		// プレイヤーの生成とアイコンの設定
		this.player = new Player(0, 0, this.initialHP)
		this.player.tile = myIcon

		// ------------------------------
		// キー入力関連の初期化
		// ------------------------------
		this.keyX = 0
		this.keyY = 0
		this.keysDown = {}
		this.acceptingInput = true
		this.ctrlPressed = false

		// ------------------------------
		// ゲーム進行管理
		// ------------------------------
		this.actionCount = 0
		this.actionTime = 400
		this.actionProgress = false
		this.score = 0
		this.floor = 1
		this.isGameOver = false

		// ------------------------------
		// マップ・画面関連設定
		// ------------------------------
		this.width = CONFIG.WIDTH
		this.height = CONFIG.HEIGHT
		this.map = new DungeonMap(this.width, this.height)
		this.gameContainer = document.getElementById("game")
		this.minimapContainer = document.getElementById("minimap")

		// ------------------------------
		// サイクル管理
		// ------------------------------
		// 敵生成、休息、空腹の各サイクル（初期値と設定値）
		this.generateEnemyCycle = [0, CONFIG.GENERATE_ENEMY_CYCLE]
		this.restCycle = [0, CONFIG.REST_CYCLE]
		this.hungerCycle = [0, CONFIG.HUNGER_CYCLE]
		// 休息サイクルを表示
		document.getElementById("restCycle").innerText = CONFIG.REST_CYCLE

		// ------------------------------
		// アイテム・敵・その他のオブジェクト
		// ------------------------------
		this.timeoutQueue = []
		this.items = []
		this.gems = []
		this.enemies = []
		this.stairs = { x: 0, y: 0 }
		this.boxSelected = null
		// 足元にあるアイテム（存在する場合）
		this.groundItem = null
		// インベントリ状態（所持品＋足元アイテムがある場合は1つ追加）
		this.inventorySelection = 0
		this.inventoryOpen = false
		this.boxOverlayActive = false

		// ------------------------------
		// UI関連の初期化
		// ------------------------------
		this.renderer = new Renderer(this)
		this.uiManager = new UIManager()

		// ------------------------------
		// ダンジョン生成と初期描画
		// ------------------------------
		this.generateDungeon(false)
		this.renderer.render()

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
		// this.player.inventory.push(new BoxItem(0, 0))
		// this.player.inventory.push(new WeaponItem(0, 0, "伝説の剣", '⚔️', 1000))
		// this.player.inventory.push(new ShootingItem(0, 0, "射撃-弓矢", '🏹', 5, 10, 8, "↑"))
		// this.player.inventory.push(new BoxItem())
		// this.player.inventory.push(new MagicSpell(0, 0, "炎", "🔥", "🔥", {damage: 20, area: 1, fallbackHeal: null}))
		
		EffectsManager.showFloorOverlay(this.gameContainer, this.floor)
		
		// BGM
		this.bgmBox = new BGMManager()
		this.seBox = new SEManager()
		this.seBox.loadfile().then(() => {
			this.bgmBox.loadfile().then(() => {
				switch (CONFIG.DIFFICULTY) {
				case "easy":
					this.bgmBox.playEasy()
					break
				case "normal":
					this.bgmBox.playNormal()
					break
				case "normalPlus":
					//this.bgmBox.playNormalPlus()
					this.bgmBox.playNormalPlus2()
					break
				case "hard":
					this.bgmBox.playHard()
					break
				case "hardPlus":
					this.bgmBox.playHard()
					break
				}
			})
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
		case "hardPlus":
			//EffectsManager.showFieldEffect(this.gameContainer, "🔥", 10)
			//this.bgmBox.playNormal()
			break
		}

		setTimeout(() => {
			this.inputManager = new InputManager(this)
		}, 300)
	}
	
	// ターン進行中の同期処理を行い、指定した遅延で処理を実行します。
	async timeoutSync(callback, delay) {
		//////console.log("timeoutSync " + delay)
		this.inputManager.lastInputTime = Date.now() * 2
		return new Promise(resolve => {
			setTimeout(() => {
				callback()
				this.renderer.render()
				this.inputManager.lastInputTime = Date.now() + 200
				resolve("ok")
			}, delay)
		})
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
	async processInput(event) {
		if (!this.isPlay || this.actionProgress) return
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
			this.renderer.render()
			return
		}
		if (this.inventoryOpen) {
			this.processInventoryInput(event)
			return
		}
		if (window.overlayActive) { return; }
		const inputResult = this.computeInput(event)
		if (!inputResult) { return; }
		this.advanceTurn()
		await this.updateData(inputResult)
		this.renderer.render()
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
			this.renderer.render()
			return
		}*/
		
		// カーソル移動
		if (inventoryArrowUp(this, event, totalOptions)) return
		if (inventoryArrowDown(this, event, totalOptions)) return
			
		// 以下、キーの処理
		if (inventoryY(this, event)) return
		
		// もしカーソルが足元アイテム（＝インベントリリストの最後の項目）を指している場合
		if (this.groundItem && this.inventorySelection === this.player.inventory.length && !this.boxSelected) {
			if (inventoryGroundP(this, event)) return
			if (inventoryGroundU(this, event)) return
		} 
		// 通常の所持品の操作
		else {
			if (await inventoryU(this, event)) return
			if (inventoryD(this, event)) return
			if (inventoryX(this, event)) return
			if (inventoryI(this, event)) return
			if (inventoryEscape(this, event)) return
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
				await this.damageEnemy(this.enemies[i], i)
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
				this.seBox.playStair()
				this.generateDungeon(true)
				this.renderer.render()
				EffectsManager.showFloorOverlay(this.gameContainer, this.floor)

				switch (CONFIG.DIFFICULTY) {
					case "hardPlus":
						if (this.floor % 5 === 0) {
							// BGM切り替え
							const blobs = Object.entries(this.bgmBox.playList)
								.map(file => [file[0], Object.values(file[1])[0]])
								.filter(bgm => bgm[0] !== "./rsrc/mus/difficulty.mp3") // セレクト画面は除く
							/////// console.log(blobs)

							const currentBGM = this.bgmBox.player.src
							const BGMs = blobs.filter(BGM => BGM[1] !== currentBGM)
							/////// console.log(BGMs)
							/////// console.log(BGMs[randomInt(0, BGMs.length - 1)][0])
							this.bgmBox.playBGM(BGMs[randomInt(0, BGMs.length - 1)][0])

							// 視界切り替え
							CONFIG.REVEALLV = randomInt(2, 7)
						}
						break
					default:
						break
				 }
			}, () => {
				this.seBox.playMenu(4)
				// 「キャンセル」を選んだ場合、必要に応じてプレイヤー位置を戻すなどの処理
				this.groundItem = new BaseEntity(tx, ty, '🔼')
				
				// 例: 現在の位置から少しずらす（ここは実装に合わせて調整）
				this.renderer.render()
			})
			
			return
		}
		this.items = this.items.filter(item => {
			if (item.x === this.player.x && item.y === this.player.y) {
				// アイテムを拾う
				if (!this.ctrlPressed && !pickupItem(this, item)) {
					this.message.add(`${item.name}を拾った`)
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

		this.renderer.render()
		
		// 敵の最大行動回数を取得
		let maxAction = Math.max(...(this.enemies.map(e => e.maxAction)))
		const promises = []
		
		if (attacked) {
			await this.timeoutSync(() => {}, 400)
		}
		
		////////console.log("敵行動開始")
		this.actionProgress = true
		
		for (var i=0; i<maxAction; i++) {
			promises.push(
				new Promise(async (resolve) => {
					await this.enemyAttackPhase()
					this.enemyMovementPhase(tx, ty, attacked)
					resolve()
				})
			)
		}
		await Promise.all(promises)
		this.enemyActionRefresh()
		
		if (this.player.hp > 0) {
			this.actionProgress = false
			////////console.log("敵行動終了")
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
			this.player.hp--; EffectsManager.showEffect(this.gameContainer, this.player, this.player.x, this.player.y, "餓死", "damage")
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
		}, this.actionTime)
	}
	// 敵の移動のために、プレイヤーまでの経路を探索します（経路探索アルゴリズム）。
	findPath(startX, startY, targetX, targetY) {
		const queue = [{ x: startX, y: startY, path: [] }]
		const visited = new Set()
		visited.add(`${startX},${startY}`)
		
		const directions = [
			{ dx: 1, dy: 0 },
			{ dx: -1, dy: 0 },
			{ dx: 0, dy: 1 },
			{ dx: 0, dy: -1 },
			{ dx: 1, dy: 1 },
			{ dx: -1, dy: -1 },
			{ dx: 1, dy: -1 },
			{ dx: -1, dy: 1 }
		]
		
		while (queue.length > 0) {
			const current = queue.shift()
			// ゴールに到達したら経路を返す
			if (current.x === targetX && current.y === targetY) {
				return current.path
			}
			
			for (const d of directions) {
				const nx = current.x + d.dx
				const ny = current.y + d.dy
				
				// グリッド外は除外
				if (nx < 0 || ny < 0 || nx >= this.width || ny >= this.height) continue
				// 壁なら除外（この条件はグリッドデータと MAP_TILE.WALL の値が一致している前提）
				if (this.map.grid[ny][nx] === MAP_TILE.WALL) continue
				
				const key = `${nx},${ny}`
				if (!visited.has(key)) {
					visited.add(key)
					queue.push({ x: nx, y: ny, path: current.path.concat([{ x: nx, y: ny }]) })
				}
			}
		}
		return null
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
	async enemyAttackPhase() {
		return new Promise(resolve => {
			let chain = Promise.resolve()
	
			this.enemies.forEach(async (enemy) => {
				if (enemy.hp <= 0 || enemy.action === 0) {
					this.x = this.y = -1
					return
				}
				const dx = Math.abs(enemy.x - this.player.x)
				const dy = Math.abs(enemy.y - this.player.y)
				const vsc = enemy.validSkillCount(this.player) // 射程範囲内のスキルがあるか
				if ((dx > 1 || dy > 1) && vsc === 0) {
					this.x = this.y = -1
					return 
				}

				// 行動を決定（攻撃範囲外なら通常攻撃を除外）
				const index = randomInt((dx > 1 || dy > 1) ? 0 : -1, enemy.validSkillCount(this.player) - 1)

				const action = async () => {
					enemy.action--
					this.actionCount++

					//////console.group("射程範囲内スキル")
					//////console.log(enemy.validRangeSkills(this.player))
					//////console.log(enemy.validSkillCount(this.player))
					//////console.groupEnd("射程範囲内スキル")

					// 通常攻撃
					if (index === -1) {
						await enemy.attack(this)
					}
					// 個別スキル
					else {
						//////console.log("スキル開始")
						await enemy.skill(this, index)
						//////console.log("スキル終了")
					}
				}

				chain = chain.then(() => 
					new Promise(async resolve => {
						//////console.log("アクション開始")
						if (index == -1) {
							// 通常攻撃
							if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
								await action()
							}
							else if (dx === 1 && dy === 1) {
								if (this.map.grid[this.player.y][enemy.x] !== MAP_TILE.WALL &&
										this.map.grid[enemy.y][this.player.x] !== MAP_TILE.WALL) {
									await action()
								}
							}
						} else {
							// 個別スキル
							if (dy === 0 || dx === 0 || dx === dy) {
								await action()
							}
							this.timeoutSync(() => {}, this.actionTime)
						}
						resolve("ok")
						//////console.log("アクション終了")
					})
				)
			})

			chain.then(() => resolve("ok"))
		})
	}
	// 各敵の行動回数などのリセットを行い、次ターンへの準備をします。
	enemyActionRefresh() {
		this.enemies.forEach((enemy) => { enemy.action = enemy.maxAction; })
	}
	// プレイヤーの攻撃により、敵にダメージを与え、敵の体力がゼロになった場合の処理（スコア加算、EXP獲得、エフェクト表示など）を実施します。
	async damageEnemy(enemy, index) {
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

			await this.timeoutSync(() => {
				this.message.add(`${enemy.name}を倒した`)
			}, 300)
			EffectsManager.showEffect(this.gameContainer, this.player, enemy.x, enemy.y, `+${enemy.exp} EXP`, "heal")
			this.message.add(`経験値を${enemy.exp}ポイント得た`)
			// # MESSAGE
			this.score += 50

			await this.gainExp(enemy.exp)
		}
	}
	
	/* 4. レンダリング・UI更新 */
	// Rederer.jsに分割
	
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

		// 難易度の設定値を取得
		const sv = EntitySettingValues[CONFIG.DIFFICULTY]
		
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
						Math.round(Math.pow((this.floor + 1) / 2, this.minMagnification)),
						Math.round(Math.pow((this.floor + 1) / 2, this.maxMagnification))
					)
				}
			} while (this.map.grid[y][x] !== ' ' || (x === this.player.x && y === this.player.y))
			if (type === "sushi") {
				arr.push(new HealItem(x, y, "すし", '🍣', 5, 5))
			} else if (type === "niku") {
				arr.push(new HealItem(x, y, "お肉", '🍖', 10, 5))
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
				let magic = weightedMagics.splice(randomInt(1, weightedMagics.length - 1), 1)[0]
				arr.push(new MagicSpell(x, y, magic.name, magic.tile, magic.tile, {damage: magic.damage, player: this.player, area: magic.area, fallbackHeal: magic.fallbackHeal, effect: magic.effect}))
			} else if (type === "entity") {
				arr.push(new BaseEntity(x, y))
			} else if (type === "enemy") {
				const enemys = enemyList(this.floor, CONFIG.DIFFICULTY)
				const EnemyClass = enemys[randomInt(0, enemys.length - 1)]
				arr.push(new EnemyClass(x, y, hp))
			} else if (type === "food") {
				if (Math.random() > 0.7) {
					arr.push(new FoodItem(x, y, "パン", '🥖', 20))
				} else {
					arr.push(new FoodItem(x, y, "大きなパン", '🍞', 50))
				}
			} else if (type === "box") {
				arr.push(new BoxItem(x, y, 5))
			}
		}
	}
	
	/* 6. プレイヤー・敵の相互作用 */
	// 敵を倒した際に、経験値を加算し、レベルアップ条件に応じた能力向上を処理します。
	async gainExp(amount) {
		this.player.exp += amount
		const expToNext = this.player.level * 10
		if (this.player.exp >= expToNext) {
			return new Promise(resolve => {
				this.timeoutSync(async () => {
					let upAtk, upHp
					this.player.exp -= expToNext
					this.player.level++
					this.player.attack += (upAtk = randomInt(1, 2))
					this.player.maxHp += (upHp = randomInt(2, 3))
					this.player.healAmount++
					this.player.hp = this.player.maxHp
					await this.timeoutSync(() => {
						this.seBox.playLVUP()
						EffectsManager.showEffect(this.gameContainer, this.player, this.player.x, this.player.y, "LEVEL UP!", "heal")
						this.message.add("レベルが上がった!")
					}, 300)
					// # MESSAGE
					await this.timeoutSync(() => {
						EffectsManager.showEffect(this.gameContainer, this.player, this.player.x, this.player.y, `HP +${upHp}`, "heal")
						this.message.add(`HP +${upHp}`)
					}, 600)
					// # MESSAGE
					await this.timeoutSync(() => {
						EffectsManager.showEffect(this.gameContainer, this.player, this.player.x, this.player.y, `攻撃力 +${upAtk}`, "heal")
						this.message.add(`攻撃力 +${upAtk}`)
					}, 600)
					// # MESSAGE
					resolve("ok")
				}, 300)
			})
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
		switchGrid(this.gameContainer, false)
		
		// 難易度選択マップに戻る
		selector = new DifficultySelector(this.myIcon)
	}
}
