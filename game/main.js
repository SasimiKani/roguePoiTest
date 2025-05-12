// 設定および初期化処理

// enemyList 関数（各敵クラスに応じたリストを返す）
function enemyList(floor, difficulty, freq) {
	const list = []
	let enemyDefinitions
	switch (difficulty) {
		case "easy":
			enemyDefinitions = easyEnemyDefinitions
			break
		case "normal":
			enemyDefinitions = normalEnemyDefinitions
			break
		case "normalPlus":
			enemyDefinitions = normalPlusEnemyDefinitions
			break
		case "hard":
			enemyDefinitions = hardEnemyDefinitions
			break
		case "hardPlus":
			enemyDefinitions = hardPlusEnemyDefinitions
			break
		default:
			enemyDefinitions = defaultEnemyDefinitions
	}
	
	enemyDefinitions.forEach(def => {
		if (def.floorRange[0] <= floor && (def.floorRange[1] === null || floor <= def.floorRange[1])) {
			for (var i=0; i<def.freq; i++) { // 頻度の高い敵ほど出やすくなる
				list.push(def)
			}
		}
	})

	if (list.length === 0) list.push( new EnemyDefinition(EnemyLarvae,   [1, null], null) )
	
	if (DEBUG) console.log(JSON.stringify(list.map(l => l.prototype.constructor.name)))

	return list
}

function startDungeonGame(difficulty, myIcon="😊") {
	CONFIG.DIFFICULTY = difficulty
	CONFIG.REVEALLV = difficultySettings[difficulty].revealLv
	MAP_TILE.WALL = difficultySettings[difficulty].wallEmoji
	MAP_TILE.SUB_WALL = difficultySettings[difficulty].wallSubEmoji

	if (!!localStorage[`savedata-${difficulty}`]) {
		// 中断データがある場合
		EffectsManager.showContinueConfirmationKeyboard(() => {
			setTimeout(() => {
				document.querySelector("button#change-icon").style.display = "none"
				selector.bgmBox.stopBGM()
				if (DEBUG) console.groupCollapsed()
				const data = localStorage.getItem(`savedata-${difficulty}`)
				const decomp = LZString.decompressFromEncodedURIComponent(data)
				const game = Serializer.deserialize(decomp)
				if (DEBUG) console.groupEnd()
				game.load()

				// ロードしたら中断データを削除
				//localStorage.removeItem(`savedata-${difficulty}`)
			}, 300)
		}, () => {
			setTimeout(() => {
				document.querySelector("button#change-icon").style.display = "none"
				selector.bgmBox.stopBGM()
				new Game(myIcon)
			}, 300)
		})
		return
	}

	setTimeout(() => {
		document.querySelector("button#change-icon").style.display = "none"
		selector.bgmBox.stopBGM()
		new Game(myIcon)
	}, 300)
}

function closeResults() {
	const modal = document.getElementById("resultsModal")
	if (modal) modal.remove()
}

// アイコンを設定
const myIcon = document.querySelector("input[name=my-icon]")
const spanIcon	= document.querySelector("span.icon")
spanIcon.textContent = myIcon.value

document.querySelector("button#change-icon").addEventListener("click", () => {
	const modal = document.createElement("div")
	const inputIcon = document.createElement("input")
	const confirmIcon = document.createElement("button")
	
	modal.className = "change-icon-modal"
	inputIcon.className = "change-icon-modal-input"
	inputIcon.value = myIcon.value
	inputIcon.size = 1
	confirmIcon.className = "change-icon-modal-button"
	
	confirmIcon.textContent = "決定"
	confirmIcon.addEventListener("click", () => {
		/*if (inputIcon.value.length != 1) {
			alert("アイコンは1文字にしてね")
			return
		}*/
		spanIcon.textContent = myIcon.value = inputIcon.value
		selector.changeIcon(myIcon.value)
		modal.remove()
	})
	
	modal.appendChild(inputIcon)
	modal.appendChild(confirmIcon)
	document.body.appendChild(modal)
})

// ゲーム開始のための難易度選択を開始
let selector = new DifficultySelector(myIcon.value)
