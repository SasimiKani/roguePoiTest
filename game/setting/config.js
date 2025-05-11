// デバッグモード
const DEBUG = false

/** 難易度設定 */
const difficultySettings = {
	easy:	     { name: "森レベル", wallEmoji: "🌳", wallSubEmoji: "🌲", maxFloor: 10, revealLv: 5, width: 40, height: 32 },
	normal:      { name: "山レベル", wallEmoji: "⛰️", wallSubEmoji: "🌳", maxFloor: 20, revealLv: 3, width: 45, height: 38 },
	normalPlus:	 { name: "雪原レベル", wallEmoji: "⬜️", wallSubEmoji: "❄️", maxFloor: 40, revealLv: 7, width: 50, height: 38 },
	hard:	     { name: "火山レベル", wallEmoji: "🌋", wallSubEmoji: "🪨", maxFloor: 99, revealLv: 2, width: 60, height: 42 },
	hardPlus:	 { name: "海底レベル", wallEmoji: "🪸", wallSubEmoji: "🐚", maxFloor: 255, revealLv: 4, width: 70, height: 50 }
}

/** 共通値設定 */
const CONFIG = {
	WIDTH: 40,
	HEIGHT: 32,
	INITIAL_HP: 8,
	REST_CYCLE: 10,
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
        enemy: {min: 1, max: 3},
        entity: {min: 1, max: 2},
        maxItems: {min: 2, max: 3},
        itemWeights: {
            food: 40,
            sushi: 40,
            magic: 20,
            niku: 20,
            icecream: 0,
            weapon: 20,
            shield: 10,
            shooting: 20,
            box: 0
        }
    },
    normal: {
        enemy: {min: 1, max: 3},
        entity: {min: 1, max: 2},
        maxItems: {min: 2, max: 3},
        itemWeights: {
            food: 40,
            sushi: 40,
            magic: 20,
            niku: 20,
            icecream: 0,
            weapon: 20,
            shield: 10,
            shooting: 15,
            box: 0
        }
    },
    normalPlus: {
        enemy:    {min: 2, max: 4},
        entity:   {min: 1, max: 2},
        // ↓ 出現アイテム数を 1～3 に絞る
        maxItems: {min: 2, max: 3},
        itemWeights: {
            food:     35,
            sushi:    20,
            magic:    10,
            niku:     10,
            icecream: 5,
            weapon:   10,
            shield:   5,
            shooting: 10,
            box:      3
        }
    },
    hard: {
        enemy: {min: 1, max: 3},
        entity: {min: 1, max: 2},
        maxItems: {min: 2, max: 3},
        itemWeights: {
            food:     27,
            sushi:    20,
            magic:    10,
            niku:     10,
            icecream: 0,
            weapon:   7,
            shield:   3,
            shooting: 10,
            box:      3
        }
    },
    hardPlus: {
        enemy: {min: 1, max: 3},
        entity: {min: 1, max: 2},
        maxItems: {min: 2, max: 3},
        itemWeights: {
            food:     20,
            sushi:    20,
            magic:    10,
            niku:     10,
            icecream: 5,
            weapon:   7,
            shield:   3,
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
    new EnemyDefinition(EnemyAnt,      [4, 7], 4),
    new EnemyDefinition(EnemyRat,      [6, 10], 3),
    new EnemyDefinition(EnemySlime,    [8, 10], 2)
]
const normalEnemyDefinitions = [
    new EnemyDefinition(EnemyLarvae,   [1, 4], 5),
    new EnemyDefinition(EnemyAnt,      [2, 5], 4),
    new EnemyDefinition(EnemyBat,      [4, 18], 2),
    new EnemyDefinition(EnemyGoblin,   [8, 20], 1),
    new EnemyDefinition(EnemySkeleton, [12, 20], 1),
    new EnemyDefinition(EnemySpider,   [16, 20], 1),
    new EnemyDefinition(EnemyZombie,   [19, 20], 1),
    new EnemyDefinition(EnemyGhost,    [20, 20], 1),
]
const normalPlusEnemyDefinitions = [
    new EnemyDefinition(EnemyAnt,      [ 1, 10], 15),
    new EnemyDefinition(EnemySlime,    [ 1, 10],  8),
    new EnemyDefinition(EnemyBat,      [ 5, 10],  6),
    new EnemyDefinition(EnemySnowman,  [10, 20], 10),
    new EnemyDefinition(EnemySkeleton, [15, 30],  3),
    new EnemyDefinition(EnemySpider,   [20, 40],  2),
    new EnemyDefinition(EnemyVampire,  [30, 40],  2),
    new EnemyDefinition(EnemyWizard,   [35, 40],  2),
    new EnemyDefinition(EnemyDragon,   [40, 40],  1)
]
const hardEnemyDefinitions = [
    new EnemyDefinition(EnemyLarvae,   [ 1, 20], 20),
    new EnemyDefinition(EnemyAnt,      [ 1, 20], 30),
    new EnemyDefinition(EnemyCrayfish, [10, 40], 15),
    new EnemyDefinition(EnemySlime,    [10, 40], 15),
    new EnemyDefinition(EnemyBat,      [20, null], 10),
    new EnemyDefinition(EnemyGoblin,   [20, null], 7),
    new EnemyDefinition(EnemySkeleton, [30, null], 7),
    new EnemyDefinition(EnemySpider,   [30, null], 5),
    new EnemyDefinition(EnemyWizard,   [40, null], 5),
    new EnemyDefinition(EnemyDragon,   [50, null], 1)
]
const hardPlusEnemyDefinitions = [
    new EnemyDefinition(EnemyFish,            [1, null], 20),
    new EnemyDefinition(EnemyTropicalfish,    [6, null], 20),
    new EnemyDefinition(EnemyCrayfish,        [10, null], 30),
    new EnemyDefinition(EnemyHarisenbon,      [15, null], 20),
    new EnemyDefinition(EnemyCrab,            [19, null],  1),
    new EnemyDefinition(EnemyOctopus,         [24, null], 20),
    new EnemyDefinition(EnemySquid,           [28, null], 20),
    new EnemyDefinition(EnemyJellyfish,       [33, null], 20),
    new EnemyDefinition(EnemyWhales,          [37, null], 10),
    new EnemyDefinition(EnemyShark,           [42, null], 10),
    new EnemyDefinition(EnemyWaterDragon,     [46, null],  1),

    new EnemyDefinition(EnemyFishLV2,            [51, null], 20),
    new EnemyDefinition(EnemyTropicalfishLV2,    [56, null], 20),
    new EnemyDefinition(EnemyCrayfishLV2,        [60, null], 30),
    new EnemyDefinition(EnemyHarisenbonLV2,      [65, null], 20),
    new EnemyDefinition(EnemyCrabLV2,            [69, null],  1),
    new EnemyDefinition(EnemyOctopusLV2,         [74, null], 20),
    new EnemyDefinition(EnemySquidLV2,           [78, null], 20),
    new EnemyDefinition(EnemyJellyfishLV2,       [83, null], 20),
    new EnemyDefinition(EnemyWhalesLV2,          [87, null], 10),
    new EnemyDefinition(EnemySharkLV2,           [92, null], 10),
    new EnemyDefinition(EnemyWaterDragonLV2,     [96, null],  1),

    new EnemyDefinition(EnemyFishLV3,            [101, null], 20),
    new EnemyDefinition(EnemyTropicalfishLV3,    [106, null], 20),
    new EnemyDefinition(EnemyCrayfishLV3,        [110, null], 30),
    new EnemyDefinition(EnemyHarisenbonLV3,      [115, null], 20),
    new EnemyDefinition(EnemyCrabLV3,            [119, null],  1),
    new EnemyDefinition(EnemyOctopusLV3,         [124, null], 20),
    new EnemyDefinition(EnemySquidLV3,           [128, null], 20),
    new EnemyDefinition(EnemyJellyfishLV3,       [133, null], 20),
    new EnemyDefinition(EnemyWhalesLV3,          [137, null], 10),
    new EnemyDefinition(EnemySharkLV3,           [142, null], 10),
    new EnemyDefinition(EnemyWaterDragonLV3,     [146, null],  1),
]
const defaultEnemyDefinitions = [ new EnemyDefinition(EnemyLarvae, [1, null]) ]
