// ヘルパーメソッド群

/**
 * 指定された最小値・最大値の間のランダムな整数を返す
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickupItem(game, pickupItem) {
  const player = game.player;
  const maxInventory = CONFIG.INVENTORY_MAX;
  const isShooting = pickupItem instanceof ShootingItem;
  // 同じ型の射撃アイテムが既にインベントリにあるか
  const inventoryHasSameType = player.inventory.some(
    i => i.constructor.name === pickupItem.constructor.name
  );

  if (isShooting) {
    // 射撃アイテムの場合
    if (inventoryHasSameType) {
      // 既に同じ射撃アイテムがあれば、スタック処理
      for (const i of player.inventory) {
        if (i.constructor.name === pickupItem.constructor.name) {
          i.stack += pickupItem.stack; // 例：stackプロパティで管理
          if (typeof i.updateName === "function") {
            i.updateName(); // 表示名にスタック数を反映
          }
          EffectsManager.showEffect(
            game.gameContainer, player, player.x, player.y, "GET"
          );
          // 足元アイテムがあればクリアして、インベントリオープンを解除
          if (game.groundItem) {
            game.groundItem = null;
            game.inventoryOpen = false;
          }
          return false;
        }
      }
    } else {
      // 同じ射撃アイテムが存在しない場合
      if (player.inventory.length < maxInventory) {
        player.inventory.push(pickupItem);
        EffectsManager.showEffect(
          game.gameContainer, player, player.x, player.y, "GET"
        );
        // 足元アイテムがあればクリアして、インベントリオープンを解除
        console.log(game.groundItem);
        if (game.groundItem) {
          game.groundItem = null;
          game.inventoryOpen = false;
        }
        return false;
      } else {
        return true; // インベントリ満杯なら何もせず終了
      }
    }
  } else {
    // 射撃アイテム以外の場合は、単純に空きがあれば拾う
    if (player.inventory.length < maxInventory) {
      player.inventory.push(pickupItem);
      EffectsManager.showEffect(
        game.gameContainer, player, player.x, player.y, "GET"
      );
      // 足元アイテムがあればクリアして、インベントリオープンを解除
      if (game.groundItem) {
        game.groundItem = null;
        game.inventoryOpen = false;
      }
      return false;
    } else {
      return true;
    }
  }
}

/* プレイヤーがいる部屋を取得する */
function* getPlayerRoom(game) {
  for (let room of game.map.rooms) {
    if (
      game.player.x >= room.x &&
      game.player.x < room.x + room.w &&
      game.player.y >= room.y &&
      game.player.y < room.y + room.h
    ) {
      yield room;
    }
  }
}
/* 座標が部屋に含まれるか取得する */
function isInRoom(x, y, room) {
  if (!room) return false;
  if (room.x <= x && x <= room.x + room.w &&
      room.y <= y && y <= room.y + room.h) {
    return true;
  } else {
    return false;
  }
}

/* グリッド表示を切り替える */
function switchGrid(container, on=true) {
  if (!container) {
    document.querySelector("#game").classList.remove("grid");
    return;
  }
  if (on) {
    container.classList.add("grid");
  } else {
    container.classList.remove("grid");
  }
}