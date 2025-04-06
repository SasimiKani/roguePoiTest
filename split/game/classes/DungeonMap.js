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
		const roomCount = (CONFIG.DIFFICULTY === "hard") ? randomInt(5, 8) : randomInt(3, 6)
		for (let i = 0; i < roomCount; i++) { this.createRoom(); }
		for (let i = 0; i < this.rooms.length - 1; i++) { this.connectRooms(this.rooms[i], this.rooms[i + 1]); }
	}
	revealRoom(px, py) {
		for (let room of this.rooms) {
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
						}
					}
				}
				return
			}
		}
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
