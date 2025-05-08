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
		// ── 初期化 ──
		rooms.forEach(r => {
			r.connections = { top: false, bottom: false, left: false, right: false };
		});

		// ── パス１：各部屋に１本ずつ──最も近い“前の部屋”と接続 ──
		for (let i = 1; i < rooms.length; i++) {
			const A = rooms[i];
			let nearest = null, bestDist = Infinity;
			for (let j = 0; j < i; j++) {
				const B = rooms[j];
				const dx = (A.x + A.w/2) - (B.x + B.w/2);
				const dy = (A.y + A.h/2) - (B.y + B.h/2);
				const d	= dx*dx + dy*dy;
				if (d < bestDist) {
					bestDist = d;
					nearest	= B;
				}
			}
			if (nearest) {
				this.connectRooms(A, nearest);
			}
		}

		// ── パス２：各部屋にもう１本──“全ての他の部屋”から距離順で接続を試みる ──
		rooms.forEach(A => {
			// すでにつながっている本数を数える
			let count = Object.values(A.connections).filter(f => f).length;
			if (count >= 2) return;

			// 自分以外の部屋を距離順ソート
			const candidates = rooms
				.filter(B => B !== A)
				.map(B => {
					const dx = (A.x + A.w/2) - (B.x + B.w/2);
					const dy = (A.y + A.h/2) - (B.y + B.h/2);
					return { room: B, dist: dx*dx + dy*dy };
				})
				.sort((a, b) => a.dist - b.dist);

			// 距離が近い順に接続を試み、成功したらカウントアップ
			for (const {room: B} of candidates) {
				if (count >= 2) break;
				if (this.connectRooms(A, B)) {
					count++;
				}
			}

			// 念のためまだ足りなければ、強制的に最も近い部屋と掘り直す
			if (count < 2 && candidates.length > 0) {
				const B = candidates[0].room;
				// 一度フラグをリセットして再接続
				A.connections = { top:false, bottom:false, left:false, right:false };
				B.connections = { top:false, bottom:false, left:false, right:false };
				this.connectRooms(A, B);
				// これで最低１本は確実に増えるので、計２本保証
			}
		});
	}

	generate() {
		this.reset()
		const countGen = () => {
			switch (CONFIG.DIFFICULTY) {
				case "easy":
					return randomInt(5, 7)
				case "normal":
					return randomInt(6, 8)
				case "normalPlus":
					return randomInt(7, 9)
				case "hard":
					return randomInt(8, 10)
				case "hardPlus":
					return randomInt(10, 12)
				default:
					return randomInt(3, 5)
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
