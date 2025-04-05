// BaseEntity クラス
class BaseEntity {
  constructor(x, y, tile) {
    this.x = x;
    this.y = y;
    this.tile = tile;
  }
}
// Player クラス
class Player extends BaseEntity {
  constructor(x, y, initialHP, tile = '😊') {
    super(x, y, tile);
    this.hp = initialHP;
    this.maxHp = initialHP;
    this.attack = 2;
    this.healAmount = 3;
    this.level = 1;
    this.exp = 0;
    this.hunger = 100;
    this.maxHunger = 100;
    this.inventory = [];
    this.weapon = null;
  }
}
// Enemy.js
// Base Enemy クラス
class Enemy extends BaseEntity {
  static floorRange = [1, 3];
  constructor(x, y, hp, exp, atk = 1, tile = '👾') {
    super(x, y, tile);
    this.hp = hp;
    this.atk = atk;
    this.exp = exp;
    this.action = 1;
    this.maxAction = 1;
  }
  takeDamage(damage) {
    this.hp -= damage;
  }
}

// 敵クラス群

class EnemyLarvae extends Enemy {
  static floorRange = [1, 5];
  constructor(x, y, hp) {
    super(x, y, hp, 5, 1, '🐛');
  }
}

class EnemyAnt extends Enemy {
  static floorRange = [2, 7];
  constructor(x, y, hp) {
    super(x, y, hp + 2, 6, 2, '🐜');
  }
}

class EnemyCrayfish extends Enemy {
  static floorRange = [3, 9];
  constructor(x, y, hp) {
    super(x, y, hp + 3, 8, 3, '🦞');
  }
}

class EnemySlime extends Enemy {
  static floorRange = [5, 8];
  constructor(x, y, hp) {
    super(x, y, hp + 5, 7, 1, '🟩');
    this.regenerationRate = 1;
  }
  takeDamage(damage) {
    super.takeDamage(damage);
    if (this.hp > 0) { this.hp += this.regenerationRate; }
  }
}

class EnemyBat extends Enemy {
  static floorRange = [7, 12];
  constructor(x, y, hp) {
    super(x, y, hp, 10, 2, '🦇');
    this.evasion = 0.3;
  }
}

class EnemyGoblin extends Enemy {
  static floorRange = [8, 13];
  constructor(x, y, hp) {
    super(x, y, hp + 8, 16, 4, '👹');
    this.stealChance = 0.2;
  }
}

class EnemySkeleton extends Enemy {
  static floorRange = [10, null];
  constructor(x, y, hp) {
    super(x, y, hp + 10, 19, 4, '💀');
    this.resurrectionTimer = 0;
  }
}

class EnemySpider extends Enemy {
  static floorRange = [10, null];
  constructor(x, y, hp) {
    super(x, y, hp + 8, 18, 3, '🕷️');
    this.poisonDamage = 1;
  }
}

class EnemyWizard extends Enemy {
  static floorRange = [10, null];
  constructor(x, y, hp) {
    super(x, y, hp + 12, 25, 5, '🧙');
    this.magicDamage = 2;
  }
}
// InventoryItem クラス
class InventoryItem extends BaseEntity {
  constructor(x, y, name, tile, useFunction) {
    super(x, y, tile);
    this.name = name;
    this.use = useFunction;
  }
}
// MagicSpell クラス
class MagicSpell extends InventoryItem {
  constructor(x, y, name, tile, emoji, options) {
    super(x, y, name, tile, (game) => {
      let affected = false;
      //EffectsManager.showMagicEffect(game.gameContainer, game.player, game.player.x, game.player.y, this.area, this.emoji || "✨");
      EffectsManager.showMagicEffectCircle(game.gameContainer, game.player, game.player.x, game.player.y, this.area, this.emoji || "✨");
      for (let i = game.enemies.length - 1; i >= 0; i--) {
        let enemy = game.enemies[i];
        if (Math.abs(enemy.x - game.player.x) <= this.area &&
            Math.abs(enemy.y - game.player.y) <= this.area) {
          enemy.hp -= this.damage;
          EffectsManager.showEffect(game.gameContainer, game.player, enemy.x, enemy.y, `-${this.damage}`, "damage");
          affected = true;
          if (enemy.hp <= 0) {
            EffectsManager.showEffect(game.gameContainer, game.player, enemy.x, enemy.y, "💥", "explosion");
            game.enemies.splice(i, 1);
            game.score += 50;
            game.gainExp(5);
          }
        }
      }
      if (this.fallbackHeal && !affected) {
        game.player.hp += this.fallbackHeal;
        if (game.player.hp > game.player.maxHp) game.player.hp = game.player.maxHp;
        EffectsManager.showEffect(game.gameContainer, game.player, game.player.x, game.player.y, `+${this.fallbackHeal}`, "heal");
      }
    });
    this.emoji = emoji;
    this.damage = options.damage;
    this.area = options.area;
    this.fallbackHeal = options.fallbackHeal;
  }
}
// WeaponItem クラス
class WeaponItem extends InventoryItem {
  constructor(x, y, name, tile, bonus) {
    super(x, y, name, tile, (game) => {
      if (game.player.weapon === this) {
        this.unEquip(game);
      } else if (game.player.weapon) {
        this.unEquip(game, game.player.weapon);
        game.queueTimeout(() => {
          this.equip(game);
        }, 400);
      } else {
        this.equip(game);
      }
    });
    this.bonus = bonus;
  }
  
  equip(game, weapon = this) {
    game.player.weapon = weapon;
    game.player.attack += weapon.bonus;
    EffectsManager.showEffect(game.gameContainer, game.player, game.player.x, game.player.y, `武器装備+${weapon.bonus}`, "heal");
  }
  
  unEquip(game, weapon = this) {
    game.player.attack -= game.player.weapon.bonus;
    game.player.weapon = null;
    EffectsManager.showEffect(game.gameContainer, game.player, game.player.x, game.player.y, `装備解除-${weapon.bonus}`, "damage-me");
  }
}
