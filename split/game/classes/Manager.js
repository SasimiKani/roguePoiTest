// EffectsManager クラス
class EffectsManager {
  static showEffect(container, player, x, y, text, type = "damage") {
    const dx = x - player.x;
    const dy = y - player.y;
    const spans = container.children;
    const index = (8 + dy) * 16 + (7 + dx);
    if (!spans[index]) return;
    const target = spans[index];
    const rect = target.getBoundingClientRect();
    const fx = document.createElement("div");
    fx.className = type;
    fx.textContent = text;
    if (type === "explosion") {
      fx.style.left = `${rect.left + rect.width / 2 + window.scrollX}px`;
      fx.style.top = `${rect.top + window.scrollY - rect.height * 0.6 + 30}px`;
    } else {
      fx.style.left = `${rect.left + rect.width / 2 + window.scrollX + randomInt(-30, 30)}px`;
      fx.style.top = `${rect.top + window.scrollY - rect.height * 0.6}px`;
    }
    document.body.appendChild(fx);
    setTimeout(() => fx.remove(), 1000);
  }
  static showMagicEffect(container, player, centerX, centerY, area, emoji) {
    for (let dy = -area; dy <= area; dy++) {
      for (let dx = -area; dx <= area; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;
        if (!(x === centerX && y === centerY)) {
          const spans = container.children;
          const index = (7 + (y - player.y)) * 16 + (7 + (x - player.x));
          if (!spans[index]) continue;
          const target = spans[index];
          const rect = target.getBoundingClientRect();
          const fx = document.createElement("div");
          fx.className = "magic-particle";
          fx.textContent = emoji;
          fx.style.left = `${rect.left + rect.width / 2 + window.scrollX + randomInt(-8, 8)}px`;
          fx.style.top = `${rect.top + rect.height / 2 + window.scrollY + randomInt(-8, 8)}px`;
          document.body.appendChild(fx);
          setTimeout(() => fx.remove(), 800);
        }
      }
    }
  }
  
  static async showMagicEffectCircle(container, player, centerX, centerY, area, emoji) {
    return new Promise((resolve) => {
      // 生成するパーティクル数（エリアや演出に合わせて調整可能）
      const numParticles = 20;
      // エリア（タイル単位）をピクセル変換する係数。ここでは例として8px/タイルを使用
      const factor = CONFIG.FONT_SIZE;
      
      // container の中央位置を算出（gameContainer ではなく、中央表示が前提の位置）
      const spans = container.children;
      const index = 7 * 16 + 7;
      if (!spans[index]) return;
      const rect = spans[index].getBoundingClientRect();
      
      for (let i = 0; i < numParticles; i++) {
        const angle = Math.random() * 2 * Math.PI; // 0～2πの角度
        const distance = Math.random() * area * factor + CONFIG.FONT_SIZE; // 0～area*factor ピクセルの距離
        const dx = Math.cos((i * 360 / numParticles) * Math.PI / 180) * distance - CONFIG.FONT_SIZE / 2;
        const dy = Math.sin((i * 360 / numParticles) * Math.PI / 180) * distance - CONFIG.FONT_SIZE / 2;
        
        const particle = document.createElement("div");
        particle.className = "magic-particle";
        particle.textContent = emoji;
        
        // 初期状態：中央に表示、スケール1、透明度1
        particle.style.position = "absolute";
        particle.style.left = `${rect.left + rect.width / 2 + window.scrollX + dx}px`;
        particle.style.top = `${rect.top + rect.height / 2 + window.scrollY + dy}px`;
        particle.style.transform = "translate(0, 0) scale(1)";
        particle.style.opacity = "1";
        particle.style.transition = "transform 0.8s ease-out, opacity 0.8s ease-out";
        particle.style.pointerEvents = "none";
        document.body.appendChild(particle);
        
        // 少し待ってから、指定方向へ移動＆縮小・フェードアウト
        setTimeout(() => {
          particle.style.transform = `translate(${dx}px, ${dy}px) scale(0)`;
          particle.style.opacity = "0";
        }, 10);
        
        // アニメーション完了後、パーティクルを削除
        setTimeout(() => {
          particle.remove();
          resolve("OK");
        }, 610);
      }
    });
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
    const rect = container.getBoundingClientRect();
    const fontSize = CONFIG.FONT_SIZE;
    const centerX = rect.left + rect.width / 2 - (fontSize / 2) /*font-size*/ + (dx * fontSize) /*方向*/;
    const centerY = rect.top + rect.height / 2 - (fontSize * 2) /*font-size*/ + (dy * fontSize) /*方向*/;
    
    // オーバーレイ用のエフェクト要素を作成
    const effect = document.createElement("div");
    effect.className = "attack-no-weapon";
    // （必要であればプレイヤーの絵文字等を表示可能）
    effect.textContent = "👊";
    effect.style.position = "absolute";
    effect.style.left = `${centerX}px`;
    effect.style.top = `${centerY}px`;
    effect.style.transition = "transform 0.05s ease-out";
    effect.style.zIndex = "1500";
    effect.style.fontSize = `${fontSize}px`;
    document.body.appendChild(effect);
    
    // 少しだけ入力方向へ移動し、すぐ戻す
    setTimeout(() => {
      effect.style.transform = `translate(${dx * 5}px, ${dy * 5}px)`;
      setTimeout(() => {
        effect.style.transform = "translate(0, 0)";
        setTimeout(() => {
          effect.remove();
        }, 50);
      }, 50);
    }, 10);
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
    const rect = container.getBoundingClientRect();
    const fontSize = CONFIG.FONT_SIZE;
    const centerX = rect.left + rect.width / 2 - (fontSize / 2) /*font-size*/ + (dx * fontSize) /*方向*/;
    const centerY = rect.top + rect.height / 2 - (fontSize * 2) /*font-size*/ + (dy * fontSize) /*方向*/;
    
    // 武器の振るエフェクト要素を作成
    const weaponEffect = document.createElement("div");
    weaponEffect.className = "weapon-swing";
    weaponEffect.textContent = weaponEmoji;
    weaponEffect.style.position = "absolute";
    weaponEffect.style.left = `${centerX}px`;
    weaponEffect.style.top = `${centerY}px`;
    weaponEffect.style.fontSize = "24px";
    weaponEffect.style.pointerEvents = "none";
    weaponEffect.style.opacity = "1";
    weaponEffect.style.transition = "transform 0.3s ease-out, opacity 0.3s ease-out";
    weaponEffect.style.zIndex = "1500";
    weaponEffect.style.fontSize = `${fontSize}px`;
    document.body.appendChild(weaponEffect);
    
    // 0.3秒で入力方向へ20px移動＆回転、フェードアウト
    setTimeout(() => {
      weaponEffect.style.transform = `translate(${dx * 20}px, ${dy * 20}px) rotate(${dx * 30}deg)`;
      weaponEffect.style.opacity = "0";
    }, 10);
    
    setTimeout(() => {
      weaponEffect.remove();
    }, 350);
  }
  
  /**
   * フロアオーバーレイを表示する
   * @param {HTMLElement} container ゲーム画面のコンテナ要素
   * @param {number} floor 現在のフロア
   */
  static showFloorOverlay(container, floor) {
    // overlay要素を作成
    const overlay = document.createElement("div");
    overlay.className = "floor-overlay";
    overlay.textContent = `${floor} F`;
    
    // ゲーム画面の左上付近に配置（コンテナの位置を取得）
    const rect = container.getBoundingClientRect();
    overlay.style.position = "absolute";
    // container内の左上に10pxオフセット
    overlay.style.left = `${rect.left + CONFIG.FONT_SIZE}px`;
    overlay.style.top = `${rect.top + CONFIG.FONT_SIZE}px`;
    
    // フォント設定：大きめサイズ、白抜き（黒縁）にする
    overlay.style.fontSize = `${CONFIG.FONT_SIZE * 2}px`;
    overlay.style.fontWeight = "bold";
    overlay.style.color = "white";
    overlay.style.webkitTextStroke = "2px black";
    
    // 色々つける
    overlay.style.border = "5px solid white";
    overlay.style.borderRadius = "20px";
    overlay.style.backgroundColor = window.getComputedStyle(container.children[0]).backgroundColor;
    overlay.style.padding = "5px 30px";
    
    // アニメーション用スタイル
    overlay.style.opacity = "0";
    overlay.style.transform = "translateY(-20px) scale(0.8)";
    overlay.style.transition = "opacity 0.5s ease-out, transform 0.5s ease-out";
    overlay.style.zIndex = "2000";
    
    // bodyに追加（gameContainerの再描画に左右されないよう）
    document.body.appendChild(overlay);
    
    // 少し待ってからフェードイン＆元の位置に移動する
    setTimeout(() => {
      overlay.style.opacity = "1";
      overlay.style.transform = "translateY(0) scale(1)";
    }, 10);
    
    // 表示を1.5秒程度保持後にフェードアウト
    setTimeout(() => {
      overlay.style.opacity = "0";
      overlay.style.transform = "translateY(-20px) scale(0.8)";
    }, 3000);
    
    // アニメーション終了後、要素を削除
    setTimeout(() => {
      overlay.remove();
    }, 3500);
  }
  /**
   * 階段降り確認用オーバーレイをキーボード操作で表示する
   * オーバーレイ中はグローバルフラグでゲーム操作を停止する（インベントリ表示時と同様）
   * @param {Function} onConfirm - 「降りる」を選んだ場合のコールバック
   * @param {Function} onCancel - 「キャンセル」を選んだ場合のコールバック
   */
  static showStairConfirmationKeyboard(onConfirm, onCancel) {
    window.overlayActive = true;

    // 全画面を覆うオーバーレイ
    const overlay = document.createElement("div");
    overlay.className = "stair-confirm-overlay";

    // ダイアログボックス（中央に配置、縦並びレイアウト）
    const dialog = document.createElement("div");
    dialog.className = "stair-confirm-dialog";

    // メッセージ
    const message = document.createElement("p");
    message.textContent = "この階段を降りる？";
    dialog.appendChild(message);

    // 選択肢用コンテナ
    const optionsContainer = document.createElement("div");
    optionsContainer.className = "stair-options";

    // 降りるオプション
    const confirmOption = document.createElement("div");
    confirmOption.className = "stair-option confirm";
    confirmOption.textContent = "Enter: 降りる";
    confirmOption.addEventListener("click", () => {
      cleanup();
      if (typeof onConfirm === "function") onConfirm();
    });

    // キャンセルオプション
    const cancelOption = document.createElement("div");
    cancelOption.className = "stair-option cancel";
    cancelOption.textContent = "Esc: キャンセル";
    cancelOption.addEventListener("click", () => {
      cleanup();
      if (typeof onCancel === "function") onCancel();
    });

    optionsContainer.appendChild(confirmOption);
    optionsContainer.appendChild(cancelOption);
    dialog.appendChild(optionsContainer);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    function onKeyDown(e) {
      if (e.key === "Enter") {
        e.preventDefault();
        cleanup();
        if (typeof onConfirm === "function") onConfirm();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cleanup();
        if (typeof onCancel === "function") onCancel();
      }
    }

    function cleanup() {
      window.overlayActive = false;
      document.removeEventListener("keydown", onKeyDown);
      overlay.remove();
    }

    document.addEventListener("keydown", onKeyDown);
  }
}
// InputManager クラス
class InputManager {
  constructor(game) {
    this.game = game;
    this.init();
  }
  init() {
    document.addEventListener('keydown', (e) => {
      this.game.keysDown[e.key] = true;
      this.game.processInput(e);
    });
    document.addEventListener('keyup', (e) => {
      this.game.keysDown[e.key] = false;
    });
  }
}
// UIManager クラス
class UIManager {
  constructor() {
    this.hpBar = document.getElementById("hp-bar");
    this.hungerBar = document.getElementById("hunger-bar");
  }
  update(player) {
    this.hpBar.style.width = `${(player.hp / player.maxHp) * 100}%`;
    this.hpBar.textContent = `${player.hp}/${player.maxHp}`;
    this.hungerBar.style.width = `${(player.hunger / player.maxHunger) * 100}%`;
    this.hungerBar.textContent = `${player.hunger}/${player.maxHunger}`;
    if (player.hp > player.maxHp / 2) this.hpBar.style.backgroundColor = "green";
    else if (player.hp > player.maxHp / 4) this.hpBar.style.backgroundColor = "orange";
    else this.hpBar.style.backgroundColor = "red";
  }
}
