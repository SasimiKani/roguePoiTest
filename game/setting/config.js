/** 難易度設定 */
const difficultySettings = {
	easy:	 { name: "森レベル", wallEmoji: "🌳", wallSubEmoji: "🌲", maxFloor: 10, revealLv: 5 },
	normal: { name: "山レベル", wallEmoji: "⛰️", wallSubEmoji: "🌳", maxFloor: 20, revealLv: 3 },
	normalPlus:	 { name: "雪原レベル", wallEmoji: "⬜️", wallSubEmoji: "❄️", maxFloor: 40, revealLv: 7 },
	hard:	 { name: "火山レベル", wallEmoji: "🌋", wallSubEmoji: "🪨", maxFloor: 99, revealLv: 2 },
	hardPlus:	 { name: "海底レベル", wallEmoji: "🪸", wallSubEmoji: "🐚", maxFloor: 500, revealLv: 4 }
}

/** 共通値設定 */
const CONFIG = {
	WIDTH: 40,
	HEIGHT: 32,
	INITIAL_HP: 8,
	REST_CYCLE: 5,
	GENERATE_ENEMY_CYCLE: 30,
	HUNGER_CYCLE: 10,
	MIN_ENEMY_MULTIPLIER: 1.1,
	MAX_ENEMY_MULTIPLIER: 1.2,
	INVENTORY_MAX: 10,
	VIEW_RADIUS: 7,
	DIFFICULTY: "easy",
	REVEALLV: 3,
	FONT_SIZE: window.getComputedStyle(document.querySelector("#game")).fontSize.replace("px", "") - (-2)
}

const MAP_TILE = {
	WALL: difficultySettings.easy.wallEmoji,
	SUB_WALL: difficultySettings.easy.wallSubEmoji,
	STEPS: '🔼'
}

/** エンティティの設定 */
const EntitySettingValues = {
    easy: {
        enemy: {min: 2, max: 4},
        entity: {min: 1, max: 2},
        maxItems: {min: 3, max: 5},
        itemWeights: {
            food: 40,
            sushi: 40,
            magic: 20,
            niku: 20,
            weapon: 20,
            shield: 20,
            shooting: 20,
            box: 10
        }
    },
    normal: {
        enemy: {min: 2, max: 4},
        entity: {min: 1, max: 2},
        maxItems: {min: 3, max: 4},
        itemWeights: {
            food: 40,
            sushi: 40,
            magic: 20,
            niku: 20,
            weapon: 20,
            shield: 20,
            shooting: 15,
            box: 8
        }
    },
    normalPlus: {
        enemy:    {min: 2, max: 4},
        entity:   {min: 1, max: 2},
        // ↓ 出現アイテム数を 1～3 に絞る
        maxItems: {min: 2, max: 4},
        itemWeights: {
            food:     35,
            sushi:    20,
            magic:    10,
            niku:     10,
            weapon:   10,
            shield:   10,
            shooting: 10,
            box:      7 
        }
    },
    hard: {
        enemy: {min: 2, max: 4},
        entity: {min: 1, max: 2},
        maxItems: {min: 2, max: 4},
        itemWeights: {
            food:     27,
            sushi:    20,
            magic:    10,
            niku:     10,
            weapon:   7,
            shield:   7,
            shooting: 10,
            box:      5
        }
    },
    hardPlus: {
        enemy: {min: 2, max: 4},
        entity: {min: 1, max: 2},
        maxItems: {min: 2, max: 4},
        itemWeights: {
            food:     20,
            sushi:    20,
            magic:    10,
            niku:     10,
            weapon:   7,
            shield:   7,
            shooting: 7,
            box:      3
        }
    }
}

/** 魔法の設定 */
const weightedMagics = [
//// 攻撃魔法
    ...Array(30).fill(MagicFireball),
    ...Array(20).fill(MagicTornament),
    ...Array(10).fill(MagicBigWave),
    ...Array(5).fill(MagicLightning),
    ...Array(1).fill(MagicExplosion),
    ...Array(1).fill(MagicMeteor),
//// 回復魔法
    ...Array(10).fill(MagicRecoverAll),
    //// 補助魔法
    ...Array(10).fill(MagicWarp),
]

/** 敵の設定 */
class EnemyDefinition {
    constructor(EnemyClass, floorRange, freq) {
        this.enemy = EnemyClass
        this.floorRange = floorRange
        this.freq = freq
    }
}

const easyEnemyDefinitions = [
    new EnemyDefinition(EnemyLarvae,   [1, 5], 5),
    new EnemyDefinition(EnemyAnt,      [3, 7], 4),
    new EnemyDefinition(EnemyCrayfish, [4, 10], 3),
    new EnemyDefinition(EnemySlime,    [6, 10], 1)
]
const normalEnemyDefinitions = [
    new EnemyDefinition(EnemyLarvae,   [1, 4], 5),
    new EnemyDefinition(EnemyAnt,      [2, 5], 4),
    new EnemyDefinition(EnemyCrayfish, [4, 8], 4),
    new EnemyDefinition(EnemySlime,    [8, 10], 3),
    new EnemyDefinition(EnemyBat,      [12, 18], 2),
    new EnemyDefinition(EnemyGoblin,   [16, 20], 1),
    new EnemyDefinition(EnemySkeleton, [19, 20], 1)
]
const normalPlusEnemyDefinitions = [
    new EnemyDefinition(EnemyLarvae,   [ 1, 10], 20),
    new EnemyDefinition(EnemyAnt,      [ 5, 18], 15),
    new EnemyDefinition(EnemyCrayfish, [10, 25], 10),
    new EnemyDefinition(EnemySlime,    [15, 30],  8),
    new EnemyDefinition(EnemyBat,      [20, 40],  6),
    new EnemyDefinition(EnemyGoblin,   [25, 40],  4),
    new EnemyDefinition(EnemySkeleton, [28, 40],  3),
    new EnemyDefinition(EnemySpider,   [30, 40],  2),
    new EnemyDefinition(EnemyWizard,   [30, 40],  2),
    new EnemyDefinition(EnemyDragon,   [40, 40],  1)
]
const hardEnemyDefinitions = [
    new EnemyDefinition(EnemyLarvae,   [1, 20], 20),
    new EnemyDefinition(EnemyAnt,      [2, 20], 30),
    new EnemyDefinition(EnemyCrayfish, [4, 40], 15),
    new EnemyDefinition(EnemySlime,    [8, 50], 15),
    new EnemyDefinition(EnemyBat,      [12, null], 10),
    new EnemyDefinition(EnemyGoblin,   [16, null], 7),
    new EnemyDefinition(EnemySkeleton, [19, null], 7),
    new EnemyDefinition(EnemySpider,   [24, null], 5),
    new EnemyDefinition(EnemyWizard,   [30, null], 5),
    new EnemyDefinition(EnemyDragon,   [50, null], 1)
]
const hardPlusEnemyDefinitions = [
    new EnemyDefinition(EnemyFish,        [1, 20], 20),
    new EnemyDefinition(EnemyTropicalfish,[2, 30], 20),
    new EnemyDefinition(EnemyCrayfish,    [4, 40], 30),
    new EnemyDefinition(EnemyCrab,        [5, null], 1),
    new EnemyDefinition(EnemyHarisenbon,  [15, null], 20),
    new EnemyDefinition(EnemyShark,       [30, null], 10),
    new EnemyDefinition(EnemySlime,       [8, 50], 10),
    new EnemyDefinition(EnemyBat,         [12, null], 5),
    new EnemyDefinition(EnemyGoblin,      [16, null], 7),
    new EnemyDefinition(EnemySkeleton,    [19, null], 7),
    new EnemyDefinition(EnemySpider,      [24, null], 5),
    new EnemyDefinition(EnemyWizard,      [30, null], 5),
    new EnemyDefinition(EnemyDragon,      [50, null], 1)
]
const defaultEnemyDefinitions = [ new EnemyDefinition(EnemyLarvae, [1, null]) ]