/** 難易度設定 */
const difficultySettings = {
	easy:	 { name: "森レベル", wallEmoji: "🌳", maxFloor: 10, revealLv: 5 },
	normal: { name: "山レベル", wallEmoji: "⛰️", maxFloor: 20, revealLv: 3 },
	normalPlus:	 { name: "雪原レベル", wallEmoji: "⬜️", maxFloor: 40, revealLv: 7 },
	hard:	 { name: "火山レベル", wallEmoji: "🌋", maxFloor: 99, revealLv: 2 }
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
            shooting: 10,
            box:      7 
        }
    },
    hard: {
        enemy: {min: 2, max: 4},
        entity: {min: 1, max: 2},
        maxItems: {min: 2, max: 4},
        itemWeights: {
            food:     30,
            sushi:    20,
            magic:    10,
            niku:     10,
            weapon:   7,
            shooting: 10,
            box:      5
        }
    }
}

/** 魔法の設定 */
const weightedMagics = [
//// 攻撃魔法
    ...Array(30).fill({name: "火の玉", tile: '🔥', damage: 20, area: 1, fallbackHeal: null}),
    ...Array(20).fill({name: "たつまき", tile: '🌪️', damage: 15, area: 2, fallbackHeal: null}),
    ...Array(10).fill({name: "大波", tile: '🌊', damage: 25, area: 4, fallbackHeal: null}),
    ...Array(5).fill({name: "カミナリ", tile: '⚡️', damage: 30, area: 1, fallbackHeal: null}),
    ...Array(1).fill({name: "エクスプロージョン", tile: '💥', damage: 50, area: 3, fallbackHeal: null}),
    ...Array(1).fill({name: "メテオ", tile: '🌠', damage: 30, area: 5, fallbackHeal: null}),
//// 回復魔法
    ...Array(10).fill({name: "リカバーオール", tile: '✨️', damage: null, area: null, fallbackHeal: 100}),
    //// 補助魔法
    ...Array(10).fill({name: "ワープ", tile: '🌀', damage: null, area: null, fallbackHeal: null, effect: async (game) => {
        // 現在部屋を除外してワープ先ルームを選ぶ
        const otherRooms = game.map.rooms.filter(room =>
            !(
                game.player.x >= room.x &&
                game.player.x <	room.x + room.w &&
                game.player.y >= room.y &&
                game.player.y <	room.y + room.h
            )
        );
        if (otherRooms.length === 0) return; // 念のため
    
        const toRoom = otherRooms[randomInt(0, otherRooms.length - 1)];
    
        // 候補セルを収集
        const candidates = [];
        for (let ix = toRoom.x; ix < toRoom.x + toRoom.w; ix++) {
            for (let iy = toRoom.y; iy < toRoom.y + toRoom.h; iy++) {
                // 床タイルかつ敵がいない
                if (
                    game.map.grid[iy][ix] === ' ' &&
                    !game.enemies.some(e => e.x === ix && e.y === iy)
                ) {
                    candidates.push({ x: ix, y: iy });
                }
            }
        }
    
        // 候補が空ならフォールバック
        if (candidates.length === 0) {
            console.warn("ワープ先に使えるセルがありませんでした。ワープキャンセル");
            return;
        }
    
        // ランダムに選んで座標更新
        const { x: toX, y: toY } = candidates[randomInt(0, candidates.length - 1)];
        game.player.x = toX;
        game.player.y = toY;
    
        // ■ 視界更新 ■
        game.map.visible[toY][toX] = true;
        game.map.revealRoom(toX, toY);
        game.map.revealAround(toX, toY);
    
        // ターン進行・再描画
        game.advanceTurn();
        game.renderer.render();
    }}),
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
    new EnemyDefinition(EnemyLarvae, [1, 5], 5),
    new EnemyDefinition(EnemyAnt, [3, 7], 4),
    new EnemyDefinition(EnemyCrayfish, [4, 10], 3),
    new EnemyDefinition(EnemySlime, [6, 10], 1)
]
const normalEnemyDefinitions = [
    new EnemyDefinition(EnemyLarvae, [1, 4], 5),
    new EnemyDefinition(EnemyAnt, [2, 5], 4),
    new EnemyDefinition(EnemyCrayfish, [4, 8], 4),
    new EnemyDefinition(EnemySlime, [8, 10], 3),
    new EnemyDefinition(EnemyBat, [12, 18], 2),
    new EnemyDefinition(EnemyGoblin, [16, 20], 1),
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
    new EnemyDefinition(EnemyLarvae, [1, 20], 20),
    new EnemyDefinition(EnemyAnt, [2, 20], 30),
    new EnemyDefinition(EnemyCrayfish, [4, 40], 15),
    new EnemyDefinition(EnemySlime, [8, 50], 15),
    new EnemyDefinition(EnemyBat, [12, null], 10),
    new EnemyDefinition(EnemyGoblin, [16, null], 7),
    new EnemyDefinition(EnemySkeleton, [19, null], 7),
    new EnemyDefinition(EnemySpider, [24, null], 5),
    new EnemyDefinition(EnemyWizard, [30, null], 5),
    new EnemyDefinition(EnemyDragon, [50, null], 1)
]
const defaultEnemyDefinitions = [ new EnemyDefinition(EnemyLarvae, [1, null]) ]