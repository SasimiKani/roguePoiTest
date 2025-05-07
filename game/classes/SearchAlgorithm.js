class SearchAlgorithm {
    // 敵の移動のために、プレイヤーまでの経路を探索します（経路探索アルゴリズム）。
	static routePlanning(game, startX, startY, targetX, targetY) {
		// １）移動用の８方向（探索にはこのまま使う）
		const moveDirs = [
			{ dx:	1, dy:	0 },
			{ dx: -1, dy:	0 },
			{ dx:	0, dy:	1 },
			{ dx:	0, dy: -1 },
			{ dx:	1, dy:	1 },
			{ dx: -1, dy: -1 },
			{ dx:	1, dy: -1 },
			{ dx: -1, dy:	1 }
		]
	
		// ２）ゴール判定用は上下左右４方向のみ
		const goalDirs = moveDirs.filter(d => d.dx === 0 || d.dy === 0)
	
		// プレイヤー周囲４マスをゴール候補に登録
		const goalSet = new Set()
		for (const d of goalDirs) {
			const gx = targetX + d.dx
			const gy = targetY + d.dy
			if (gx < 0 || gy < 0 || gx >= game.width || gy >= game.height) continue
			if (game.map.grid[gy][gx] === MAP_TILE.WALL) continue
			goalSet.add(`${gx},${gy}`)
		}
	
		// ３）BFS 初期化
		const queue	 = [{ x: startX, y: startY, path: [] }]
		const visited = new Set([`${startX},${startY}`])
	
		// ４）BFS ループ
		while (queue.length > 0) {
			const cur = queue.shift()
	
			// ゴール候補に到達したら経路を返す
			if (goalSet.has(`${cur.x},${cur.y}`)) {
				return cur.path
			}
	
			// 隣接８マスを探索
			for (const d of moveDirs) {
				const nx = cur.x + d.dx
				const ny = cur.y + d.dy
				const key = `${nx},${ny}`
	
				if (nx < 0 || ny < 0 || nx >= game.width || ny >= game.height) continue
				if (game.map.grid[ny][nx] === MAP_TILE.WALL) continue
				if (visited.has(key)) continue
	
				visited.add(key)
				queue.push({
					x: nx,
					y: ny,
					path: cur.path.concat([{ x: nx, y: ny }])
				})
			}
		}
	
		// どのゴール候補にも到達できなかったら null
		return null
	}
	

	// 逃げる敵
	static routeFlee(game, startX, startY, targetX, targetY) {
		function distance(x1, y1, x2, y2) {
			return Math.abs(x1 - x2) + Math.abs(y1 - y2) // マンハッタン距離
		}
		
		const queue = [{ x: startX, y: startY, path: [] }]
		const visited = new Set()
		visited.add(`${startX},${startY}`)
	
		let bestPath = null
		let bestDistance = distance(startX, startY, targetX, targetY)
	
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
	
			const currentDistance = distance(current.x, current.y, targetX, targetY)
			if (currentDistance > bestDistance) {
				bestDistance = currentDistance
				bestPath = current.path
			}
	
			for (const d of directions) {
				const nx = current.x + d.dx
				const ny = current.y + d.dy
	
				if (nx < 0 || ny < 0 || nx >= game.width || ny >= game.height) continue
				if (game.map.grid[ny][nx] === MAP_TILE.WALL || (nx === targetX && ny === targetY)) continue
	
				const key = `${nx},${ny}`
				if (!visited.has(key)) {
					visited.add(key)
					queue.push({ 
						x: nx, 
						y: ny, 
						path: current.path.concat([{ x: nx, y: ny }]) 
					})
				}
			}
		}
	
		// 最も距離を稼げたパスを返す
		return bestPath ? [bestPath[0]] : null
	}

	// ランダムに動く敵
	static randomRoute(game, startX, startY, targetX, targetY) {
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
	
		// 移動できる方向だけ抽出
		const movable = []
		for (const d of directions) {
			const nx = startX + d.dx
			const ny = startY + d.dy
	
			if (nx < 0 || ny < 0 || nx >= game.width || ny >= game.height) continue
			if (game.map.grid[ny][nx] === MAP_TILE.WALL) continue
	
			movable.push({ x: nx, y: ny })
		}
	
		if (movable.length === 0) {
			return null
		}
	
		// ランダムに1個選んでそこに向かう
		const next = movable[Math.floor(Math.random() * movable.length)]
		return [{ x: next.x, y: next.y }]
	}
}