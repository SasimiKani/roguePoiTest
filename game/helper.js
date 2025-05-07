// ヘルパーメソッド群

/**
 * 指定された最小値・最大値の間のランダムな整数を返す
 */
function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min
}

function pickupItem(game, pickupItem) {
	const player = game.player
	const maxInventory = CONFIG.INVENTORY_MAX
	const isShooting = pickupItem instanceof ShootingItem
	// 同じ型の射撃アイテムが既にインベントリにあるか
	const inventoryHasSameType = player.inventory.some(
		i => i.constructor.name === pickupItem.constructor.name
	)

	if (isShooting) {
		// 射撃アイテムの場合
		if (inventoryHasSameType) {
			// 既に同じ射撃アイテムがあれば、スタック処理
			for (const i of player.inventory) {
				if (i.constructor.name === pickupItem.constructor.name) {
					i.stack += pickupItem.stack; // 例：stackプロパティで管理
					if (typeof i.updateName === "function") {
						i.updateName(); // 表示名にスタック数を反映
					}
					EffectsManager.showEffect(
						game.gameContainer, player, player.x, player.y, "GET"
					)
					// 足元アイテムがあればクリアして、インベントリオープンを解除
					if (game.groundItem) {
						game.groundItem = null
						game.inventoryOpen = false
					}
					return false
				}
			}
		} else {
			// 同じ射撃アイテムが存在しない場合
			if (player.inventory.length < maxInventory) {
				player.inventory.push(pickupItem)
				EffectsManager.showEffect(
					game.gameContainer, player, player.x, player.y, "GET"
				)
				// 足元アイテムがあればクリアして、インベントリオープンを解除
				if (game.groundItem) {
					game.groundItem = null
					game.inventoryOpen = false
				}
				return false
			} else {
				return true; // インベントリ満杯なら何もせず終了
			}
		}
	} else {
		// 射撃アイテム以外の場合は、単純に空きがあれば拾う
		if (player.inventory.length < maxInventory) {
			player.inventory.push(pickupItem)
			EffectsManager.showEffect(
				game.gameContainer, player, player.x, player.y, "GET"
			)
			// 足元アイテムがあればクリアして、インベントリオープンを解除
			if (game.groundItem) {
				game.groundItem = null
				game.inventoryOpen = false
			}
			return false
		} else {
			return true
		}
	}
}

/* プレイヤーがいる部屋を取得する */
function* getPlayerRoom(game) {
	for (let room of game.map.rooms) {
		if (
			game.player.x >= room.x &&
			game.player.x < room.x + room.w &&
			game.player.y >= room.y &&
			game.player.y < room.y + room.h
		) {
			yield room
		}
	}
}
/* 座標が部屋に含まれるか取得する */
function isInRoom(x, y, room) {
	if (!room) return false
	if (room.x <= x && x <= room.x + room.w &&
			room.y <= y && y <= room.y + room.h) {
		return true
	} else {
		return false
	}
}

/* グリッド表示を切り替える */
function switchGrid(container, on=false) {
	
	// グリッド用コンテナ
	const gridContainer = document.querySelector(".grid")
	Array.from(gridContainer.children).forEach(child => child.remove())
	
	if (on) {
		const D = CONFIG.VIEW_RADIUS * 2 + 1
		for (var i=0; i<D; i++) {
			for (var j=0; j<D; j++) {
				const span = document.createElement("span")
				span.textContent = " "
				gridContainer.appendChild(span)
			}
			const br = document.createElement("br")
			gridContainer.appendChild(br)
		}
	} else {
		Array.from(gridContainer.children).forEach(child => child.remove())
	}
}

// ----------------------------------------------
// 再帰的に半径を拡大して空きマスを探す関数
// ----------------------------------------------
function findDropPosition(startX, startY, game, radius = 0) {
	const positions = []

	// リングの上下辺 (dx: -radius～+radius, dy=±radius)
	for (let dx = -radius; dx <= radius; dx++) {
		positions.push({ x: startX + dx, y: startY +	radius })
		positions.push({ x: startX + dx, y: startY -	radius })
	}
	// リングの左右辺 (dy: -radius+1～+radius-1, dx=±radius)
	for (let dy = -radius + 1; dy <= radius - 1; dy++) {
		positions.push({ x: startX +	radius, y: startY + dy })
		positions.push({ x: startX -	radius, y: startY + dy })
	}

	for (const pos of positions) {
		const { x, y } = pos
		// 範囲外チェック
		if (
			y < 0 ||
			x < 0 ||
			y >= game.map.grid.length ||
			x >= game.map.grid[0].length
		) continue
		// 壁チェック
		if (game.map.grid[y][x] === MAP_TILE.WALL) continue
		// 既存アイテム重複チェック
		const occupied = game.items.some(it => it.x === x && it.y === y)
		if (!occupied) {
			return { x, y }
		}
	}

	// 見つからなければ半径を 1 増やして再帰
	return findDropPosition(startX, startY, game, radius + 1)
}

// 与ダメージ計算関数
function calcDamage(attack, defense) {
	const dmg = Math.floor((attack * attack) / (attack + defense))
	return Math.max(1, dmg)
}