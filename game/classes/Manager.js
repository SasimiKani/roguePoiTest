// EffectsManager クラス
class EffectsManager {
	static async showFieldEffect(container, emoji, many) {
		const rect = container.getBoundingClientRect()
		const containerSize = CONFIG.FONT_SIZE * (CONFIG.VIEW_RADIUS * 2 + 1)
		
		let chain = Promise.resolve()
		for (var i=0; i<many; i++) {
			const promise = () => new Promise(r => {
				const span = document.createElement("span")
				const x = randomInt(rect.left, rect.left + containerSize)
				const y = randomInt(rect.top, rect.top + containerSize)
				span.textContent = emoji
				span.style.left = `${x}px`
				span.style.top = `${y}px`
				span.classList.add("field-effects")
				
				document.body.appendChild(span)
				setTimeout(() => {r()}, 3000 / many)
			})
			
			chain = chain.then(() => promise())
		}
	}
	
	static showEffect(container, player, x, y, text, type = "damage") {
		const dx = x - player.x
		const dy = y - player.y
		const spans = container.children
		const index = (8 + dy) * 16 + (7 + dx)
		if (!spans[index]) return
		const target = spans[index]
		const rect = target.getBoundingClientRect()
		const fx = document.createElement("div")
		fx.className = type
		fx.textContent = text
		if (type === "explosion") {
			fx.style.left = `${rect.left + rect.width / 2 + window.scrollX}px`
			fx.style.top = `${rect.top + window.scrollY - rect.height * 0.6 + 30}px`
		} else {
			fx.style.left = `${rect.left + rect.width / 2 + window.scrollX + randomInt(-30, 30)}px`
			fx.style.top = `${rect.top + window.scrollY - rect.height * 0.6}px`
		}
		document.body.appendChild(fx)
		setTimeout(() => fx.remove(), 1000)
	}
	static showMagicEffect(container, player, centerX, centerY, area, emoji) {
		for (let dy = -area; dy <= area; dy++) {
			for (let dx = -area; dx <= area; dx++) {
				const x = centerX + dx
				const y = centerY + dy
				if (!(x === centerX && y === centerY)) {
					const spans = container.children
					const index = (7 + (y - player.y)) * 16 + (7 + (x - player.x))
					if (!spans[index]) continue
					const target = spans[index]
					const rect = target.getBoundingClientRect()
					const fx = document.createElement("div")
					fx.className = "magic-particle"
					fx.textContent = emoji
					fx.style.left = `${rect.left + rect.width / 2 + window.scrollX + randomInt(-8, 8)}px`
					fx.style.top = `${rect.top + rect.height / 2 + window.scrollY + randomInt(-8, 8)}px`
					document.body.appendChild(fx)
					setTimeout(() => fx.remove(), 800)
				}
			}
		}
	}
	
	static async showMagicEffectCircle(container, player, centerX, centerY, area, emoji) {
		return new Promise((resolve) => {
			// 生成するパーティクル数（エリアや演出に合わせて調整可能）
			const numParticles = 20
			// エリア（タイル単位）をピクセル変換する係数。ここでは例として8px/タイルを使用
			const factor = CONFIG.FONT_SIZE
			
			// container の中央位置を算出（gameContainer ではなく、中央表示が前提の位置）
			const spans = container.children
			const index = 7 * 16 + 7
			if (!spans[index]) return
			const rect = spans[index].getBoundingClientRect()
			
			for (let i = 0; i < numParticles; i++) {
				const angle = Math.random() * 2 * Math.PI; // 0～2πの角度
				const distance = Math.random() * area * factor + CONFIG.FONT_SIZE; // 0～area*factor ピクセルの距離
				const dx = Math.cos((i * 360 / numParticles) * Math.PI / 180) * distance - CONFIG.FONT_SIZE / 2 + (centerX - player.x) * CONFIG.FONT_SIZE
				const dy = Math.sin((i * 360 / numParticles) * Math.PI / 180) * distance - CONFIG.FONT_SIZE / 2 + (centerY - player.y) * CONFIG.FONT_SIZE
				
				const particle = document.createElement("div")
				particle.className = "magic-particle"
				particle.textContent = emoji
				
				// 初期状態：中央に表示、スケール1、透明度1
				particle.style.position = "absolute"
				particle.style.left = `${rect.left + rect.width / 2 + window.scrollX + dx}px`
				particle.style.top = `${rect.top + rect.height / 2 + window.scrollY + dy}px`
				particle.style.transform = "translate(0, 0) scale(1)"
				particle.style.opacity = "1"
				particle.style.transition = "transform 0.8s ease-out, opacity 0.8s ease-out"
				particle.style.pointerEvents = "none"
				document.body.appendChild(particle)
				
				// 少し待ってから、指定方向へ移動＆縮小・フェードアウト
				setTimeout(() => {
					particle.style.transform = `translate(${dx}px, ${dy}px) scale(0)`
					particle.style.opacity = "0"
				}, 10)
				
				// アニメーション完了後、パーティクルを削除
				setTimeout(() => {
					particle.remove()
					resolve("OK")
				}, 610)
			}
		})
	}
	
	/**
	 * 装備なし時の攻撃モーション
	 * プレイヤーのタイルが再描画に影響されないよう、
	 * gameContainer の中央位置からオーバーレイ要素を一時的に表示して移動させる
	 * @param {HTMLElement} container ゲーム画面のコンテナ要素
	 * @param {number} dx キー入力の水平方向 (-1,0,1)
	 * @param {number} dy キー入力の垂直方向 (-1,0,1)
	 */
	static showAttackMotionNoWeapon(container, dx, dy) {
		// ゲーム画面の中央位置を計算（以前の centerIndex の代わり）
		const rect = container.getBoundingClientRect()
		const fontSize = CONFIG.FONT_SIZE
		const centerX = rect.left + window.scrollX + rect.width / 2 - (fontSize / 2) /*font-size*/ + (dx * fontSize) /*方向*/
		const centerY = rect.top + window.scrollY + rect.height / 2 - fontSize /*font-size*/ + (dy * fontSize) /*方向*/
		
		// オーバーレイ用のエフェクト要素を作成
		const effect = document.createElement("div")
		effect.className = "attack-no-weapon"
		// （必要であればプレイヤーの絵文字等を表示可能）
		effect.textContent = "👊"
		effect.style.position = "absolute"
		effect.style.left = `${centerX}px`
		effect.style.top = `${centerY}px`
		effect.style.transition = "transform 0.05s ease-out"
		effect.style.zIndex = "1500"
		effect.style.fontSize = `${fontSize}px`
		document.body.appendChild(effect)
		
		// 少しだけ入力方向へ移動し、すぐ戻す
		setTimeout(() => {
			effect.style.transform = `translate(${dx * 5}px, ${dy * 5}px)`
			setTimeout(() => {
				effect.style.transform = "translate(0, 0)"
				setTimeout(() => {
					effect.remove()
				}, 50)
			}, 50)
		}, 10)
	}

	/**
	 * 装備あり時の攻撃モーション
	 * キー入力方向に武器の絵文字を振るアニメーションを付ける（非同期処理）
	 * gameContainer の中央位置を元に計算するため、再描画の影響を受けない
	 * @param {HTMLElement} container ゲーム画面のコンテナ要素
	 * @param {number} dx キー入力の水平方向 (-1,0,1)
	 * @param {number} dy キー入力の垂直方向 (-1,0,1)
	 * @param {string} weaponEmoji 武器として表示する絵文字
	 */
	static showAttackMotionWeapon(container, dx, dy, weaponEmoji) {
		const rect = container.getBoundingClientRect()
		const fontSize = CONFIG.FONT_SIZE
		const centerX = rect.left + window.scrollX + rect.width / 2 - (fontSize / 2) /*font-size*/ + (dx * fontSize) /*方向*/
		const centerY = rect.top + window.scrollY + rect.height / 2 - fontSize /*font-size*/ + (dy * fontSize) /*方向*/
		
		// 武器の振るエフェクト要素を作成
		const weaponEffect = document.createElement("div")
		weaponEffect.className = "weapon-swing"
		weaponEffect.textContent = weaponEmoji
		weaponEffect.style.position = "absolute"
		weaponEffect.style.left = `${centerX}px`
		weaponEffect.style.top = `${centerY}px`
		weaponEffect.style.fontSize = "24px"
		weaponEffect.style.pointerEvents = "none"
		weaponEffect.style.opacity = "1"
		weaponEffect.style.transition = "transform 0.3s ease-out, opacity 0.3s ease-out"
		weaponEffect.style.zIndex = "1500"
		weaponEffect.style.fontSize = `${fontSize}px`
		document.body.appendChild(weaponEffect)
		
		// 0.3秒で入力方向へ20px移動＆回転、フェードアウト
		setTimeout(() => {
			weaponEffect.style.transform = `translate(${dx * 20}px, ${dy * 20}px) rotate(${dx * 30}deg)`
			weaponEffect.style.opacity = "0"
		}, 10)
		
		setTimeout(() => {
			weaponEffect.remove()
		}, 350)
	}
	
	/**
	 * 射撃準備用のプロンプトを表示する
	 * @param {HTMLElement} container - ゲーム画面のコンテナ要素
	 */
	static showShootingPrompt(container) {
		// 既にプロンプトが存在していれば何もしない
		if (document.querySelector(".shooting-prompt")) return
		
		// グリッド表示する
		switchGrid(container, true)
		
		const prompt = document.createElement("div")
		prompt.className = "shooting-prompt"
		prompt.textContent = "射撃方向を入力してください (矢印キー)"
		
		// スタイル設定（CSSに転写してもよい）
		prompt.style.position = "absolute"
		prompt.style.top = "10px"
		prompt.style.left = "10px"
		prompt.style.padding = "5px 10px"
		prompt.style.backgroundColor = "rgba(0, 0, 0, 0.7)"
		prompt.style.color = "#fff"
		prompt.style.fontSize = "16px"
		prompt.style.border = "2px solid #fff"
		prompt.style.borderRadius = "4px"
		prompt.style.zIndex = "3000"
		
		container.appendChild(prompt)
	}
	
	/**
	 * 射撃準備用プロンプトを非表示にする
	 */
	static hideShootingPrompt(container) {
		const prompt = document.querySelector(".shooting-prompt")
		if (prompt) prompt.remove()
		
		// グリッド非表示する
		switchGrid(container, false)
	}
	/**
	 * プレイヤーの位置から入力方向に弾が一直線に飛ぶエフェクトを表示する
	 * @param {HTMLElement} container ゲーム画面のコンテナ要素
	 * @param {Player} player プレイヤーオブジェクト（描画上は中央と仮定）
	 * @param {{dx:number, dy:number}} direction 射撃方向
	 * @param {number} range 射程（タイル数）
	 * @param {string} projectileEmoji 弾の絵文字（例："●"） デフォルトは上向き
	 * @param {Object} options オプション（factor: タイル1単位あたりのピクセル数、duration: アニメーション時間）
	 */
	static showShootingLineEffect(container, player, direction, range, projectileEmoji, options = {}) {
		const fontSize = CONFIG.FONT_SIZE
		
		const factor = options.factor || fontSize; // タイル1単位あたりのピクセル数
		const duration = options.duration || 0.3; // アニメーション時間（秒）
		
		// container の中央をプレイヤーの表示位置とする
		const rect = container.getBoundingClientRect()
		const startX = rect.left + window.scrollX + rect.width / 2 - (fontSize / 2) /*font-size*/ - 3
		const startY = rect.top + window.scrollY + rect.height / 2 - fontSize /*font-size*/ + 3
		
		// 移動先を算出：入力方向 * 射程 * factor
		const targetOffsetX = direction.dx * range * factor
		const targetOffsetY = direction.dy * range * factor
		
		// 射撃方向を角度に変換
		const th = Math.atan2(direction.dy, direction.dx) * 180 / Math.PI + 90
		
		// プロジェクトイル要素を作成
		const projectile = document.createElement("div")
		projectile.className = "shooting-projectile"
		projectile.textContent = projectileEmoji || "●"
		projectile.style.fontSize = `${fontSize}px`
		projectile.style.position = "absolute"
		projectile.style.left = `${startX}px`
		projectile.style.top = `${startY}px`
		projectile.style.transition = `transform ${duration}s linear`
		projectile.style.zIndex = "3000"
		projectile.style.transform = "translate(0, 0)" + ` rotate(${th}deg)`
		document.body.appendChild(projectile)
		
		// 少し待ってから移動開始（再描画のためのタイムアウト）
		setTimeout(() => {
			projectile.style.transform = `translate(${targetOffsetX}px, ${targetOffsetY}px) rotate(${th}deg)`
		}, 10)
		
		// アニメーション終了後に要素を削除
		setTimeout(() => {
			projectile.remove()
		}, duration * 1000 + 20)
	}
		
	/**
	 * 敵の位置からプレイヤーに弾が一直線に飛ぶエフェクトを表示する
	 * @param {HTMLElement} container ゲーム画面のコンテナ要素
	 * @param {Player} player プレイヤーオブジェクト（描画上は中央と仮定）
	 * @param {{ex:number, ey:number}} enemy 敵オブジェクト
	 * @param {number} range 射程（タイル数）
	 * @param {string} projectileEmoji 弾の絵文字（例："●"）
	 * @param {Object} options オプション（factor: タイル1単位あたりのピクセル数、duration: アニメーション時間）
	 */
	static showEnemyShootingEffect(container, player, enemy, range, projectileEmoji, options = {}) {
		return new Promise(resolve => {
			const fontSize = CONFIG.FONT_SIZE
			const factor = options.factor || fontSize; // タイル1単位あたりのピクセル数
			const duration = options.duration || 0.3; // アニメーション時間（秒）
	
			// container の位置情報
			const rect = container.getBoundingClientRect()
	
			// プレイヤーの中心座標（画面中央）
			const playerX = rect.left + window.scrollX + rect.width / 2 - (fontSize / 2) - 3
			const playerY = rect.top + window.scrollY + rect.height / 2 - fontSize + 3
	
			// 敵の座標を画面座標に変換
			const startX = rect.left + window.scrollX + rect.width / 2 + ((enemy.x - player.x) * factor) - (fontSize / 2)
			const startY = rect.top + window.scrollY + rect.height / 2 + ((enemy.y - player.y) * factor) - fontSize
	
			// 飛ばす距離（プレイヤーまで）
			const targetOffsetX = playerX - startX
			const targetOffsetY = playerY - startY
	
			// 飛ぶ角度（上を0°とする）
			const th = Math.atan2(targetOffsetY, targetOffsetX) * 180 / Math.PI + 90
	
			// プロジェクタイル要素を作成
			const projectile = document.createElement("div")
			projectile.className = "shooting-projectile"
			projectile.textContent = projectileEmoji || "●"
			projectile.style.fontSize = `${fontSize}px`
			projectile.style.position = "absolute"
			projectile.style.left = `${startX}px`
			projectile.style.top = `${startY}px`
			projectile.style.transition = `transform ${duration}s ease-in`
			projectile.style.zIndex = "3000"
			projectile.style.transform = "translate(0, 0)" + ` rotate(${th}deg)`
			document.body.appendChild(projectile)
	
			// 少し待ってから移動開始（再描画のためのタイムアウト）
			setTimeout(() => {
				projectile.style.transform = `translate(${targetOffsetX}px, ${targetOffsetY}px) rotate(${th}deg)`
			}, 10)
	
			// アニメーション終了後に要素を削除
			setTimeout(() => {
				projectile.remove()
				resolve()
			}, duration * 1000 + 20)
		})
	}

	/**
	 * 寝ている敵のエフェクト
	 * 
	 * @param {HTMLElement} container 
	 * @param {Enemy} enemy 
	 */
	static showEnemySleepEffect(game, enemy) {
		let {x, y} = game.player
		if (!(Math.abs(enemy.x - x) <= 7 && Math.abs(enemy.y - y) <= 7 && enemy.isSleep)) {
			enemy.sleepEffect?.remove()
			delete(enemy.sleepEffect)
			return
		}

		if (!game.map.visible[enemy.y][enemy.x]) {
			enemy.sleepEffect?.remove()
			delete(enemy.sleepEffect)
			return
		}

		////console.log(enemy?.sleepEffect)
		// エフェクトまだついていないなら
		if (!enemy?.sleepEffect) {
			// 絵文字要素を作成
			enemy.sleepEffect = document.createElement('div')
			enemy.sleepEffect.classList.add('sleep-effect')
			enemy.sleepEffect.textContent = '💤'

			// コンテナに追加
			document.getElementById("game").appendChild(enemy.sleepEffect)
		}

		// 表示位置を計算
		const rect = game.gameContainer.getBoundingClientRect()
		const fontSize = CONFIG.FONT_SIZE + 5
		const centerX = rect.left + window.scrollX + rect.width / 2 - (fontSize / 2) /*font-size*/
		const centerY = rect.top + window.scrollY + rect.height / 2 - fontSize /*font-size*/
		const dx = centerX + (enemy.x - game.player.x) * fontSize /* 敵の位置 */
		const dy = centerY + (enemy.y - game.player.y) * fontSize /* 敵の位置 */

		enemy.sleepEffect.style.left = `${dx}px`
		enemy.sleepEffect.style.top = `${dy}px`
	}

	/**
	 * フロアオーバーレイを表示する
	 * @param {HTMLElement} container ゲーム画面のコンテナ要素
	 * @param {number} floor 現在のフロア
	 */
	static showFloorOverlay(container, floor) {
		// overlay要素を作成
		const overlay = document.createElement("div")
		overlay.className = "floor-overlay"
		overlay.textContent = `${floor} F`
		
		// ゲーム画面の左上付近に配置（コンテナの位置を取得）
		const rect = container.getBoundingClientRect()
		overlay.style.position = "absolute"
		// container内の左上に10pxオフセット
		overlay.style.left = `${rect.left + CONFIG.FONT_SIZE}px`
		overlay.style.top = `${rect.top + CONFIG.FONT_SIZE}px`
		
		// フォント設定：大きめサイズ、白抜き（黒縁）にする
		overlay.style.fontSize = `${CONFIG.FONT_SIZE * 2}px`
		overlay.style.fontWeight = "bold"
		overlay.style.color = "white"
		overlay.style.webkitTextStroke = "2px black"
		
		// 色々つける
		overlay.style.border = "5px solid white"
		overlay.style.borderRadius = "20px"
		overlay.style.backgroundColor = window.getComputedStyle(container.children[0]).backgroundColor
		overlay.style.padding = "5px 30px"
		
		// アニメーション用スタイル
		overlay.style.opacity = "0"
		overlay.style.transform = "translateY(-20px) scale(0.8)"
		overlay.style.transition = "opacity 0.5s ease-out, transform 0.5s ease-out"
		overlay.style.zIndex = "2000"
		
		// bodyに追加（gameContainerの再描画に左右されないよう）
		document.body.appendChild(overlay)
		
		// 少し待ってからフェードイン＆元の位置に移動する
		setTimeout(() => {
			overlay.style.opacity = "1"
			overlay.style.transform = "translateY(0) scale(1)"
		}, 10)
		
		// 表示を1.5秒程度保持後にフェードアウト
		setTimeout(() => {
			overlay.style.opacity = "0"
			overlay.style.transform = "translateY(-20px) scale(0.8)"
		}, 3000)
		
		// アニメーション終了後、要素を削除
		setTimeout(() => {
			overlay.remove()
		}, 3500)
	}
	/**
	 * 階段降り確認用オーバーレイをキーボード操作で表示する
	 * オーバーレイ中はグローバルフラグでゲーム操作を停止する（インベントリ表示時と同様）
	 * @param {Function} onConfirm - 「降りる」を選んだ場合のコールバック
	 * @param {Function} onCancel - 「キャンセル」を選んだ場合のコールバック
	 */
	static showStairConfirmationKeyboard(onConfirm, onCancel) {
		window.overlayActive = true

		// 全画面を覆うオーバーレイ
		const overlay = document.createElement("div")
		overlay.className = "stair-confirm-overlay"

		// ダイアログボックス（中央に配置、縦並びレイアウト）
		const dialog = document.createElement("div")
		dialog.className = "stair-confirm-dialog"

		// メッセージ
		const message = document.createElement("p")
		message.textContent = "この階段を降りる？"
		dialog.appendChild(message)

		// 選択肢用コンテナ
		const optionsContainer = document.createElement("div")
		optionsContainer.className = "stair-options"

		// 降りるオプション
		const confirmOption = document.createElement("div")
		confirmOption.className = "stair-option confirm"
		confirmOption.textContent = "Enter: 降りる"
		confirmOption.addEventListener("click", () => {
			cleanup()
			if (typeof onConfirm === "function") onConfirm()
		})

		// キャンセルオプション
		const cancelOption = document.createElement("div")
		cancelOption.className = "stair-option cancel"
		cancelOption.textContent = "Esc: キャンセル"
		cancelOption.addEventListener("click", () => {
			cleanup()
			if (typeof onCancel === "function") onCancel()
		})

		optionsContainer.appendChild(confirmOption)
		optionsContainer.appendChild(cancelOption)
		dialog.appendChild(optionsContainer)
		overlay.appendChild(dialog)
		document.body.appendChild(overlay)

		function onKeyDown(e) {
			if (e.key === "Enter") {
				e.preventDefault()
				cleanup()
				if (typeof onConfirm === "function") onConfirm()
			} else if (e.key === "Escape") {
				e.preventDefault()
				cleanup()
				if (typeof onCancel === "function") onCancel()
			}
		}

		function cleanup() {
			window.overlayActive = false
			document.removeEventListener("keydown", onKeyDown)
			overlay.remove()
		}

		document.addEventListener("keydown", onKeyDown)
	}
	
	/**
	 * ゲーム終了確認用オーバーレイ（諦める or 続ける or 中断セーブ）
	 * オーバーレイ中はグローバルフラグでゲーム操作を停止する（インベントリ表示時と同様）
	 * 「諦める」を選んだ場合は game.destroy() を呼び出し、「続ける」を選んだ場合はオーバーレイを閉じる
	 */
	static showGiveUpConfirmationKeyboard(game) {
		window.overlayActive = true
	
		// 全画面を覆うオーバーレイ
		const overlay = document.createElement("div")
		overlay.className = "giveup-confirm-overlay"
	
		// ダイアログボックス（中央に配置、縦並びレイアウト）
		const dialog = document.createElement("div")
		dialog.className = "giveup-confirm-dialog"
	
		// メッセージ
		const message = document.createElement("p")
		message.textContent = "ゲームを続けますか？"
		dialog.appendChild(message)
	
		// 選択肢用コンテナ
		const optionsContainer = document.createElement("div")
		optionsContainer.className = "giveup-options"
	
		// 「諦める」オプション（Escキーまたはクリックでゲーム終了）
		const giveUpOption = document.createElement("div")
		giveUpOption.className = "giveup-option giveup"
		giveUpOption.textContent = /*"Esc: */"諦める"
		giveUpOption.addEventListener("click", () => {
			cleanup()
			game.destroy()
		})
	
		// 「続ける」オプション（Enterキーまたはクリックでオーバーレイを閉じる）
		const continueOption = document.createElement("div")
		continueOption.className = "giveup-option continue"
		continueOption.textContent = /*"Enter: */"続ける"
		continueOption.addEventListener("click", () => {
			cleanup()
		})
	
	
		// 「中断」オプション（Enterキーまたはクリックでオーバーレイを閉じる）
		const saveOption = document.createElement("div")
		saveOption.className = "giveup-option save"
		saveOption.textContent = /*"Enter: */"中断"
		saveOption.addEventListener("click", () => {
			cleanup()
			game.save()
		})
	
		optionsContainer.appendChild(giveUpOption)
		optionsContainer.appendChild(continueOption)
		optionsContainer.appendChild(saveOption)
		dialog.appendChild(optionsContainer)
		overlay.appendChild(dialog)
		document.body.appendChild(overlay)
	
		// キーボード操作で選択可能にする
		function onKeyDown(e) {
			if (e.key === "Escape") {
				e.preventDefault()
				cleanup()
				game.destroy()
			} else if (e.key === "Enter") {
				e.preventDefault()
				cleanup()
			}
		}
		
		// オーバーレイ解除処理
		function cleanup() {
			window.overlayActive = false
			//document.removeEventListener("keydown", onKeyDown)
			overlay.remove()
		}
	
		//document.addEventListener("keydown", onKeyDown)
	}
}
// InputManager クラス
class InputManager {
	constructor(game) {
		this.game = game
		this.init()
		
		this.lastInputTime = 0
		this.inputInterval = 170 // ミリ秒単位、例えば100msごとに1回だけ処理
	}
	init() {
		// 定数定義（必要に応じて調整）
		const ARROW_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']

		// シフトキーのトグル状態を管理するためのヘルパー
		function hasShiftToggled(game, newShiftState) {
			// 直前のシフト状態と比較して変化があればtrueを返す
			return newShiftState !== game.prevShiftState
		}

		// 矢印キーの押下数を返す関数
		function getArrowKeyCount(keysDown) {
			return Object.entries(keysDown)
				.filter(([key, pressed]) => ARROW_KEYS.includes(key) && pressed)
				.length
		}
		
		document.addEventListener('keydown', (e) => {
			// 既存のkeysDown更新
			this.game.keysDown[e.key] = true
			const newShiftState = this.game.keysDown['Shift']

			// シフトキーのトグルチェック（初回はundefinedと比較になるので、初期化しておく）
			if (!document.querySelector(".shooting-prompt")) {
				if (hasShiftToggled(this.game, newShiftState)) {
					switchGrid(this.game.gameContainer, newShiftState)
					this.game.prevShiftState = newShiftState; // 最新の状態を保持
				}
			}
			
			let isSingleArrow = ARROW_KEYS.includes(e.key)
			let arrowCount = getArrowKeyCount(this.game.keysDown)
			let isDiagonalMove = newShiftState && arrowCount === 2
			let isRest = this.game.keysDown['.']

			const now = Date.now()
			if (now - this.lastInputTime < this.inputInterval || !this.game.acceptingInput) return

			// 入力処理を実行すべきケース
			if ((isSingleArrow && !newShiftState) || isDiagonalMove || isRest) {
				this.lastInputTime = now
			}
			
			this.game.processInput(e)	// 入力処理呼び出し
		})
		document.addEventListener('keyup', (e) => {
			this.game.keysDown[e.key] = false
			const newShiftState = this.game.keysDown['Shift']
			
			// シフトキーのトグルチェック（初回はundefinedと比較になるので、初期化しておく）
			if (!document.querySelector(".shooting-prompt")) {
				if (hasShiftToggled(this.game, newShiftState)) {
					switchGrid(this.game.gameContainer, newShiftState)
					this.game.prevShiftState = newShiftState; // 最新の状態を保持
				}
			}
		})
	}
}

class MessageManager {
	constructor(game, maxLine = 4) {
		this.game = game
		this.message = document.querySelector(".message")
		this.textBox = document.querySelector(".message textarea")
		this.text = ""
		this.maxLine = maxLine
		this.init()
		this.clear()
		this.timeout = 0
		
		window.onresize = () => this.init()
	}
	init() {
		
		const rect = this.game.gameContainer.getBoundingClientRect()
		this.message.style.height = `calc(${3 * this.maxLine}ex + 1.0ex)`
		const box = window.getComputedStyle(this.message)
		
		let top = rect.top + rect.height / 2								// ゲーム画面の上辺
				+ CONFIG.FONT_SIZE * (CONFIG.VIEW_RADIUS + 1)	// - ゲーム画面の縦幅
				- box.height.replace("px", "") / 2			// - メッセージボックスの高さの半分
		let left = rect.left								// ゲーム画面の左端
				+ rect.width / 2							// + ゲーム画面の幅の半分
				- box.width.replace("px", "") / 2			// - メッセージボックスの幅の半分
		
		this.message.style.top = `${top}px`
		this.message.style.left = `${left}px`
		this.message.style.opacity = 0
	}
	
	show() {
		this.message.style.opacity = 1
	}
	hide() {
		this.message.style.opacity = 0
	}
	
	// メッセージクリア
	clear() {
		this.text = ""
		this.update()
	}
	// メッセージ追加
	add(text) {
		if (this.timeout) {
			clearTimeout(this.timeout)
		}
		if (this.text.split("\n").length >= this.maxLine) {
			const tmp = this.text.split("\n")
			tmp.splice(0, 1)
			this.text = tmp.join("\n")
		}
		this.text = this.text === "" ? text : `${this.text}\n${text}`
		this.update()
		this.show()
		this.timeout = setTimeout(() => {
			this.hide()
			this.timeout = 0
		}, 7500)
	}
	// メッセージ更新
	update() {
		this.textBox.value = this.text
	}
}

// UIManager クラス
class UIManager {
	constructor() {
		this.hpBar = document.getElementById("hp-bar")
		this.hungerBar = document.getElementById("hunger-bar")
	}
	update(player) {
		this.hpBar.style.width = `${(player.hp / player.maxHp) * 100}%`
		this.hpBar.textContent = `${player.hp}/${player.maxHp}`
		this.hungerBar.style.width = `${(player.hunger / player.maxHunger) * 100}%`
		this.hungerBar.textContent = `${player.hunger}/${player.maxHunger}`
		if (player.hp > player.maxHp / 2) this.hpBar.style.backgroundColor = "green"
		else if (player.hp > player.maxHp / 4) this.hpBar.style.backgroundColor = "orange"
		else this.hpBar.style.backgroundColor = "red"
	}
}

class AudioManager {
	constructor() {
		// BGM
		this.files = []
		this.playList = {}

		this.player = document.createElement("audio")
		this.player.volume = 0.5
		this.player.loop = true
	}

	testPlay() {
		const tester = document.createElement("audio")
		tester.play().then(() => {
			tester.pause()
			return
		})
		.catch(() => {
			alert("自動再生を許可してね")
			return
		})
	}

	async loadfile() {
		const promises = Object.entries(this.files).map(file => file[1])
			.filter(file => file.name !== "EOL")
			.map(async file => {
				if (DEBUG) console.log(file)
				this.debugLog(file.name)
				const res = await fetch(file.name)
				const blob = await res.blob()
				const url = URL.createObjectURL(blob)
				this.playList[file.name] = {url, volume: file.volume}
				this.debugLog(url)
			})
	
		await this.testPlay()
		await Promise.all(promises)
		
		// "EOL" を通過点として使ってるならここでログ出すとか
		if (this.files.includes("EOL")) {
			this.debugLog("EOL")
		}
	
		return this.playList
	}

	debugLog(text) {
		if (DEBUG) console.log(text)
	}

	stopBGM() {
		this.player.pause()
	}
}

class BGMManager extends AudioManager {
	constructor() {
		super()
		
		// BGM
		this.files = [
			{name: "./rsrc/mus/difficulty.mp3", volume: 0.5},
			{name: "./rsrc/mus/easy.mp3", volume: 0.5},
			{name: "./rsrc/mus/normal.mp3", volume: 0.5},
			{name: "./rsrc/mus/normalPlus.mp3", volume: 0.5},
			{name: "./rsrc/mus/normalPlus2.mp3", volume: 0.5},
			{name: "./rsrc/mus/hard.mp3", volume: 0.5},
			//{name: "./rsrc/mus/hardPlus.mp3", volume: 0.5},
			{name: "EOL", volume: 0.5},
		]

		this.player.volume = 0.5
		this.player.loop = true
	}

	playBGM(file) {
		// 停止
		this.player.pause()
		
		// 音声ファイル
		this.player.src = this.playList[file].url

		// 再生
		this.player.volume = this.playList[file].volume
		this.player.currentTime = 0
		this.player.play()
	}

	playDifficulty() {
		this.playBGM("./rsrc/mus/difficulty.mp3")
	}

	playEasy() {
		this.playBGM("./rsrc/mus/easy.mp3")
	}

	playNormal() {
		this.playBGM("./rsrc/mus/normal.mp3")
	}

	playNormalPlus() {
		this.playBGM("./rsrc/mus/normalPlus.mp3")
	}

	playNormalPlus2() {
		this.playBGM("./rsrc/mus/normalPlus2.mp3")
	}

	playHard() {
		this.playBGM("./rsrc/mus/hard.mp3")
	}

	playHardPlus() {
		this.playBGM("./rsrc/mus/hardPlus.mp3")
	}
}

class SEManager extends AudioManager {
	constructor() {
		super()
		
		// SE
		this.files = [
			{name: "./rsrc/se/se-pickup.mp3", volume: 0.2},
			{name: "./rsrc/se/se-effect.mp3", volume: 0.2},
			{name: "./rsrc/se/se-damageMe.mp3", volume: 0.2},
			{name: "./rsrc/se/se-damage.mp3", volume: 0.2},
			{name: "./rsrc/se/se-arrow.mp3", volume: 0.4},

			{name: "./rsrc/se/se-eat.mp3", volume: 0.2},
			{name: "./rsrc/se/se-lvup.mp3", volume: 0.2},
			{name: "./rsrc/se/se-stairs.mp3", volume: 0.4},
			{name: "./rsrc/se/se-equip.mp3", volume: 0.5},
			{name: "./rsrc/se/se-disarm.mp3", volume: 0.5},
			{name: "./rsrc/se/se-magic.mp3", volume: 0.3},

			{name: "./rsrc/se/se-menu-1.mp3", volume: 0.2},
			{name: "./rsrc/se/se-menu-2.mp3", volume: 0.2},
			{name: "./rsrc/se/se-menu-3.mp3", volume: 0.2},
			{name: "./rsrc/se/se-menu-4.mp3", volume: 0.2},

			{name: "EOL"},
		]

		this.player.volume = 0.5
		this.player.loop = false

		this.timeout = null
	}

	playSE(file, duration=350) {
		if (!!this.timeout) {
			clearTimeout(this.timeout)
		}

		// 停止
		this.player.pause()
		
		// 音声ファイル
		this.player.src = this.playList[file].url

		// 再生
		this.player.volume = this.playList[file].volume
		this.player.currentTime = 0
		this.player.play()

		// 止める
		this.timeout = setTimeout(() => {
			this.player.pause()
			this.timeout =	null
		}, duration)
	}

	playPickup() {
		this.playSE("./rsrc/se/se-pickup.mp3")
	}

	playEffect() {
		this.playSE("./rsrc/se/se-effect.mp3")
	}

	playDamageMe() {
		this.playSE("./rsrc/se/se-damageMe.mp3")
	}

	playDamage() {
		this.playSE("./rsrc/se/se-damage.mp3")
	}

	playArrow() {
		this.playSE("./rsrc/se/se-arrow.mp3")
	}

	playMenu(n) {
		this.playSE(`./rsrc/se/se-menu-${n}.mp3`)
	}

	playEat(n) {
		this.playSE(`./rsrc/se/se-eat.mp3`)
	}

	playLVUP(n) {
		this.playSE(`./rsrc/se/se-lvup.mp3`)
	}

	playStair(n) {
		this.playSE(`./rsrc/se/se-stairs.mp3`, 800)
	}

	playEquip(n) {
		this.playSE(`./rsrc/se/se-equip.mp3`, 800)
	}

	playDisarm(n) {
		this.playSE(`./rsrc/se/se-disarm.mp3`, 800)
	}

	playMagic(n) {
		this.playSE(`./rsrc/se/se-magic.mp3`, 800)
	}
}