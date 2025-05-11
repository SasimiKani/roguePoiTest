
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

//// hardPlus 海
class EnemyFish extends Enemy {
	constructor(x, y) {
		super("フィッシュ", x, y, /* LV */ 1, /* EXP */ 6, /* HP */ 2, /* ATK */ 4, /* DEF */ 1, '🐟️')
	}
}
class EnemyTropicalfish extends Enemy {
	constructor(x, y) {
		super("トロピカフィッシュ", x, y, /* LV */ 1, /* EXP */ 7, /* HP */ 1, /* ATK */ 3, /* DEF */ 1, '🐠')
		this.searchAlgo = (game, sx, sy, tx, ty) =>
			SearchAlgorithm.randomRoute(game, sx, sy, tx, ty)
	}
}
class EnemyCrab extends Enemy {
	constructor(x, y) {
		super("カニ", x, y, /* LV */ 1, /* EXP */ 100, /* HP */ 10, /* ATK */ 5, /* DEF */ 14, '🦀')
		this.searchAlgo = (game, startX, startY, targetX, targetY) =>
			SearchAlgorithm.routeFlee(game, startX, startY, targetX, targetY)
		this.action = this.maxAction = 2; // 二回行動
	}
}
class EnemyCrayfish extends Enemy {
	constructor(x, y) {
		super("ザリガニ", x, y, /* LV */ 1, /* EXP */ 10, /* HP */ 5, /* ATK */ 7, /* DEF */ 5, '🦞')
	}
}
class EnemyHarisenbon extends Enemy {
	constructor(x, y) {
		super("ハリセンボン", x, y, /* LV */ 1, /* EXP */ 15, /* HP */ 7, /* ATK */ 5, /* DEF */ 7, '🐡')
	}
}
class EnemyOctopus extends Enemy {
	constructor(x, y) {
		super("タコ", x, y, /* LV */ 1, /* EXP */ 20, /* HP */ 16, /* ATK */ 12, /* DEF */ 12, '🐙')
        this.skills = [
            Skill.debuffInk(this)
        ]
	}
}
class EnemySquid extends Enemy {
	constructor(x, y) {
		super("イカ", x, y, /* LV */ 1, /* EXP */ 22, /* HP */ 18, /* ATK */ 12, /* DEF */ 12, '🦑')
        this.skills = [
            Skill.debuffInk(this)
        ]
	}
}
class EnemyJellyfish extends Enemy {
	constructor(x, y) {
		super("クラゲ", x, y, /* LV */ 1, /* EXP */ 25, /* HP */ 20, /* ATK */ 4, /* DEF */ 1, '🪼')
		this.searchAlgo = (game, sx, sy, tx, ty) =>
			SearchAlgorithm.randomRoute(game, sx, sy, tx, ty)
	}
}
class EnemyWhales extends Enemy {
	constructor(x, y) {
		super("クジラ", x, y, /* LV */ 1, /* EXP */ 30, /* HP */ 15, /* ATK */ 30, /* DEF */ 30, '🐋')
	}
}
class EnemyShark extends Enemy {
	constructor(x, y) {
		super("シャーク", x, y, /* LV */ 1, /* EXP */ 35, /* HP */ 20, /* ATK */ 22, /* DEF */ 16, '🦈')
		this.action = this.maxAction = 2
	}
}
class EnemyWaterDragon extends Enemy {
	constructor(x, y) {
		super("水龍", x, y, /* LV */ 1, /* EXP */ 50, /* HP */ 30, /* ATK */ 29, /* DEF */ 26, '🦕')
		this.breathAtk = 10
		this.action = this.maxAction = 1
		this.skills = [ Skill.offensiveBreath(this) ]
	}
}
class EnemyFishLV2 extends Enemy {
	constructor(x, y) {
		super("強いフィッシュ", x, y, /* LV */ 2, /* EXP */ 21, /* HP */ 15, /* ATK */ 14, /* DEF */ 11, '🐟️')
	}
}
class EnemyFishLV3 extends Enemy {
	constructor(x, y) {
		super("かなり強いフィッシュ", x, y, /* LV */ 3, /* EXP */ 36, /* HP */ 30, /* ATK */ 24, /* DEF */ 21, '🐟️')
	}
}
class EnemyTropicalfishLV2 extends Enemy {
	constructor(x, y) {
		super("強いトロピカフィッシュ", x, y, /* LV */ 2, /* EXP */ 22, /* HP */ 16, /* ATK */ 13, /* DEF */ 11, '🐠')
		this.searchAlgo = (game, sx, sy, tx, ty) =>
			SearchAlgorithm.randomRoute(game, sx, sy, tx, ty)
	}
}
class EnemyCrabLV2 extends Enemy {
	constructor(x, y) {
		super("強いカニ", x, y, /* LV */ 2, /* EXP */ 1000, /* HP */ 50, /* ATK */ 25, /* DEF */ 70, '🦀')
		this.searchAlgo = (game, startX, startY, targetX, targetY) =>
			SearchAlgorithm.routeFlee(game, startX, startY, targetX, targetY)
		this.action = this.maxAction = 2; // 二回行動
	}
}
class EnemyCrayfishLV2 extends Enemy {
	constructor(x, y) {
		super("強いザリガニ", x, y, /* LV */ 2, /* EXP */ 27, /* HP */ 25, /* ATK */ 19, /* DEF */ 18, '🦞')
	}
}
class EnemyHarisenbonLV2 extends Enemy {
	constructor(x, y) {
		super("強いハリセンボン", x, y, /* LV */ 2, /* EXP */ 33, /* HP */ 30, /* ATK */ 20, /* DEF */ 20, '🐡')
	}
}
class EnemyOctopusLV2 extends Enemy {
	constructor(x, y) {
		super("強いタコ", x, y, /* LV */ 2, /* EXP */ 35, /* HP */ 31, /* ATK */ 22, /* DEF */ 22, '🐙')
        this.skills = [
            Skill.debuffInk(this)
        ]
	}
}
class EnemySquidLV2 extends Enemy {
	constructor(x, y) {
		super("強いイカ", x, y, /* LV */ 2, /* EXP */ 37, /* HP */ 33, /* ATK */ 22, /* DEF */ 22, '🦑')
        this.skills = [
            Skill.debuffInk(this)
        ]
	}
}
class EnemyJellyfishLV2 extends Enemy {
	constructor(x, y) {
		super("強いクラゲ", x, y, /* LV */ 2, /* EXP */ 40, /* HP */ 35, /* ATK */ 14, /* DEF */ 11, '🪼')
		this.searchAlgo = (game, sx, sy, tx, ty) =>
			SearchAlgorithm.randomRoute(game, sx, sy, tx, ty)
	}
}
class EnemyWhalesLV2 extends Enemy {
	constructor(x, y) {
		super("強いクジラ", x, y, /* LV */ 2, /* EXP */ 45, /* HP */ 30, /* ATK */ 40, /* DEF */ 40, '🐋')
	}
}
class EnemySharkLV2 extends Enemy {
	constructor(x, y) {
		super("強いシャーク", x, y, /* LV */ 2, /* EXP */ 50, /* HP */ 35, /* ATK */ 32, /* DEF */ 26, '🦈')
		this.action = this.maxAction = 2
	}
}
class EnemyWaterDragonLV2 extends Enemy {
	constructor(x, y) {
		super("強い水龍", x, y, /* LV */ 2, /* EXP */ 65, /* HP */ 45, /* ATK */ 39, /* DEF */ 36, '🦕')
		this.breathAtk = 25
		this.skills = [ Skill.offensiveBreath(this) ]
	}
}