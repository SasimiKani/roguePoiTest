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
		this.rooms.push({ x, y, w, h })
	}
	connectRooms(r1, r2) {
		let x1 = r1.x + Math.floor(r1.w / 2)
		let y1 = r1.y + Math.floor(r1.h / 2)
		let x2 = r2.x + Math.floor(r2.w / 2)
		let y2 = r2.y + Math.floor(r2.h / 2)
		while (x1 !== x2) {
			if (this.grid[y1][x1] === MAP_TILE.WALL) this.grid[y1][x1] = ' '
			x1 += (x2 > x1) ? 1 : -1
		}
		while (y1 !== y2) {
			if (this.grid[y1][x1] === MAP_TILE.WALL) this.grid[y1][x1] = ' '
			y1 += (y2 > y1) ? 1 : -1
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
				default:
					return randomInt(3, 8)
			}
		}
		const roomCount = countGen()
		for (let i = 0; i < roomCount; i++) { this.createRoom(); }
		for (let i = 0; i < this.rooms.length - 1; i++) { this.connectRooms(this.rooms[i], this.rooms[i + 1]); }
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
