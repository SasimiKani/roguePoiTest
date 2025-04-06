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
	constructor(x, y, hp, exp, atk = 1, tile = '👾') {
		super(x, y, tile)
		this.hp = hp
		this.atk = atk
		this.exp = exp
		this.action = 1
		this.maxAction = 1
	}
	takeDamage(damage) {
		this.hp -= damage
	}
}

// 敵クラス群

class EnemyLarvae extends Enemy {
	static floorRange = [1, 5]
	constructor(x, y, hp) {
		super(x, y, hp, 5, 1, '🐛')
	}
}

class EnemyAnt extends Enemy {
	static floorRange = [2, 7]
	constructor(x, y, hp) {
		super(x, y, hp + 2, 6, 2, '🐜')
	}
}

class EnemyCrayfish extends Enemy {
	static floorRange = [3, 9]
	constructor(x, y, hp) {
		super(x, y, hp + 3, 8, 3, '🦞')
	}
}

class EnemySlime extends Enemy {
	static floorRange = [5, 8]
	constructor(x, y, hp) {
		super(x, y, hp + 5, 7, 1, '🟩')
		this.regenerationRate = 1
	}
	takeDamage(damage) {
		super.takeDamage(damage)
		if (this.hp > 0) { this.hp += this.regenerationRate; }
	}
}

class EnemyBat extends Enemy {
	static floorRange = [7, 12]
	constructor(x, y, hp) {
		super(x, y, hp, 10, 2, '🦇')
		this.evasion = 0.3
	}
}

class EnemyGoblin extends Enemy {
	static floorRange = [8, 13]
	constructor(x, y, hp) {
		super(x, y, hp + 8, 16, 4, '👹')
		this.stealChance = 0.2
	}
}

class EnemySkeleton extends Enemy {
	static floorRange = [10, null]
	constructor(x, y, hp) {
		super(x, y, hp + 10, 19, 4, '💀')
		this.resurrectionTimer = 0
	}
}

class EnemySpider extends Enemy {
	static floorRange = [10, null]
	constructor(x, y, hp) {
		super(x, y, hp + 8, 18, 3, '🕷️')
		this.poisonDamage = 1
	}
}

class EnemyWizard extends Enemy {
	static floorRange = [10, null]
	constructor(x, y, hp) {
		super(x, y, hp + 12, 25, 5, '🧙')
		this.magicDamage = 2
	}
}

class EnemyDragon extends Enemy {
	static floorRange = [10, null]
	constructor(x, y, hp) {
		super(x, y, hp + 30, 50, 10, '🐉')
		this.magicDamage = 2
		this.action = this.maxAction = 2 // ニ回行動
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

class BoxItem extends InventoryItem {
	constructor(x, y, capacity) {
		// 箱を使うときは、箱の中身を確認するオーバーレイを開く
		super(x, y, "箱", '📦', (game) => {
			game.openBox(this)
		})
		// 容量は5～10程度。未指定ならランダムに決定
		this.capacity = capacity || randomInt(5, 10)
		this.contents = []
		this.name = `箱（${this.contents.length}/${this.capacity}）`
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
}

// MagicSpell クラス
class MagicSpell extends InventoryItem {
	constructor(x, y, name, tile, emoji, options) {
		super(x, y, name, tile, async (game) => {
			return new Promise((resolve) => {
				let affected = false
				//EffectsManager.showMagicEffect(game.gameContainer, game.player, game.player.x, game.player.y, this.area, this.emoji || "✨")
				///// console.log("showMagicEffectCircle Start")
				EffectsManager.showMagicEffectCircle(game.gameContainer, game.player, game.player.x, game.player.y, this.area, this.emoji || "✨").then(() => {
					for (let i = game.enemies.length - 1; i >= 0; i--) {
						let enemy = game.enemies[i]
						if (Math.abs(enemy.x - game.player.x) <= this.area &&
								Math.abs(enemy.y - game.player.y) <= this.area) {
							enemy.hp -= this.damage
							EffectsManager.showEffect(game.gameContainer, game.player, enemy.x, enemy.y, `-${this.damage}`, "damage")
							affected = true
							if (enemy.hp <= 0) {
								EffectsManager.showEffect(game.gameContainer, game.player, enemy.x, enemy.y, "💥", "explosion")
								game.enemies.splice(i, 1)
								game.score += 50
								game.gainExp(5)
							}
						}
					}
					if (this.fallbackHeal && !affected) {
						game.player.hp += this.fallbackHeal
						if (game.player.hp > game.player.maxHp) game.player.hp = game.player.maxHp
						EffectsManager.showEffect(game.gameContainer, game.player, game.player.x, game.player.y, `+${this.fallbackHeal}`, "heal")
					}
					///// console.log("showMagicEffectCircle End")
					resolve("ok")
				})
			})
		})
		this.emoji = emoji
		this.damage = options.damage
		this.area = options.area
		this.fallbackHeal = options.fallbackHeal
	}
}
// WeaponItem クラス
class WeaponItem extends InventoryItem {
	constructor(x, y, name, tile, bonus) {
		super(x, y, name, tile, async (game) => {
			if (game.player.weapon === this) {
				this.unEquip(game)
			} else if (game.player.weapon) {
				this.unEquip(game, game.player.weapon)
				game.queueTimeout(() => {
					this.equip(game)
				}, 400)
			} else {
				this.equip(game)
			}
		})
		this.bonus = bonus
	}
	
	equip(game, weapon = this) {
		game.player.weapon = weapon
		game.player.attack += weapon.bonus
		EffectsManager.showEffect(game.gameContainer, game.player, game.player.x, game.player.y, `武器装備+${weapon.bonus}`, "heal")
	}
	
	unEquip(game, weapon = this) {
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
		this.shoot(game, direction)
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
	shoot(game, direction) {
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
			hitEnemy.hp -= this.damage
			EffectsManager.showEffect(game.gameContainer, game.player, hitEnemy.x, hitEnemy.y, `-${this.damage}`, "damage")
			if (hitEnemy.hp <= 0) {
				EffectsManager.showEffect(game.gameContainer, game.player, hitEnemy.x, hitEnemy.y, "💥", "explosion")
				const idx = game.enemies.indexOf(hitEnemy)
				if (idx >= 0) {
					game.enemies.splice(idx, 1)
					game.score += 50
					game.gainExp(5)
				}
			}
		}
	}
}
