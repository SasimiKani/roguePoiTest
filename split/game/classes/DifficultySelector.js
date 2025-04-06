// DifficultySelector クラス（修正版）
class DifficultySelector {
	constructor(myIcon="😊") {
		this.gridWidth = 15
		this.gridHeight = 15
		this.grid = []
		this.myIcon = myIcon
		for (let y = 0; y < this.gridHeight; y++) {
			this.grid[y] = []
			for (let x = 0; x < this.gridWidth; x++) {
				this.grid[y][x] = " "
			}
		}
		this.options = [
			{ x: 3, y: 3, difficulty: "easy", tile: difficultySettings.easy.wallEmoji },
			{ x: 11, y: 3, difficulty: "normal", tile: difficultySettings.normal.wallEmoji },
			{ x: 7, y: 11, difficulty: "hard", tile: difficultySettings.hard.wallEmoji }
		]
		this.options.forEach(opt => {
			for (var pos of [[-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0]]) {
				this.grid[opt.y + pos[1]][opt.x + pos[0]] = opt.tile
			}
		})
		this.playerX = Math.floor(this.gridWidth / 2)
		this.playerY = Math.floor(this.gridHeight / 2)
		this.inSelection = true
		this.render()
		this.handleKeyDown = this.handleKeyDown.bind(this)
		document.addEventListener('keydown', this.handleKeyDown)
		document.querySelector("button#change-icon").style.display = "inline"
	}
	render() {
		let html = ""
		for (let y = 0; y < this.gridHeight; y++) {
			for (let x = 0; x < this.gridWidth; x++) {
				if (x === this.playerX && y === this.playerY) {
					html += `<span>${this.myIcon}</span>`
				} else {
					html += `<span>${this.grid[y][x]}</span>`
				}
			}
			html += "<br>"
		}
		document.getElementById("game").innerHTML = html
	}
	handleKeyDown(e) {
		if (!this.inSelection) return
		// rキーで結果表示（難易度選択時のみ有効）
		if (e.key === 'r') {
			displayResults()
			return
		}
		let dx = 0, dy = 0
		if (e.key === "ArrowLeft") dx = -1
		else if (e.key === "ArrowRight") dx = 1
		else if (e.key === "ArrowUp") dy = -1
		else if (e.key === "ArrowDown") dy = 1
		if (dx !== 0 || dy !== 0) {
			let newX = this.playerX + dx
			let newY = this.playerY + dy
			if (newX < 0 || newX >= this.gridWidth || newY < 0 || newY >= this.gridHeight) return
			this.playerX = newX
			this.playerY = newY
			this.render()
			for (let opt of this.options) {
				if (opt.x === this.playerX && opt.y === this.playerY) {
					this.inSelection = false
					document.removeEventListener('keydown', this.handleKeyDown)
					startDungeonGame(opt.difficulty, this.myIcon)
					break
				}
			}
		}
	}
	
	changeIcon(myIcon) {
		this.myIcon = myIcon
		this.render()
	}
}

// グローバル関数としてリザルト表示処理を定義
function displayResults() {
	let results = JSON.parse(localStorage.getItem("gameResult") || "[]")
	
	// リザルトを日付の降順にする
	results = results.sort((a, b) => {
		const dateA = a.date
		const dateB = b.date
		return dateB.localeCompare(dateA)
	})
	
	let modalHtml = '<div class="results-modal" id="resultsModal">'
	modalHtml += '<h3>記録された結果</h3>'
	if (results.length === 0) {
		modalHtml += '<p>記録がありません。</p>'
	} else {
		// 同じcolgroupを両テーブルに挿入してカラム幅を揃える
		const colgroupHtml = '<colgroup>' +
			'<col style="width: 16.66%;">' +
			'<col style="width: 16.66%;">' +
			'<col style="width: 16.66%;">' +
			'<col style="width: 16.66%;">' +
			'<col style="width: 16.66%;">' +
			'<col style="width: 16.66%;">' +
			'</colgroup>'
			
		// ヘッダー用テーブル（table-layout: fixed）
		modalHtml += '<div class="results-modal-table">'
		modalHtml += '<table style="table-layout: fixed; width: 100%;">' +
			colgroupHtml +
			'<thead><tr><th>日付</th><th>難易度</th><th>フロア</th><th>結果</th><th>レベル</th><th>スコア</th></tr></thead>' +
			'</table>'
		modalHtml += '</div>'
		
		// データ部分を囲むスクロール領域
		modalHtml += '<div class="results-modal-table">'
		modalHtml += '<table style="table-layout: fixed; width: 100%;">' +
			colgroupHtml +
			'<tbody>'
		results.forEach(r => {
			modalHtml += `<tr><td>${new Date(r.date).toLocaleString()}</td>` +
				`<td>${r.dungeonLv == undefined ? "-" : r.dungeonLv}</td>` +
				`<td>${r.floor}</td>` +
				`<td>${r.clear ? "クリア" : "ゲームオーバー"}</td>` +
				`<td>${r.lv}</td>` +
				`<td>${r.score}</td></tr>`
		})
		modalHtml += '</tbody></table>'
		modalHtml += '</div>'
	}
	modalHtml += '<button onclick="closeResults()">閉じる</button>'
	modalHtml += '</div>'
	
	if (!document.getElementById("resultsModal")) {
		const modalDiv = document.createElement("div")
		modalDiv.innerHTML = modalHtml
		document.body.appendChild(modalDiv)
	}
}

function closeResults() {
	const modal = document.getElementById("resultsModal")
	if (modal) modal.remove()
}
