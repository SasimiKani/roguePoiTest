// BaseEntity クラス
class BaseEntity {
	constructor(x, y, tile) {
		this.x = x
		this.y = y
		this.tile = tile
	}
}
// Player クラス
class Player extends BaseEntity {
	constructor(x, y, initialHP, tile = '😊') {
		super(x, y, tile)
		this.hp = initialHP
		this.maxHp = initialHP
		this.attack = 2
		this.healAmount = 3
		this.level = 1
		this.exp = 0
		this.hunger = 100
		this.maxHunger = 100
		this.inventory = []
		this.weapon = null
	}
}
// Enemy.js
// Base Enemy クラス
class Enemy extends BaseEntity {
	static floorRange = [1, 3]
	constructor(name, x, y, hp, exp, atk = 1, tile = '👾') {
		super(x, y, tile)
		this.name = name
		this.hp = hp
		this.atk = atk
		this.exp = exp
		this.action = 1
		this.maxAction = 1

		/**
		 * [{name, range, func, duration}, ...]
		 * 
		 * rangeで射程範囲を設定して
		 * プレイヤーとの位置関係で行動を決定する
		 * 整数値：自座標からの直線距離
		 * 
		 * durationに待ち時間ミリ秒を設定できる
		 */
		this.skills = []

		/**
		 * 探索アルゴリズム
		 * デフォルトは経路探索
		 */
		this.searchAlgo = SearchAlgorithm.routePlanning
	}
	takeDamage(damage) {
		this.hp -= damage
	}

	// 通常攻撃
	async attack(game) {
		game.player.hp -= this.atk
		if (game.player.hp < 0) game.player.hp = 0
		EffectsManager.showEffect(game.gameContainer, game.player, game.player.x, game.player.y, `-${this.atk}`, "damage-me")
		game.message.add(`${this.name}の攻撃　${this.atk}ダメージ`)
		game.seBox.playDamageMe()

		await game.timeoutSync(()=>{}, 400)
	}

	// スキル射程範囲取得
	get skillRange() {
		return this.skills.map(skill => skill.range)
	}

	// 射程範囲内スキル取得
	validRangeSkills(player) {
		return this.skills.filter(skill => {
			const px = player.x, py = player.y
			const ex = this.x, ey = this.y
			const dx = Math.abs(px - ex), dy = Math.abs(py - ey)
			
			return (dx === dy && dx <= skill.range) ||
					(dy === 0 && dx <= skill.range) ||
					(dx === 0 && dy <= skill.range)
		})
	}

	// スキル数取得
	get skillCount() {
		return this.skills.length
	}
	// スキル数取得（射程範囲内）
	validSkillCount(player) {
		return this.validRangeSkills(player).length
	}

	// 個別スキル
	async skill(game, index) {
		const skill = this.validRangeSkills(game.player)[index]
		game.message.add(`${this.name}の${skill.name}`)
		await skill.func(game)
		
		await game.timeoutSync(()=>{
		}, skill.duration || 0)
	}
}

// 敵クラス群

class EnemyLarvae extends Enemy { static floorRange = [1, 5]
	constructor(x, y, hp) {
		super("Larvae", x, y, hp, 5, 1, '🐛')
	}
}

class EnemyAnt extends Enemy { static floorRange = [2, 7]
	constructor(x, y, hp) {
		super("Ant", x, y, hp + 2, 6, 2, '🐜')
	}
}

class EnemyCrayfish extends Enemy { static floorRange = [3, 9]
	constructor(x, y, hp) {
		super("Crayfish", x, y, hp + 3, 8, 3, '🦞')
	}
}

class EnemyCrab extends Enemy { static floorRange = [3, 9]
	constructor(x, y, hp) {
		super("Crab", x, y, hp + 5, 100, 1, '🦀')
		this.searchAlgo = SearchAlgorithm.routeFlee
	}
}

class EnemySlime extends Enemy { static floorRange = [5, 8]
	constructor(x, y, hp) {
		super("Slime", x, y, hp + 5, 7, 1, '🟩')
		this.skills = [
			Skill.actionPurupuru(this)
		]
	}
	//takeDamage(damage) {
	//	super.takeDamage(damage)
	//	if (this.hp > 0) { this.hp += this.regenerationRate; }
	//}
}

class EnemyBat extends Enemy { static floorRange = [7, 12]
	constructor(x, y, hp) {
		super("Bat", x, y, hp, 10, 2, '🦇')
		this.searchAlgo = SearchAlgorithm.randomRoute
	}
}

class EnemyGoblin extends Enemy { static floorRange = [8, 13]
	constructor(x, y, hp) {
		super("Goblin", x, y, hp + 8, 16, 4, '👹')
	}
}

class EnemySkeleton extends Enemy { static floorRange = [10, null]
	constructor(x, y, hp) {
		super("Skeleton", x, y, hp + 10, 19, 4, '💀')
	}
}

class EnemySpider extends Enemy { static floorRange = [10, null]
	constructor(x, y, hp) {
		super("Spider", x, y, hp + 8, 18, 3, '🕷️')
	}
}

class EnemyWizard extends Enemy { static floorRange = [10, null]
	constructor(x, y, hp) {
		super("Wizard", x, y, hp + 12, 25, 2, '🧙')
		this.magicAtk = 8
		this.skills = [
			Skill.offensiveMagic(this)
		]
	}
}

class EnemyDragon extends Enemy { static floorRange = [10, null]
	constructor(x, y, hp) {
		super("Dragon", x, y, hp + 30, 50, 10, '🐉')
		this.magicDamage = 2
		this.action = this.maxAction = 2 // ニ回行動
		this.breathAtk = 7
		this.skills = [
			Skill.offensiveBreath(this)
		]
	}
}
class EnemyRat extends Enemy {
	static floorRange = [1, 3]
	constructor(x, y, hp) {
		// 小型で素早いが、攻撃力は低め
		super("ructor", x, y, hp, 3, 2, '🐀')
	}
}

class EnemyZombie extends Enemy {
	static floorRange = [2, 6]
	constructor(x, y, hp) {
		// ゆっくり動くが、hpに余裕を持たせた敵
		super("ructor", x, y, hp + 4, 5, 1, '🧟')
	}
}

class EnemyVampire extends Enemy {
	static floorRange = [5, 10]
	constructor(x, y, hp) {
		// 中～高レベル向け。hpと攻撃力が上昇し、ダメージ吸収（吸血）効果を追加
		super("ructor", x, y, hp + 8, 12, 3, '🧛')
	}
	// ダメージを受けた際、一定割合のhpを回復する（吸血効果）
	takeDamage(damage) {
		super.takeDamage(damage)
		if (this.hp > 0) { this.hp += Math.floor(damage * 0.3); }
	}
}

class EnemyOgre extends Enemy {
	static floorRange = [7, 12]
	constructor(x, y, hp) {
		// 高いhpと攻撃力を持つが、行動数や移動速度は低め
		super("ructor", x, y, hp + 20, 22, 1, '🧌')
	}
}

class EnemyGhost extends Enemy {
	static floorRange = [8, 13]
	constructor(x, y, hp) {
		// 高速で動くが、耐久性は低い。後に壁通過や透明化の特殊効果を実装することも可能
		super("ructor", x, y, hp, 15, 4, '👻')
	}
}

class EnemyElemental extends Enemy {
	static floorRange = [10, null]
	constructor(x, y, hp) {
		// 高難易度用。魔法耐性や特殊な魔法攻撃を加えることで、戦略を要する敵に
		super("ructor", x, y, hp + 15, 30, 3, '🔥')
		this.magicResistance = 5
	}
}

// InventoryItem クラス
class InventoryItem extends BaseEntity {
	constructor(x, y, name, tile, useFunction) {
		super(x, y, tile)
		this.name = name
		this.use = useFunction
	}
}
class HealItem extends InventoryItem {
	constructor(x, y, name, tile, healAmount, stuffAmount) {
		super(x, y, name, tile, async function(game) {
			game.seBox.playEat()
			game.player.hp += healAmount
			if (game.player.hp > game.player.maxHp) game.player.hp = game.player.maxHp
			EffectsManager.showEffect(game.gameContainer, game.player, game.player.x, game.player.y, `+${healAmount}`, "heal")
			game.message.add(`${name}を食べて${healAmount}ポイント回復`)

			game.player.hunger += stuffAmount // 食事ボーナス
			if (game.player.hunger > game.player.maxHunger) game.player.hunger = game.player.maxHunger
			EffectsManager.showEffect(game.gameContainer, game.player, game.player.x, game.player.y, `+${stuffAmount}`, "food")
			game.message.add(`少しお腹がふくれた`)

			await game.timeoutSync(()=>{}, 400)
		})
	}
}
class FoodItem extends InventoryItem {
	constructor(x, y, name, tile, stuffAmount) {
		super(x, y, name, tile, async function(game) {
			game.seBox.playEat()
			game.player.hunger += stuffAmount
			if (game.player.hunger > game.player.maxHunger) game.player.hunger = game.player.maxHunger
			EffectsManager.showEffect(game.gameContainer, game.player, game.player.x, game.player.y, `+${stuffAmount}`, "food")
			game.message.add(`${name}を食べて少しお腹がふくれた`)
			
			await game.timeoutSync(()=>{}, 400)
		})
	}
}

class BoxItem extends InventoryItem {
	constructor(x, y, capacity) {
		// 箱を使うときは、箱の中身を確認するオーバーレイを開く
		super(x, y, "箱", '📦', (game) => {
			this.game = game
			this.openBox()
		})

		// 容量は5～10程度。未指定ならランダムに決定
		this.capacity = capacity || randomInt(5, 10)
		this.contents = []
		this.name = `箱（${this.contents.length}/${this.capacity}）`

		// オーバーレイ要素の生成
		this.overlay = document.createElement("div")
		this.overlay.className = "box-overlay"
	
		// タイトル：箱内のアイテム数と容量を表示
		this.title = document.createElement("h3")
		this.title.textContent = `箱の中身 (${this.contents.length}/${this.capacity})`
		this.overlay.appendChild(this.title)
	
		// アイテム一覧表示用コンテナ（スクロール可能）
		this.listContainer = document.createElement("div")
		this.listContainer.className = "box-item-list-container"
		this.list = document.createElement("ul")
		this.list.className = "box-item-list"
		this.listContainer.appendChild(this.list)
		this.overlay.appendChild(this.listContainer)
	
		// 操作方法の説明
		this.instructions = document.createElement("p")
		this.instructions.textContent = "↑/↓: 選択	D: 出す	U: 使う	X: 置く	Esc: 閉じる"
		this.overlay.appendChild(this.instructions)
	}
	
	updateName() {
		this.name = `箱（${this.contents.length}/${this.capacity}）`
	}

	// 箱にアイテムを入れる（箱同士の入れ子は不可）
	insertItem(item) {
		if (item instanceof BoxItem) return false; // 箱は入れない
		if (this.contents.length < this.capacity) {
			this.contents.push(item)
			return true
		}
		return false
	}

	// 箱からアイテムを取り出す（指定したインデックスのアイテムを削除して返す）
	removeItem(index) {
		if (index >= 0 && index < this.contents.length) {
			return this.contents.splice(index, 1)[0]
		}
		return null
	}

	// ・出す：箱からアイテムを取り出しインベントリに戻す。
	// ・使う：箱内のアイテムを使用する。
	// ・置く：箱内のアイテムを取り出して地面に配置する。
	openBox() {
		this.selectionIndex = 0; // 現在選択中の箱内アイテムのインデックス
		
		document.body.appendChild(this.overlay)
	
		// オーバーレイ内のリストを描画
		this.renderList()
		
		// bind して Game インスタンスの game を保持
		this.boundOnKeyDown = this.onKeyDown.bind(this)
		document.addEventListener("keydown", this.boundOnKeyDown)

		// 箱オーバーレイ中は通常操作を停止
		this.game.boxOverlayActive = true
	}

	// キーボード入力ハンドラ
	onKeyDown = (e) => {
		// ↑/↓でカーソル移動
		if (inventoryBoxArrowUp(this, e)) return
		if (inventoryBoxArrowDown(this, e)) return
		// 出す：箱内の選択アイテムを取り出してインベントリへ
		if (inventoryBoxD(this, e)) return
		// 使う：箱内の選択アイテムを使用
		if (inventoryBoxU(this, e)) return
		// 置く：箱内の選択アイテムを取り出して地面に設置
		if (inventoryBoxX(this, e)) return
		// Esc でオーバーレイを閉じる
		if (inventoryBoxEscape(this, e)) return
	}

	cleanup = () => {
		this.game.boxOverlayActive = false
		document.removeEventListener("keydown", this.boundOnKeyDown)
		this.overlay.remove()
		this.updateName()
		this.game.boxSelected = null
		// オーバーレイ終了後、ゲームの再描画
		this.game.renderer.render()
	}

	renderList() {
		this.title.textContent = `箱の中身 (${this.contents.length}/${this.capacity})`
		this.list.innerHTML = ""
		this.contents.forEach((item, index) => {
			const li = document.createElement("li")
			li.textContent = `${item.tile} ${item.name}`
			// カーソル位置の場合は背景色を変更
			if (index === this.selectionIndex) {
				li.style.backgroundColor = "#444"
				li.style.color = "#fff"
			}
			this.list.appendChild(li)
		})
	}
}

// MagicSpell クラス
class MagicSpell extends InventoryItem {
	constructor(x, y, name, tile, emoji, options) {
		super(x, y, name, tile, async (game) => {
			game.actionProgress = true
			game.seBox.playMagic()
			game.message.add(`${this.name}を使った`)
			return new Promise(async (resolve) => {
				let affected = false
				if (!options.effect) {
					//EffectsManager.showMagicEffect(game.gameContainer, game.player, game.player.x, game.player.y, this.area, this.emoji || "✨")
					///// console.log("showMagicEffectCircle Start")
					await EffectsManager.showMagicEffectCircle(game.gameContainer, game.player, game.player.x, game.player.y, this.area, this.emoji || "✨")
					
					for (let i = game.enemies.length - 1; i >= 0; i--) {
						let enemy = game.enemies[i]
						if (Math.abs(enemy.x - game.player.x) <= this.area &&
								Math.abs(enemy.y - game.player.y) <= this.area) {
							enemy.hp -= this.damage
							EffectsManager.showEffect(game.gameContainer, game.player, enemy.x, enemy.y, `-${this.damage}`, "damage")
							affected = SVGComponentTransferFunctionElement

							let hitEnemy = game.enemies[i]
		
							if (hitEnemy.hp <= 0) {
								const idx = game.enemies.indexOf(hitEnemy)
				
								EffectsManager.showEffect(game.gameContainer, game.player, hitEnemy.x, hitEnemy.y, "💥", "explosion")
								// # MESSAGE
								game.enemies.splice(i, 1)
					
								await game.timeoutSync(() => {
									game.message.add(`${hitEnemy.name}を倒した`)
								}, 300)
								EffectsManager.showEffect(game.gameContainer, game.player, hitEnemy.x, hitEnemy.y, `+${hitEnemy.exp} EXP`, "heal")
								game.message.add(`経験値を${hitEnemy.exp}ポイント得た`)
								// # MESSAGE
								game.score += 50
					
								console.log(hitEnemy)
								await game.gainExp(hitEnemy.exp)
							}
						}
					}
					if (this.fallbackHeal && !affected) {
						game.player.hp += this.fallbackHeal
						if (game.player.hp > game.player.maxHp) game.player.hp = game.player.maxHp
						EffectsManager.showEffect(game.gameContainer, game.player, game.player.x, game.player.y, `+${this.fallbackHeal}`, "heal")
					}
					///// console.log("showMagicEffectCircle End")
		
					game.timeoutSync(()=>{
						game.actionProgress = false
						resolve("ok")
					}, 400)
				} else {
					options.effect(game).then(() => {
			
						game.timeoutSync(()=>{
							game.actionProgress = false
							resolve("ok")
						}, 400)
					})
				}
			})
		})
		this.emoji = emoji
		this.damage = options.damage + Math.round(options.player.attack * 0.5)
		this.area = options.area
		this.fallbackHeal = options.fallbackHeal
	}
}
// WeaponItem クラス
class WeaponItem extends InventoryItem {
	constructor(x, y, name, tile, bonus) {
		super(x, y, name, tile, async (game) => 
			new Promise(resolve => {
				if (game.player.weapon === this) {
					this.unEquip(game)
				} else if (game.player.weapon) {
					this.unEquip(game, game.player.weapon)
					this.equip(game)
				} else {
					this.equip(game)
				}
				setTimeout(() => {
					resolve("ok")
				}, 400)
			})
		)
		this.bonus = bonus
	}
	
	equip(game, weapon = this) {
		game.seBox.playEquip()
		game.message.add(`${this.name}を装備した`)
		game.player.weapon = weapon
		game.player.attack += weapon.bonus
		EffectsManager.showEffect(game.gameContainer, game.player, game.player.x, game.player.y, `武器装備+${weapon.bonus}`, "heal")
	}
	
	unEquip(game, weapon = this) {
		game.seBox.playDisarm()
		game.message.add(`${this.name}の装備を外した`)
		game.player.attack -= game.player.weapon.bonus
		game.player.weapon = null
		EffectsManager.showEffect(game.gameContainer, game.player, game.player.x, game.player.y, `装備解除-${weapon.bonus}`, "damage-me")
	}
}
// 遠距離射撃武器クラス
class ShootingItem extends InventoryItem {
	/**
	 * @param {number} x - 生成位置X
	 * @param {number} y - 生成位置Y
	 * @param {string} name - アイテム名（例："射撃キット"）
	 * @param {string} tile - 表示用絵文字（例："🔫"）
	 * @param {number} damage - 射撃時のダメージ
	 * @param {number} range - 射程（タイル数）
	 * @param {string} projectileEmoji - 射撃エフェクト用絵文字
	 */
	constructor(x, y, name, tile, stack, damage, range, projectileEmoji) {
		// use() の動作を独自に定義するため、InventoryItem の use 関数を上書きする
		super(x, y, name, tile, async (game) => {
			return new Promise((resolve) => {
				this.prepareShooting(game).then(() => {
					this.stack--; // 使ったら数を減らす
					this.updateName(); // 名前の残数を更新
					resolve()
				})
			})
		})
		this.originalName = name
		this.stack = stack
		this.updateName()
		this.damage = damage
		this.range = range || 5
		this.projectileEmoji = projectileEmoji || '●'
	}
	
	updateName() {
		this.name = `${this.originalName} x${this.stack}`
	}
	
	/**
	 * 射撃準備モードに入り、方向キーで射撃方向を決定させる
	 * @param {Game} game - ゲームインスタンス
	 */
	async prepareShooting(game) {
		// 射撃準備モードに入った旨を画面に表示（例: EffectsManager の独自プロンプトなど）
		EffectsManager.showShootingPrompt(game.gameContainer)
		// ゲーム側で射撃中は入力を制限するためのフラグを設定
		game.isAwaitingShootingDirection = true
		// 入力待ち（Promiseで方向キー入力を待機）
		const direction = await this.waitForDirectionInput()
		// 入力完了後、フラグを解除し、プロンプトを隠す
		game.isAwaitingShootingDirection = false
		EffectsManager.hideShootingPrompt(game.gameContainer)
		// 射撃実行
		game.message.add(`${this.name}を撃った`)
		await this.shoot(game, direction)
	}
	
	/**
	 * キー入力で射撃方向を取得する
	 * ArrowUp/Down/Left/Right のいずれかが押されるまで待機
	 * @returns {Promise<{dx:number, dy:number}>}
	 */
	waitForDirectionInput() {
		return new Promise(resolve => {
			// 押下状態を保持するオブジェクト
			let keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false }
			let timeoutId
	
			// 現在のキー状態から方向を算出する
			function updateDirection() {
				let dx = 0, dy = 0
				if (keys.ArrowLeft) { dx -= 1; }
				if (keys.ArrowRight) { dx += 1; }
				if (keys.ArrowUp) { dy -= 1; }
				if (keys.ArrowDown) { dy += 1; }
				return { dx, dy }
			}
	
			function onKeyDown(e) {
				if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
					keys[e.key] = true
					// 入力があればタイマーをリセット
					if (timeoutId) clearTimeout(timeoutId)
					timeoutId = setTimeout(() => {
						const direction = updateDirection()
						document.removeEventListener("keydown", onKeyDown)
						document.removeEventListener("keyup", onKeyUp)
						resolve(direction)
					}, 50)
				}
			}
	
			function onKeyUp(e) {
				if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
					keys[e.key] = false
				}
			}
	
			document.addEventListener("keydown", onKeyDown)
			document.addEventListener("keyup", onKeyUp)
		})
	}
	
	/**
	 * 射撃エフェクトを表示し、射程内の直線上にいる敵にダメージを与える
	 * @param {Game} game - ゲームインスタンス
	 * @param {{dx:number, dy:number}} direction - 射撃方向
	 */
	async shoot(game, direction) {
		game.seBox.playArrow()
		// 射撃エフェクト
		EffectsManager.showShootingLineEffect(
			game.gameContainer,
			game.player,
			direction,
			this.range,
			this.projectileEmoji,
			{ factor: null, duration: 0.2 }
		)
		
		// 敵の中から、射撃方向上にある敵を探す（簡易的な直線判定）
		let hitEnemy = null
		let minDist = Infinity
		for (let enemy of game.enemies) {
			const relX = enemy.x - game.player.x
			const relY = enemy.y - game.player.y
			const dot = relX * direction.dx + relY * direction.dy
			if (dot > 0 && dot <= this.range) {
				const perp = Math.abs(relX * direction.dy - relY * direction.dx)
				if (perp < 0.5) { // 0.5タイル以内なら直線上とみなす
					if (dot < minDist) {
						minDist = dot
						hitEnemy = enemy
					}
				}
			}
		}
		
		// もし射程内に直線上の敵が存在すればダメージを与える
		if (hitEnemy) {
			let damage = Math.round(this.damage + game.player.attack * 0.2)
			hitEnemy.hp -= damage
			EffectsManager.showEffect(game.gameContainer, game.player, hitEnemy.x, hitEnemy.y, `-${damage}`, "damage")
			game.message.add(`${hitEnemy.name}に${damage}ダメージ`)
			
			if (hitEnemy.hp <= 0) {
				const idx = game.enemies.indexOf(hitEnemy)

				EffectsManager.showEffect(game.gameContainer, game.player, hitEnemy.x, hitEnemy.y, "💥", "explosion")
				// # MESSAGE
				game.enemies.splice(idx, 1)
	
				await game.timeoutSync(() => {
					game.message.add(`${hitEnemy.name}を倒した`)
				}, 300)
				EffectsManager.showEffect(game.gameContainer, game.player, hitEnemy.x, hitEnemy.y, `+${hitEnemy.exp} EXP`, "heal")
				game.message.add(`経験値を${hitEnemy.exp}ポイント得た`)
				// # MESSAGE
				game.score += 50
	
				await game.gainExp(hitEnemy.exp)
			}
		}
	}
}
