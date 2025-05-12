
// 敵クラス群

//// easy 森
class EnemyLarvae extends Enemy {
	constructor(x, y) {
		super("イモムシ", x, y, /* LV */ 1, /* EXP */ 5, /* HP */ 2, /* ATK */ 1, /* DEF */ 2, '🐛')
	}
}
class EnemyAnt extends Enemy {
	constructor(x, y) {
		super("アリ", x, y, /* LV */ 1, /* EXP */ 6, /* HP */ 4, /* ATK */ 4, /* DEF */ 4, '🐜')
	}
}
class EnemyRat extends Enemy {
	constructor(x, y) {
		super("ラット", x, y, /* LV */ 1, /* EXP */ 5, /* HP */ 6, /* ATK */ 5, /* DEF */ 6, '🐀')
	}
}
class EnemySlime extends Enemy {
	constructor(x, y) {
		super("スライム", x, y, /* LV */ 1, /* EXP */ 7, /* HP */ 8, /* ATK */ 7, /* DEF */ 8, '🟩')
		this.skills = [
			Skill.actionPurupuru(this)
		]
	}
}

//// normal 山
class EnemyBat extends Enemy {
	constructor(x, y) {
		super("コウモリ", x, y, /* LV */ 1, /* EXP */ 10, /* HP */ 4, /* ATK */ 4, /* DEF */ 4, '🦇')
		this.searchAlgo = (game, startX, startY, targetX, targetY) => SearchAlgorithm.randomRoute(game, startX, startY, targetX, targetY)
	}
}
class EnemyGoblin extends Enemy {
	constructor(x, y) {
		super("ゴブリン", x, y, /* LV */ 1, /* EXP */ 16, /* HP */ 8, /* ATK */ 7, /* DEF */ 8, '👹')
	}
}
class EnemySkeleton extends Enemy {
	constructor(x, y) {
		super("スケルトン", x, y, /* LV */ 1, /* EXP */ 19, /* HP */ 12, /* ATK */ 10, /* DEF */ 12, '💀')
	}
}
class EnemySpider extends Enemy {
	constructor(x, y) {
		super("クモ", x, y, /* LV */ 1, /* EXP */ 18, /* HP */ 16, /* ATK */ 12, /* DEF */ 16, '🕷️')
	}
}
class EnemyZombie extends Enemy {
	constructor(x, y) {
		super("ゾンビ", x, y, /* LV */ 1, /* EXP */ 5, /* HP */ 20, /* ATK */ 13, /* DEF */ 20, '🧟')
	}
}
class EnemyGhost extends Enemy {
	constructor(x, y) {
		super("ゴースト", x, y, /* LV */ 1, /* EXP */ 15, /* HP */ 20, /* ATK */ 15, /* DEF */ 20, '👻')
	}
}

//// normalPlus 雪原
class EnemySnowman extends Enemy {
	constructor(x, y, hp) {
		super("雪だるさん", x, y, /* LV */ 1, /* EXP */ 16, /* HP */ 8, /* ATK */ 13, /* DEF */ 7, '⛄️')
		this.searchAlgo = (game, startX, startY, targetX, targetY) => SearchAlgorithm.noMove(game, startX, startY, targetX, targetY)
		this.skills = [
			Skill.offensiveSnowBall(this)
		]
	}
}
class EnemyVampire extends Enemy {
	constructor(x, y) {
		super("バンパイア", x, y, /* LV */ 1, /* EXP */ 12, /* HP */ 8, /* ATK */ 23, /* DEF */ 17, '🧛')
	}
	takeDamage(damage) {
		super.takeDamage(damage)
		if (this.hp > 0) {
			this.hp += Math.floor(damage * 0.3)
		}
	}
}
class EnemyWizard extends Enemy {
	constructor(x, y) {
		super("ウィザード", x, y, /* LV */ 1, /* EXP */ 25, /* HP */ 12, /* ATK */ 20, /* DEF */ 14, '🧙')
		this.magicAtk = 8
		this.skills = [ Skill.offensiveMagic(this) ]
	}
}

//// hard 火山
class EnemyOgre extends Enemy {
	constructor(x, y) {
		super("オーガ", x, y, /* LV */ 1, /* EXP */ 22, /* HP */ 20, /* ATK */ 26, /* DEF */ 20, '🧌')
	}
}
class EnemyElemental extends Enemy {
	constructor(x, y) {
		super("エレメンタル", x, y, /* LV */ 1, /* EXP */ 30, /* HP */ 15, /* ATK */ 30, /* DEF */ 28, '🔥')
		this.magicResistance = 5
	}
}
class EnemyDragon extends Enemy {
	constructor(x, y) {
		super("ドラゴン", x, y, /* LV */ 1, /* EXP */ 50, /* HP */ 30, /* ATK */ 29, /* DEF */ 26, '🐉')
		this.breathAtk = 7
		this.action = this.maxAction = 2
		this.skills = [ Skill.offensiveBreath(this) ]
	}
}


// /* LV */ 1, /* EXP */ 4, /* HP */ 2, /* ATK */ 1, /* DEF */ 2
// /* LV */ 1, /* EXP */ 13, /* HP */ 6, /* ATK */ 5, /* DEF */ 6
// /* LV */ 1, /* EXP */ 20, /* HP */ 10, /* ATK */ 8, /* DEF */ 10
// /* LV */ 1, /* EXP */ 26, /* HP */ 14, /* ATK */ 10, /* DEF */ 14
// /* LV */ 1, /* EXP */ 36, /* HP */ 20, /* ATK */ 13, /* DEF */ 20
// /* LV */ 1, /* EXP */ 42, /* HP */ 24, /* ATK */ 16, /* DEF */ 24
// /* LV */ 1, /* EXP */ 48, /* HP */ 28, /* ATK */ 18, /* DEF */ 28
// /* LV */ 1, /* EXP */ 55, /* HP */ 32, /* ATK */ 21, /* DEF */ 32
// /* LV */ 1, /* EXP */ 63, /* HP */ 38, /* ATK */ 24, /* DEF */ 38
// /* LV */ 1, /* EXP */ 69, /* HP */ 42, /* ATK */ 26, /* DEF */ 42
// /* LV */ 1, /* EXP */ 75, /* HP */ 46, /* ATK */ 29, /* DEF */ 46
// /* LV */ 1, /* EXP */ 81, /* HP */ 50, /* ATK */ 32, /* DEF */ 50
// /* LV */ 1, /* EXP */ 89, /* HP */ 56, /* ATK */ 35, /* DEF */ 56
// /* LV */ 1, /* EXP */ 95, /* HP */ 60, /* ATK */ 37, /* DEF */ 60
// /* LV */ 1, /* EXP */ 103, /* HP */ 66, /* ATK */ 40, /* DEF */ 66
// /* LV */ 1, /* EXP */ 107, /* HP */ 68, /* ATK */ 43, /* DEF */ 68
// /* LV */ 1, /* EXP */ 115, /* HP */ 74, /* ATK */ 46, /* DEF */ 74
// /* LV */ 1, /* EXP */ 119, /* HP */ 78, /* ATK */ 46, /* DEF */ 78
// /* LV */ 1, /* EXP */ 128, /* HP */ 84, /* ATK */ 51, /* DEF */ 84
// /* LV */ 1, /* EXP */ 130, /* HP */ 86, /* ATK */ 52, /* DEF */ 86
// /* LV */ 1, /* EXP */ 139, /* HP */ 92, /* ATK */ 56, /* DEF */ 92
// /* LV */ 1, /* EXP */ 143, /* HP */ 96, /* ATK */ 57, /* DEF */ 96
// /* LV */ 1, /* EXP */ 151, /* HP */ 102, /* ATK */ 60, /* DEF */ 102
// /* LV */ 1, /* EXP */ 157, /* HP */ 106, /* ATK */ 63, /* DEF */ 106
// /* LV */ 1, /* EXP */ 162, /* HP */ 110, /* ATK */ 65, /* DEF */ 110
// /* LV */ 1, /* EXP */ 170, /* HP */ 116, /* ATK */ 68, /* DEF */ 116
// /* LV */ 1, /* EXP */ 175, /* HP */ 120, /* ATK */ 71, /* DEF */ 120
// /* LV */ 1, /* EXP */ 180, /* HP */ 124, /* ATK */ 73, /* DEF */ 124
// /* LV */ 1, /* EXP */ 186, /* HP */ 128, /* ATK */ 76, /* DEF */ 128
// /* LV */ 1, /* EXP */ 193, /* HP */ 134, /* ATK */ 79, /* DEF */ 134
// /* LV */ 1, /* EXP */ 198, /* HP */ 138, /* ATK */ 81, /* DEF */ 138
// /* LV */ 1, /* EXP */ 204, /* HP */ 142, /* ATK */ 84, /* DEF */ 142
// /* LV */ 1, /* EXP */ 209, /* HP */ 146, /* ATK */ 87, /* DEF */ 146

//// hardPlus 海
class EnemyFish extends Enemy {
	constructor(x, y) {
		super("フィッシュ", x, y, /* LV */ 1, /* EXP */ 4, /* HP */ 2, /* ATK */ 1, /* DEF */ 2, '🐟️')
	}
}
class EnemyTropicalfish extends Enemy {
	constructor(x, y) {
		super("トロピカフィッシュ", x, y, /* LV */ 1, /* EXP */ 13, /* HP */ 6, /* ATK */ 5, /* DEF */ 6, '🐠')
		this.searchAlgo = (game, sx, sy, tx, ty) =>
			SearchAlgorithm.randomRoute(game, sx, sy, tx, ty)
	}
}
class EnemyCrab extends Enemy {
	constructor(x, y) {
		super("カニ", x, y, /* LV */ 1, /* EXP */ 100, /* HP */ 10, /* ATK */ 8, /* DEF */ 30, '🦀')
		this.searchAlgo = (game, startX, startY, targetX, targetY) =>
			SearchAlgorithm.routeFlee(game, startX, startY, targetX, targetY)
		this.action = this.maxAction = 2; // 二回行動
	}
}
class EnemyCrayfish extends Enemy {
	constructor(x, y) {
		super("ザリガニ", x, y, /* LV */ 1, /* EXP */ 26, /* HP */ 14, /* ATK */ 10, /* DEF */ 14, '🦞')
	}
}
class EnemyHarisenbon extends Enemy {
	constructor(x, y) {
		super("ハリセンボン", x, y, /* LV */ 1, /* EXP */ 36, /* HP */ 20, /* ATK */ 13, /* DEF */ 20, '🐡')
	}
}
class EnemyOctopus extends Enemy {
	constructor(x, y) {
		super("タコ", x, y, /* LV */ 1, /* EXP */ 42, /* HP */ 24, /* ATK */ 16, /* DEF */ 24, '🐙')
        this.skills = [
            Skill.debuffInk(this)
        ]
	}
}
class EnemySquid extends Enemy {
	constructor(x, y) {
		super("イカ", x, y, /* LV */ 1, /* EXP */ 48, /* HP */ 28, /* ATK */ 18, /* DEF */ 28, '🦑')
        this.skills = [
            Skill.debuffInk(this)
        ]
	}
}
class EnemyJellyfish extends Enemy {
	constructor(x, y) {
		super("クラゲ", x, y, /* LV */ 1, /* EXP */ 55, /* HP */ 32, /* ATK */ 21, /* DEF */ 32, '🪼')
		this.searchAlgo = (game, sx, sy, tx, ty) =>
			SearchAlgorithm.randomRoute(game, sx, sy, tx, ty)
	}
}
class EnemyWhales extends Enemy {
	constructor(x, y) {
		super("クジラ", x, y, /* LV */ 1, /* EXP */ 63, /* HP */ 38, /* ATK */ 24, /* DEF */ 38, '🐋')
	}
}
class EnemyShark extends Enemy {
	constructor(x, y) {
		super("シャーク", x, y, /* LV */ 1, /* EXP */ 69, /* HP */ 42, /* ATK */ 26, /* DEF */ 42, '🦈')
		this.action = this.maxAction = 2
	}
}
class EnemyWaterDragon extends Enemy {
	constructor(x, y) {
		super("水龍", x, y, /* LV */ 1, /* EXP */ 75, /* HP */ 46, /* ATK */ 29, /* DEF */ 46, '🦕')
		this.breathAtk = 10
		this.action = this.maxAction = 1
		this.skills = [ Skill.offensiveBreath(this) ]
	}
}
class EnemyFishLV2 extends Enemy {
	constructor(x, y) {
		super("強いフィッシュ", x, y, /* LV */ 2, /* EXP */ 81, /* HP */ 50, /* ATK */ 32, /* DEF */ 50, '🐟️')
	}
}
class EnemyTropicalfishLV2 extends Enemy {
	constructor(x, y) {
		super("強いトロピカフィッシュ", x, y, /* LV */ 2, /* EXP */ 89, /* HP */ 56, /* ATK */ 35, /* DEF */ 56, '🐠')
		this.searchAlgo = (game, sx, sy, tx, ty) =>
			SearchAlgorithm.randomRoute(game, sx, sy, tx, ty)
	}
}
class EnemyCrabLV2 extends Enemy {
	constructor(x, y) {
		super("強いカニ", x, y, /* LV */ 2, /* EXP */ 500, /* HP */ 60, /* ATK */ 37, /* DEF */ 120, '🦀')
		this.searchAlgo = (game, startX, startY, targetX, targetY) =>
			SearchAlgorithm.routeFlee(game, startX, startY, targetX, targetY)
		this.action = this.maxAction = 2; // 二回行動
	}
}
class EnemyCrayfishLV2 extends Enemy {
	constructor(x, y) {
		super("強いザリガニ", x, y, /* LV */ 2, /* EXP */ 103, /* HP */ 66, /* ATK */ 40, /* DEF */ 66, '🦞')
	}
}
class EnemyHarisenbonLV2 extends Enemy {
	constructor(x, y) {
		super("強いハリセンボン", x, y, /* LV */ 2, /* EXP */ 107, /* HP */ 68, /* ATK */ 43, /* DEF */ 68, '🐡')
	}
}
class EnemyOctopusLV2 extends Enemy {
	constructor(x, y) {
		super("強いタコ", x, y, /* LV */ 2, /* EXP */ 115, /* HP */ 74, /* ATK */ 46, /* DEF */ 74, '🐙')
        this.skills = [
            Skill.debuffInk(this)
        ]
	}
}
class EnemySquidLV2 extends Enemy {
	constructor(x, y) {
		super("強いイカ", x, y, /* LV */ 2, /* EXP */ 119, /* HP */ 78, /* ATK */ 46, /* DEF */ 78, '🦑')
        this.skills = [
            Skill.debuffInk(this)
        ]
	}
}
class EnemyJellyfishLV2 extends Enemy {
	constructor(x, y) {
		super("強いクラゲ", x, y, /* LV */ 2, /* EXP */ 128, /* HP */ 84, /* ATK */ 51, /* DEF */ 84, '🪼')
		this.searchAlgo = (game, sx, sy, tx, ty) =>
			SearchAlgorithm.randomRoute(game, sx, sy, tx, ty)
	}
}
class EnemyWhalesLV2 extends Enemy {
	constructor(x, y) {
		super("強いクジラ", x, y, /* LV */ 2, /* EXP */ 130, /* HP */ 86, /* ATK */ 52, /* DEF */ 86, '🐋')
	}
}
class EnemySharkLV2 extends Enemy {
	constructor(x, y) {
		super("強いシャーク", x, y, /* LV */ 2, /* EXP */ 139, /* HP */ 92, /* ATK */ 56, /* DEF */ 92, '🦈')
		this.action = this.maxAction = 2
	}
}
class EnemyWaterDragonLV2 extends Enemy {
	constructor(x, y) {
		super("強い水龍", x, y, /* LV */ 2, /* EXP */ 143, /* HP */ 96, /* ATK */ 57, /* DEF */ 96, '🦕')
		this.breathAtk = 25
		this.skills = [ Skill.offensiveBreath(this) ]
	}
}
class EnemyFishLV3 extends Enemy {
	constructor(x, y) {
		super("かなり強いフィッシュ", x, y, /* LV */ 3, /* EXP */ 151, /* HP */ 102, /* ATK */ 60, /* DEF */ 102, '🐟️')
	}
}
class EnemyTropicalfishLV3 extends Enemy {
	constructor(x, y) {
		super("かなり強いトロピカフィッシュ", x, y, /* LV */ 3, /* EXP */ 157, /* HP */ 106, /* ATK */ 63, /* DEF */ 106, '🐠')
		this.searchAlgo = (game, sx, sy, tx, ty) =>
			SearchAlgorithm.randomRoute(game, sx, sy, tx, ty)
	}
}
class EnemyCrabLV3 extends Enemy {
	constructor(x, y) {
		super("かなり強いカニ", x, y, /* LV */ 3, /* EXP */ 3000, /* HP */ 110, /* ATK */ 65, /* DEF */ 300, '🦀')
		this.searchAlgo = (game, startX, startY, targetX, targetY) =>
			SearchAlgorithm.routeFlee(game, startX, startY, targetX, targetY)
		this.action = this.maxAction = 2; // 二回行動
	}
}
class EnemyCrayfishLV3 extends Enemy {
	constructor(x, y) {
		super("かなり強いザリガニ", x, y, /* LV */ 3, /* EXP */ 170, /* HP */ 116, /* ATK */ 68, /* DEF */ 116, '🦞')
	}
}
class EnemyHarisenbonLV3 extends Enemy {
	constructor(x, y) {
		super("かなり強いハリセンボン", x, y, /* LV */ 3, /* EXP */ 175, /* HP */ 120, /* ATK */ 71, /* DEF */ 120, '🐡')
	}
}
class EnemyOctopusLV3 extends Enemy {
	constructor(x, y) {
		super("かなり強いタコ", x, y, /* LV */ 3, /* EXP */ 180, /* HP */ 124, /* ATK */ 73, /* DEF */ 124, '🐙')
        this.skills = [
            Skill.debuffInk(this)
        ]
	}
}
class EnemySquidLV3 extends Enemy {
	constructor(x, y) {
		super("かなり強いイカ", x, y, /* LV */ 3, /* EXP */ 186, /* HP */ 128, /* ATK */ 76, /* DEF */ 128, '🦑')
        this.skills = [
            Skill.debuffInk(this)
        ]
	}
}
class EnemyJellyfishLV3 extends Enemy {
	constructor(x, y) {
		super("かなり強いクラゲ", x, y, /* LV */ 3, /* EXP */ 193, /* HP */ 134, /* ATK */ 79, /* DEF */ 134, '🪼')
		this.searchAlgo = (game, sx, sy, tx, ty) =>
			SearchAlgorithm.randomRoute(game, sx, sy, tx, ty)
	}
}
class EnemyWhalesLV3 extends Enemy {
	constructor(x, y) {
		super("かなり強いクジラ", x, y, /* LV */ 3, /* EXP */ 198, /* HP */ 138, /* ATK */ 81, /* DEF */ 138, '🐋')
	}
}
class EnemySharkLV3 extends Enemy {
	constructor(x, y) {
		super("かなり強いシャーク", x, y, /* LV */ 3, /* EXP */ 204, /* HP */ 142, /* ATK */ 84, /* DEF */ 142, '🦈')
		this.action = this.maxAction = 2
	}
}
class EnemyWaterDragonLV3 extends Enemy {
	constructor(x, y) {
		super("かなり強い水龍", x, y, /* LV */ 3, /* EXP */ 209, /* HP */ 146, /* ATK */ 87, /* DEF */ 146, '🦕')
		this.breathAtk = 25
		this.skills = [ Skill.offensiveBreath(this) ]
	}
}