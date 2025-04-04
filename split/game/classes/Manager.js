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
