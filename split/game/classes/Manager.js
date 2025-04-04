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
          const index = (8 + (y - player.y)) * 16 + (7 + (x - player.x));
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
