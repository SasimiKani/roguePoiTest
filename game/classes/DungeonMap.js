// DungeonMap クラス
class DungeonMap {
	constructor(width, height) {
		this.width = width
		this.height = height
		this.grid = []
		this.visible = []
		this.rooms = []
		this.reset()
	}
	reset() {
		this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(MAP_TILE.WALL))
		this.visible = Array.from({ length: this.height }, () => Array(this.width).fill(false))
		//this.visible = Array.from({ length: this.height }, () => Array(this.width).fill(true)) // デバッグ用
		this.rooms = []
	}
	createRoom() {
		let w = randomInt(5, 10)
		let h = randomInt(4, 8)
		let x = randomInt(1, this.width - w - 1)
		let y = randomInt(1, this.height - h - 1)
		for (let i = y; i < y + h; i++) {
			for (let j = x; j < x + w; j++) {
				this.grid[i][j] = ' '
			}
		}
		this.rooms.push({
			x, y, w, h,
			connections: {
				top: false,
				bottom: false,
				left: false,
				right: false
			}
		})
	}
	connectRooms(r1, r2) {
		const cx1 = r1.x + 1 + Math.floor((r1.w - 2) / 2)
		const cy1 = r1.y + 1 + Math.floor((r1.h - 2) / 2)
		const cx2 = r2.x + 1 + Math.floor((r2.w - 2) / 2)
		const cy2 = r2.y + 1 + Math.floor((r2.h - 2) / 2)

		// どの辺でつなぐか判定
		const dx = cx2 - cx1, dy = cy2 - cy1
		let dir1, dir2
		if (Math.abs(dx) > Math.abs(dy)) {
			dir1 = dx > 0 ? 'right' : 'left'
			dir2 = dx > 0 ? 'left'	: 'right'
		} else {
			dir1 = dy > 0 ? 'bottom': 'top'
			dir2 = dy > 0 ? 'top'	 : 'bottom'
		}

		// 既に通路があるならスキップ
		if (r1.connections[dir1] || r2.connections[dir2]) return false

		// フラグを立てて掘る
		r1.connections[dir1] = true
		r2.connections[dir2] = true

		let x = cx1, y = cy1
		while (x !== cx2) {
			if (this.grid[y][x] === MAP_TILE.WALL) this.grid[y][x] = ' '
			x += (cx2 > x) ? 1 : -1
		}
		while (y !== cy2) {
			if (this.grid[y][x] === MAP_TILE.WALL) this.grid[y][x] = ' '
			y += (cy2 > y) ? 1 : -1
		}

		return true
	}

	connectAllRooms(rooms) {
		// 接続フラグ初期化
		rooms.forEach(r => {
			r.connections = { top: false, bottom: false, left: false, right: false }
		})

		for (let i = 1; i < rooms.length; i++) {
			const A = rooms[i]
			// 0…i-1 の部屋を距離順にソート
			const candidates = rooms
				.slice(0, i)
				.map(B => {
					const dx = (A.x + A.w/2) - (B.x + B.w/2)
					const dy = (A.y + A.h/2) - (B.y + B.h/2)
					return { room: B, dist: dx*dx + dy*dy }
				})
				.sort((a, b) => a.dist - b.dist)

			// 距離が近い順に接続を試みる
			let connected = false
			for (const { room: B } of candidates) {
				if (this.connectRooms(A, B)) {
					connected = true
					break
				}
			}

			// 念のため全スキップされたら、一番近い部屋と強制接続
			if (!connected && candidates.length > 0) {
				const B = candidates[0].room
				// フラグをクリアしてから再接続（強制的に掘らせる）
				A.connections = { top: false, bottom: false, left: false, right: false }
				B.connections = { top: false, bottom: false, left: false, right: false }
				this.connectRooms(A, B)
			}
		}
	}

	generate() {
		this.reset()
		const countGen = () => {
			switch (CONFIG.DIFFICULTY) {
				case "easy":
					return randomInt(3, 5)
				case "normal":
					return randomInt(3, 6)
				case "normalPlus":
					return randomInt(4, 7)
				case "hard":
					return randomInt(5, 8)
				case "hardPlus":
					return randomInt(4, 9)
				default:
					return randomInt(3, 8)
			}
		}
		const roomCount = countGen()
		for (let i = 0; i < roomCount; i++) { this.createRoom(); }
		this.connectAllRooms(this.rooms)
	}
	revealRoom(px, py, rooms=this.rooms) {
		for (let room of rooms.filter(room => !this.isReveal(room))) {
			if (px >= room.x && px < room.x + room.w && py >= room.y && py < room.y + room.h) {
				for (let i = room.y; i < room.y + room.h; i++) {
					for (let j = room.x; j < room.x + room.w; j++) {
						this.visible[i][j] = true
						const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]]
						for (let [dx, dy] of dirs) {
							let nx = j + dx, ny = i + dy
							if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height && this.grid[ny][nx] === ' ') {
								this.visible[ny][nx] = true
							}
							// 重なった部屋を探す
							this.revealRoom(nx, ny, rooms.filter(filterRoom => {
								return !(filterRoom.x === room.x && filterRoom.y === room.y && filterRoom.w === room.w && filterRoom.h === room.h) && 
								filterRoom.x <= room.x + room.w && room.x <= filterRoom.x + filterRoom.w &&
								filterRoom.y <= room.y + room.h && room.y <= filterRoom.y + filterRoom.h
							}))
						}
					}
				}
				return
			}
		}
	}
	isReveal(room) {
		for (let i = room.y; i < room.y + room.h; i++) {
			for (let j = room.x; j < room.x + room.w; j++) {
				if (!this.visible[i][j]) {
					return false
				}
			}
		}
		return true
	}
	revealAround(x, y) {
		if (this.grid[y][x] === ' ') {
			for (let dy = -CONFIG.REVEALLV; dy <= CONFIG.REVEALLV; dy++) {
				for (let dx = -CONFIG.REVEALLV; dx <= CONFIG.REVEALLV; dx++) {
					let nx = x + dx, ny = y + dy
					if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
						this.visible[ny][nx] = true
					}
				}
			}
		}
	}
}
