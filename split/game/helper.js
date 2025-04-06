// ヘルパーメソッド群

/**
 * 指定された最小値・最大値の間のランダムな整数を返す
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickupItem(game, pickupItem) {
  if (game.player.inventory.length === CONFIG.INVENTORY_MAX) return;
  // 足元アイテムを拾う
  if (game.player.inventory.length < CONFIG.INVENTORY_MAX && !(pickupItem instanceof ShootingItem && game.player.inventory.map(i => i.constructor.name).includes( pickupItem.constructor.name ))) {
    game.player.inventory.push(pickupItem);
    EffectsManager.showEffect(game.gameContainer, game.player, game.player.x, game.player.y, "GET");
    if (game.groundItem) {
      pickupItem = null;
      game.inventoryOpen = false;
    }
  } else if (pickupItem instanceof ShootingItem && game.player.inventory.map(i => i.constructor.name).includes( pickupItem.constructor.name )) {
    /// 射撃装備はスタック可能
    for (const i of game.player.inventory) {
      if (i.constructor.name === pickupItem.constructor.name) {
        i.stack += pickupItem.stack;
        i.updateName();
        break;
      }
    }
    EffectsManager.showEffect(game.gameContainer, game.player, game.player.x, game.player.y, "GET");
  }
  if (game.groundItem) {
    game.groundItem = null;
    game.inventoryOpen = false;
  }
}

/* グリッド表示を切り替える */
function switchGrid(container, on=true) {
  if (on) {
    container.classList.add("grid");
  } else {
    container.classList.remove("grid");
  }
}