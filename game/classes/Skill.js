class Skill {
    /**
     * スライムがプルプルするだけの技 
     */
    static actionPurupuru = (enemy) => ({
        name: "行動",
        range: 1,
        func: (game) => {
            game.message.add("プルプルしている")
        },
        duration: 0
    })

    /**
     * 魔法を打つ技
     * 必須フィールド；this.magicAtk
     */
    static offensiveMagic = (enemy) => ({
        name: "魔法攻撃",
        range: 1,
        func: async (game) => {
            game.seBox.playMagic()
            await EffectsManager.showMagicEffectCircle(game.gameContainer, game.player, enemy.x, enemy.y, 1, "🔥")

            game.player.hp -= enemy.magicAtk
            if (game.player.hp < 0) game.player.hp = 0

            EffectsManager.showEffect(game.gameContainer, game.player, game.player.x, game.player.y, `-${enemy.magicAtk}`, "damage-me")
            game.message.add(`${enemy.magicAtk}ダメージ`)
            game.seBox.playDamageMe()
        },
        duration: 500
    })

    /**
     * 雪玉
     */
    static offensiveSnowBall = (enemy) => ({
        name: "雪玉",
        range: 3,
        func: async (game) => {
            const container = game.gameContainer
            const player = game.player
            const range = 3
            const projectileEmoji = "⚪️"
            EffectsManager.showEnemyShootingEffect(container, player, enemy, range, projectileEmoji).then(() => {
                game.player.hp -= enemy.atk
                if (game.player.hp < 0) game.player.hp = 0
    
                EffectsManager.showEffect(game.gameContainer, game.player, game.player.x, game.player.y, `-${enemy.atk}`, "damage-me")
                game.message.add(`${enemy.atk}ダメージ`)
                game.seBox.playDamageMe()
            })
        },
        duration: 600
    })

    /**
     * ドラゴンブレス
     * 必須フィールド；this.breathAtk
     */
    static offensiveBreath = (enemy) => ({
        name: "ドラゴンブレス",
        range: 5,
        func: async (game) => {
            const container = game.gameContainer
            const player = game.player
            const range = 5
            const projectileEmoji = "🔥"
            EffectsManager.showEnemyShootingEffect(container, player, enemy, range, projectileEmoji).then(() => {
                game.player.hp -= enemy.breathAtk
                if (game.player.hp < 0) game.player.hp = 0
    
                EffectsManager.showEffect(game.gameContainer, game.player, game.player.x, game.player.y, `-${enemy.breathAtk}`, "damage-me")
                game.message.add(`${enemy.breathAtk}ダメージ`)
                game.seBox.playDamageMe()
            })
        },
        duration: 600
    })
}