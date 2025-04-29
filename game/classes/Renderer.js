class Renderer {
    constructor(game) {
        this.game = game
    }

	isSubWallPos(tile, x, y) {
		return  tile == MAP_TILE.WALL &&
			((x + y * 10) % 59 == 0 || (x + y * 10) % 71 == 0)
	}
    
	renderMainView() {
		let html = ''
		var radius = CONFIG.VIEW_RADIUS
		const startX = this.game.player.x - radius
		const startY = this.game.player.y - radius
		for (let y = startY; y <= this.game.player.y + radius; y++) {
			for (let x = startX; x <= this.game.player.x + radius; x++) {
				let tile = MAP_TILE.WALL
				if (x >= 0 && x < this.game.width && y >= 0 && y < this.game.height) {
					if (!this.game.map.visible[y][x]) { html += `<span class="wall ${CONFIG.DIFFICULTY}">${this.isSubWallPos(MAP_TILE.WALL, x, y) ? MAP_TILE.SUB_WALL : MAP_TILE.WALL}</span>`; continue; }
					else if (this.game.player.x === x && this.game.player.y === y) tile = this.game.player.tile
					else {
						let drawn = false
						for (let enemy of this.game.enemies) {
							if (enemy.x === x && enemy.y === y) { tile = enemy.tile; drawn = true; break; }
						}
						if (!drawn) {
							for (let item of this.game.items) {
								if (item.x === x && item.y === y) { tile = item.tile; drawn = true; break; }
							}
							for (let gem of this.game.gems) {
								if (gem.x === x && gem.y === y) { tile = '💎'; drawn = true; break; }
							}
							if (!drawn && this.game.stairs.x === x && this.game.stairs.y === y) tile = MAP_TILE.STEPS
							if (!drawn && tile === MAP_TILE.WALL) tile = this.game.map.grid[y][x]
						}
					}
				}
				html += `<span class="${CONFIG.DIFFICULTY}">${this.isSubWallPos(tile, x, y) ? MAP_TILE.SUB_WALL : tile}</span>`
			}
			html += '<br>'
		}
		this.game.gameContainer.innerHTML = html
	}
	// ミニマップを生成し、現在の視界状態や各エンティティの位置を反映します。
	renderMinimap() {
		let html = ''
		for (let y = 0; y < this.game.height; y++) {
			for (let x = 0; x < this.game.width; x++) {
				let style = ""
				if (this.game.map.visible[y][x]) {
					if (this.game.player.x === x && this.game.player.y === y) style = "background-color: yellow;"
					else if (this.game.enemies.some(e => e.x === x && e.y === y)) style = "background-color: red;"
					else if (this.game.items.some(item => item.x === x && item.y === y)) style = "background-color: cyan;"
					else if (this.game.stairs.x === x && this.game.stairs.y === y) style = "border: 1px solid cyan; background-color: transparent;"
					else style = (this.game.map.grid[y][x] === ' ') ? "background-color: #555;" : "background-color: #222;"
				}
				html += `<div class="minimap-cell" style="${style}"></div>`
			}
		}
		this.game.minimapContainer.innerHTML = html
		this.game.minimapContainer.style.gridTemplateColumns = `repeat(${this.game.width}, 4px)`
	}
	// 上記のメインビューとミニマップの更新、及びインベントリオーバーレイなどのUI要素の再描画を統合的に行います。
	render() {
		if (!this.game.isPlay) return
		document.body.classList.remove("easy-dungeon", "hard-dungeon", "deep-dungeon")
		if (this.game.floor < 10) document.body.classList.add("easy-dungeon")
		else if (this.game.floor < 50) document.body.classList.add("hard-dungeon")
		else document.body.classList.add("deep-dungeon")
		const maxFloor = difficultySettings[CONFIG.DIFFICULTY].maxFloor
		const brightness = 80 - ((this.game.floor - 1) / (maxFloor - 1)) * 60
		document.body.style.backgroundColor = `hsl(0, 0%, ${brightness}%)`
		this.renderMainView()
		this.renderMinimap()
		document.getElementById('difficulty').innerText = CONFIG.DIFFICULTY
		document.getElementById('hp').innerText = this.game.player.hp
		document.getElementById('maxhp').innerText = this.game.player.maxHp
		document.getElementById('atk').innerText = this.game.player.attack
		document.getElementById('lv').innerText = this.game.player.level
		document.getElementById('exp').innerText = this.game.player.exp
		document.getElementById('floor').innerText = this.game.floor
		document.getElementById('score').innerText = this.game.score
		document.getElementById('hunger').innerText = this.game.player.hunger
		document.getElementById('maxhunger').innerText = this.game.player.maxHunger
		// プレイヤーのHPや満腹度などのステータスバーを更新します。
		this.game.uiManager.update(this.game.player)
		if (this.game.inventoryOpen) {
			let invHtml = `<div class="inventory-modal">`
			invHtml += `<h3>所持品 (${this.game.player.inventory.length + (this.game.groundItem ? 1 : 0)}/${CONFIG.INVENTORY_MAX})</h3>`
			invHtml += `<ul style="min-height:20px;">`
			for (let i = 0; i < this.game.player.inventory.length; i++) {
				let selected = (i === this.game.inventorySelection) ? ">> " : ""
				let itemName = this.game.player.inventory[i].name || "アイテム"
				if (this.game.player.inventory[i] instanceof WeaponItem && this.game.player.weapon === this.game.player.inventory[i])
					itemName += " (装備中)"
				if (this.game.player.inventory[i] === this.game.boxSelected)
					itemName += "（この箱に入れる）"
				invHtml += `<li class="${(i === this.game.inventorySelection) ? 'selected' : ''} ${this.game.player.inventory[i] === this.game.boxSelected ? 'boxSelected' : ''}">${selected}${this.game.player.inventory[i].tile} ${itemName}</li>`
			}
			invHtml += `</ul>`
		
			// コマンド表示用の配列（インベントリ側）
			let invCommands = []
			
			// 選択中のアイテム
			let selectedItem = this.game.player.inventory[this.game.inventorySelection]
			
			if (this.game.boxSelected) {
				if (selectedItem === this.game.boxSelected) {
					// 選択中の箱が選択されている場合は「I: 入れる」を表示
					invCommands.push("I: キャンセル")
				} else {
					// 箱が選択されている場合は「I: 入れる」を表示
					invCommands.push("I: 入れる")
				}
			}
			
			// クラスごとのコマンド
			if (selectedItem instanceof BoxItem && !this.game.boxSelected) {
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
				if (this.game.player.weapon === selectedItem) {
					invCommands.push("U: 外す")
				} else {
					invCommands.push("U: 装備")
				}
			}
			else {
				invCommands.push("U: 使う")
			}
			
			if (this.game.groundItem) {
				invCommands.push("X: 交換")
			} else {
				invCommands.push("D: 置く")
			}
			
			// それ以外の基本コマンド
			invCommands.push("ESC/E: 閉じる")
			invCommands.push("Y: 整理")
		
			invHtml += `<p>（${invCommands.join(", ")}）</p>`
		
			// 足元アイテムの表示
			if (this.game.groundItem) {
				invHtml += `<hr>`
				invHtml += `<h3>足元</h3>`
				invHtml += `<ul style="min-height:20px;">`
				let index = this.game.player.inventory.length
				let selected = (index === this.game.inventorySelection) ? ">> " : ""
				invHtml += `<li class="${(index === this.game.inventorySelection) ? 'selected' : ''}">${selected}${this.game.groundItem.tile} ${this.game.groundItem.tile === '🔼' ? "階段" : this.game.groundItem.name}</li>`
				invHtml += `</ul>`
				// コマンド表示用の配列（足元）
				let grdCommands = []
				if (this.game.groundItem.tile === '🔼') {
					grdCommands.push("U: 降りる")
				} else {
					if (this.game.player.inventory.length < CONFIG.INVENTORY_MAX) {
						grdCommands.push("P: 拾う")
					}
					
					// クラスごとのコマンド
					if (this.game.groundItem instanceof MagicSpell) {
						// 魔法の場合は「」を表示
						grdCommands.push("U: 唱える")
					}
					else if (this.game.groundItem instanceof WeaponItem) {
						grdCommands.push("U: 装備")
					}
					else {
						grdCommands.push("U: 使う")
					}
				}
				invHtml += `<p>（${grdCommands.join(", ")}）</p>`
			}
			invHtml += `</div>`
			this.game.gameContainer.innerHTML += invHtml
		}
	}
	// プレイヤーのHPや満腹度などのステータスバーを更新します。
}