class SearchAlgorithm {
    // 敵の移動のために、プレイヤーまでの経路を探索します（経路探索アルゴリズム）。
    static routePlanning(game, startX, startY, targetX, targetY) {
		const queue = [{ x: startX, y: startY, path: [] }]
		const visited = new Set()
		visited.add(`${startX},${startY}`)
		
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
			// ゴールに到達したら経路を返す
			if (current.x === targetX && current.y === targetY) {
				return current.path
			}
			
			for (const d of directions) {
				const nx = current.x + d.dx
				const ny = current.y + d.dy
				
				// グリッド外は除外
				if (nx < 0 || ny < 0 || nx >= game.width || ny >= game.height) continue
				// 壁なら除外（この条件はグリッドデータと MAP_TILE.WALL の値が一致している前提）
				if (game.map.grid[ny][nx] === MAP_TILE.WALL) continue
				
				const key = `${nx},${ny}`
				if (!visited.has(key)) {
					visited.add(key)
					queue.push({ x: nx, y: ny, path: current.path.concat([{ x: nx, y: ny }]) })
				}
			}
		}
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