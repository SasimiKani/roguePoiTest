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
		this.defense = 1
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

	constructor(name, x, y, hp, exp, atk = 1, def = 0, tile = '👾') {
		super(x, y, tile)
		this.name = name
		this.hp = hp
		this.atk = atk
		this.def = def
		this.exp = exp
		this.action = 1
		this.maxAction = 1
		this.isSleep = !randomInt(0, 4) // 1/5くらいの確率で寝てる

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
		this.searchAlgo = (game, startX, startY, targetX, targetY) => SearchAlgorithm.routePlanning(game, startX, startY, targetX, targetY)
	}
	takeDamage(damage) {
		this.hp -= damage
		if (this.isSleep) {
			this.isSleep = false
			this.sleepEffect.remove()
		}
	}

	// 通常攻撃
	async attack(game) {
		let damage = calcDamage(this.atk, game.player.defense)
		game.player.hp -= damage
		if (game.player.hp < 0) game.player.hp = 0
		EffectsManager.showEffect(game.gameContainer, game.player, game.player.x, game.player.y, `-${damage}`, "damage-me")
		game.message.add(`${this.name}の攻撃　${damage}ダメージ`)
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
class EnemyLarvae extends Enemy {
	constructor(x, y, hp) {
		// フロア1相当：atk=3, def=1
		super("イモムシ", x, y, hp, 5, 3, 1, '🐛')
	}
}

class EnemyAnt extends Enemy {
	constructor(x, y, hp) {
		// フロア2相当：atk=6, def=2
		super("アリ", x, y, hp + 2, 6, 6, 2, '🐜')
	}
}

class EnemyFish extends Enemy {
	constructor(x, y, hp) {
		// フロア3相当：atk=7, def=2
		super("フィッシュ", x, y, hp, 6, 4, 1, '🐟️')
	}
}

class EnemyCrab extends Enemy {
	constructor(x, y, hp) {
		// フロア8相当（ミニボス級・逃走タイプ）：atk=5, def=14
		super("カニ", x, y, hp + 30, 100, 5, 14, '🦀')
		this.searchAlgo = (game, startX, startY, targetX, targetY) =>
			SearchAlgorithm.routeFlee(game, startX, startY, targetX, targetY)
		this.action = this.maxAction = 2; // 二回行動
	}
}

class EnemyCrayfish extends Enemy {
	constructor(x, y, hp) {
		// フロア4相当：atk=9, def=4
		super("ザリガニ", x, y, hp + 3, 8, 9, 4, '🦞')
	}
}

class EnemyTropicalfish extends Enemy {
	constructor(x, y, hp) {
		// フロア5相当：atk=10, def=4
		super("トロピカフィッシュ", x, y, hp + 7, 10, 7, 3, '🐠')
		this.searchAlgo = (game, sx, sy, tx, ty) =>
			SearchAlgorithm.randomRoute(game, sx, sy, tx, ty)
	}
}

class EnemyHarisenbon extends Enemy {
	constructor(x, y, hp) {
		// フロア8相当：atk=16, def=9
		super("ハリセンボン", x, y, hp + 15, 18, 10, 5, '🐡')
	}
}

class EnemyShark extends Enemy {
	constructor(x, y, hp) {
		// フロア11相当：atk=22, def=16
		super("シャーク", x, y, hp + 20, 35, 22, 16, '🦈')
		this.action = this.maxAction = 2
	}
}

class EnemySlime extends Enemy {
	constructor(x, y, hp) {
		// フロア2相当：atk=6, def=2
		super("スライム", x, y, hp + 5, 7, 6, 2, '🟩')
	}
}

class EnemyBat extends Enemy {
	constructor(x, y, hp) {
		// フロア4相当：atk=9, def=4
		super("コウモリ", x, y, hp, 10, 9, 4, '🦇')
	}
}

class EnemyGoblin extends Enemy {
	constructor(x, y, hp) {
		// フロア6相当：atk=13, def=7
		super("ゴブリン", x, y, hp + 8, 16, 13, 7, '👹')
	}
}

class EnemySkeleton extends Enemy {
	constructor(x, y, hp) {
		// フロア6相当：atk=13, def=7
		super("スケルトン", x, y, hp + 10, 19, 13, 7, '💀')
	}
}

class EnemySpider extends Enemy {
	constructor(x, y, hp) {
		// フロア7相当：atk=14, def=6
		super("クモ", x, y, hp + 8, 18, 14, 6, '🕷️')
	}
}

class EnemyWizard extends Enemy {
	constructor(x, y, hp) {
		// フロア10相当：atk=20, def=14
		super("ウィザード", x, y, hp + 12, 25, 20, 14, '🧙')
		this.magicAtk = 8
		this.skills = [ Skill.offensiveMagic(this) ]
	}
}

class EnemyDragon extends Enemy {
	constructor(x, y, hp) {
		// フロア15相当：atk=29, def=26
		super("ドラゴン", x, y, hp + 30, 50, 29, 26, '🐉')
		this.breathAtk = 7
		this.action = this.maxAction = 2
		this.skills = [ Skill.offensiveBreath(this) ]
	}
}

class EnemyRat extends Enemy {
	constructor(x, y, hp) {
		// フロア3相当：atk=7, def=2
		super("ラット", x, y, hp, 3, 7, 2, '🐀')
	}
}

class EnemyZombie extends Enemy {
	constructor(x, y, hp) {
		// フロア9相当：atk=17, def=10
		super("ゾンビ", x, y, hp + 4, 5, 17, 10, '🧟')
	}
}

class EnemyVampire extends Enemy {
	constructor(x, y, hp) {
		// フロア12相当：atk=23, def=17
		super("バンパイア", x, y, hp + 8, 12, 23, 17, '🧛')
	}
	takeDamage(damage) {
		super.takeDamage(damage)
		if (this.hp > 0) {
			this.hp += Math.floor(damage * 0.3)
		}
	}
}

class EnemyOgre extends Enemy {
	constructor(x, y, hp) {
		// フロア14相当：atk=26, def=20
		super("オーガ", x, y, hp + 20, 22, 26, 20, '🧌')
	}
}

class EnemyGhost extends Enemy {
	constructor(x, y, hp) {
		// フロア13相当：atk=24, def=18
		super("ゴースト", x, y, hp, 15, 24, 18, '👻')
	}
}

class EnemyElemental extends Enemy {
	constructor(x, y, hp) {
		// フロア16相当：atk=30, def=28
		super("エレメンタル", x, y, hp + 15, 30, 30, 28, '🔥')
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
			game.player.hp += this.healAmount
			if (game.player.hp > game.player.maxHp) game.player.hp = game.player.maxHp
			EffectsManager.showEffect(game.gameContainer, game.player, game.player.x, game.player.y, `+${this.healAmount}`, "heal")
			game.message.add(`${this.name}を食べて${this.healAmount}ポイント回復`)

			game.player.hunger += this.stuffAmount // 食事ボーナス
			if (game.player.hunger > game.player.maxHunger) game.player.hunger = game.player.maxHunger
			EffectsManager.showEffect(game.gameContainer, game.player, game.player.x, game.player.y, `+${this.stuffAmount}`, "food")
			game.message.add(`少しお腹がふくれた`)

			await game.timeoutSync(()=>{}, 400)
		})

		this.healAmount = healAmount
		this.stuffAmount = stuffAmount
	}
}
class FoodItem extends InventoryItem {
	constructor(x, y, name, tile, stuffAmount) {
		super(x, y, name, tile, async function(game) {
			game.seBox.playEat()
			game.player.hunger += this.stuffAmount
			if (game.player.hunger > game.player.maxHunger) game.player.hunger = game.player.maxHunger
			EffectsManager.showEffect(game.gameContainer, game.player, game.player.x, game.player.y, `+${this.stuffAmount}`, "food")
			game.message.add(`${this.name}を食べて少しお腹がふくれた`)
			
			await game.timeoutSync(()=>{}, 400)
		})

		this.stuffAmount = stuffAmount
	}
}

class BoxItem extends InventoryItem {
	constructor(x, y, capacity) {
		// 箱を使うときは、箱の中身を確認するオーバーレイを開く
		super(x, y, "箱", '📦', (game) => {
			if (DEBUG) console.log(this)
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
		this.instructions.classList.add("commands")
		this.instructions.classList.add("inventory-modal")
		this.instructions.innerHTML = "↑/↓: 選択\nD: 出す\nU: 使う\nX: 置く\nEsc: 閉じる"
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
		this.isOpen = true
		this.selectionIndex = 0; // 現在選択中の箱内アイテムのインデックス
		
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
		this.isOpen = false
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
	constructor(x, y, name, tile, options) {
		super(x, y, name, tile, async (game) => {
			game.actionProgress = true
			game.seBox.playMagic()
			game.message.add(`${this.name}を使った`)
			return new Promise(async (resolve) => {
				let affected = false
				if (!options.effect) {
					//EffectsManager.showMagicEffect(game.gameContainer, game.player, game.player.x, game.player.y, this.area, this.emoji || "✨")
					if (DEBUG) console.log("showMagicEffectCircle Start")
					await EffectsManager.showMagicEffectCircle(game.gameContainer, game.player, game.player.x, game.player.y, this.area, this.tile || "✨")
					
					for (let i = game.enemies.length - 1; i >= 0; i--) {
						let enemy = game.enemies[i]
						if (Math.abs(enemy.x - game.player.x) <= this.area &&
								Math.abs(enemy.y - game.player.y) <= this.area) {
							const damage = options.damage + Math.round(game.player.attack * 0.5)
							enemy.takeDamage(damage)
							EffectsManager.showEffect(game.gameContainer, game.player, enemy.x, enemy.y, `-${damage}`, "damage")
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
					
								if (DEBUG) console.log(hitEnemy)
								await game.gainExp(hitEnemy.exp)
							}
						}
					}
					if (this.fallbackHeal && !affected) {
						game.player.hp += this.fallbackHeal
						if (game.player.hp > game.player.maxHp) game.player.hp = game.player.maxHp
						EffectsManager.showEffect(game.gameContainer, game.player, game.player.x, game.player.y, `+${this.fallbackHeal}`, "heal")
					}
					if (DEBUG) console.log("showMagicEffectCircle End")
		
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
		this.area = options.area
		this.fallbackHeal = options.fallbackHeal
	}
}

// {name: "火の玉", tile: '🔥', damage: 20, area: 1, fallbackHeal: null})
// {name: "たつまき", tile: '🌪️', damage: 15, area: 2, fallbackHeal: null})
// {name: "大波", tile: '🌊', damage: 25, area: 4, fallbackHeal: null})
// {name: "カミナリ", tile: '⚡️', damage: 30, area: 1, fallbackHeal: null})
// {name: "エクスプロージョン", tile: '💥', damage: 50, area: 3, fallbackHeal: null})
// {name: "メテオ", tile: '🌠', damage: 30, area: 5, fallbackHeal: null})
// {name: "リカバーオール", tile: '✨️', damage: null, area: null, fallbackHeal: 100})
// {name: "ワープ", tile: '🌀', damage: null, area: null, fallbackHeal: null, effect: async (game) => 

class MagicFireball extends MagicSpell {
	constructor(x, y) {
		super(x, y, "火の玉", "🔥", {
			damage: 20,
			area: 1,
			fallbackHeal: null
		})
	}
}
class MagicTornament extends MagicSpell {
	constructor(x, y) {
		super(x, y, "たつまき", "🌪️", {
			damage: 15,
			area: 2,
			fallbackHeal: null
		})
	}
}
class MagicBigWave extends MagicSpell {
	constructor(x, y) {
		super(x, y, "大波", "🌊", {
			damage: 25,
			area: 4,
			fallbackHeal: null
		})
	}
}
class MagicLightning extends MagicSpell {
	constructor(x, y) {
		super(x, y, "カミナリ", "⚡️", {
			damage: 30,
			area: 1,
			fallbackHeal: null
		})
	}
}
class MagicExplosion extends MagicSpell {
	constructor(x, y) {
		super(x, y, "エクスプロージョン", "💥", {
			damage: 50,
			area: 3,
			fallbackHeal: null
		})
	}
}
class MagicMeteor extends MagicSpell {
	constructor(x, y) {
		super(x, y, "メテオ", "🌠", {
			damage: 30,
			area: 5,
			fallbackHeal: null
		})
	}
}
class MagicRecoverAll extends MagicSpell {
	constructor(x, y) {
		super(x, y, "リカバーオール", "✨️", {
			damage: null,
			area: null,
			fallbackHeal: 100
		})
	}
}
class MagicWarp extends MagicSpell {
	constructor(x, y) {
		super(x, y, "ワープ", "🌀", {
			damage: null,
			area: null,
			fallbackHeal: null,
			effect: async (game) => {
				// 現在部屋を除外してワープ先ルームを選ぶ
				const otherRooms = game.map.rooms.filter(room =>
					!(
						game.player.x >= room.x &&
						game.player.x <	room.x + room.w &&
						game.player.y >= room.y &&
						game.player.y <	room.y + room.h
					)
				)
				if (otherRooms.length === 0) return; // 念のため
			
				const toRoom = otherRooms[randomInt(0, otherRooms.length - 1)]
			
				// 候補セルを収集
				const candidates = []
				for (let ix = toRoom.x; ix < toRoom.x + toRoom.w; ix++) {
					for (let iy = toRoom.y; iy < toRoom.y + toRoom.h; iy++) {
						// 床タイルかつ敵がいない
						if (
							game.map.grid[iy][ix] === ' ' &&
							!game.enemies.some(e => e.x === ix && e.y === iy)
						) {
							candidates.push({ x: ix, y: iy })
						}
					}
				}
			
				// 候補が空ならフォールバック
				if (candidates.length === 0) {
					console.warn("ワープ先に使えるセルがありませんでした。ワープキャンセル")
					return
				}
			
				// ランダムに選んで座標更新
				const { x: toX, y: toY } = candidates[randomInt(0, candidates.length - 1)]
				game.player.x = toX
				game.player.y = toY
			
				// ■ 視界更新 ■
				game.map.visible[toY][toX] = true
				game.map.revealRoom(toX, toY)
				game.map.revealAround(toX, toY)
			
				// ターン進行・再描画
				game.advanceTurn()
				game.renderer.render()
			}
		})
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
// ShieldItem クラス
class ShieldItem extends InventoryItem {
	constructor(x, y, name, tile, bonus) {
		super(x, y, name, tile, async (game) => 
			new Promise(resolve => {
				if (game.player.shield === this) {
					this.unEquip(game)
				} else if (game.player.shield) {
					this.unEquip(game, game.player.shield)
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
	
	equip(game, shield = this) {
		game.seBox.playEquip()
		game.message.add(`${this.name}を装備した`)
		game.player.shield = shield
		//game.player.attack += shield.bonus
		EffectsManager.showEffect(game.gameContainer, game.player, game.player.x, game.player.y, `盾装備+${shield.bonus}`, "heal")
	}
	
	unEquip(game, shield = this) {
		game.seBox.playDisarm()
		game.message.add(`${this.name}の装備を外した`)
		//game.player.attack -= game.player.shield.bonus
		game.player.shield = null
		EffectsManager.showEffect(game.gameContainer, game.player, game.player.x, game.player.y, `装備解除-${shield.bonus}`, "damage-me")
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
	constructor(x, y, name, tile, stack, damage, range, projectileEmoji, isThrow=false, originItem=null) {
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
		this.isThrow = isThrow
		this.originItem = originItem
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
		game.message.add(`${this.name}を${this.isThrow ? "投げた" : "撃った"}`)
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
			let damage = calcDamage(Math.round(this.damage + game.player.attack * 0.2), hitEnemy.def)
			hitEnemy.takeDamage(damage)
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
		} else {
			await game.timeoutSync(async () => {
				// 当たらなかったら
				// 1) 壁を越えないよう、実際に到達する「最遠到達点」を求める
				let endX = game.player.x
				let endY = game.player.y
				for (let i = 1; i <= this.range; i++) {
					const tx = game.player.x + direction.dx * i
					const ty = game.player.y + direction.dy * i
					// マップ外／壁だったらその手前で止める
					if (game.map.grid[ty][tx] === MAP_TILE.WALL) {
						break
					}
					endX = tx
					endY = ty
				}

				// 座標が重なっていたら周りの空いてるタイルに落とす
				const { x: dropX, y: dropY } = findDropPosition( endX, endY, game)
				
				// 2) ドロップするアイテムを作成（ここでは同じ ShootingItem を1個だけ落とす例）
				let dropped = null
				if (this.isThrow) {
					// 投げアイテム
					dropped = this.originItem
					dropped.x = dropX
					dropped.y = dropY
				} else {
					// 射撃武器
					dropped = new ShootingItem(
						dropX,
						dropY,
						this.originalName,
						this.tile,
						1,							// stack: 1 個だけ
						this.damage,		// ダメージはそのまま
						this.range,		 // 射程もそのまま（拾って再利用できる）
						this.projectileEmoji,
						this.isThrow
					)
				}

				// 3) ゲーム側の地面アイテムリストに追加
				game.items.push(dropped)
				
				game.message.add(`${dropped.name}を(${dropX},${dropY})に落とした`)
			}, 300)
		}
	}
}
