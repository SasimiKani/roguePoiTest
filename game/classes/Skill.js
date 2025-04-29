class Skill {
    static actionPurupuru = (enemy) => ({
        name: "行動",
        range: 1,
        func: (game) => {
            game.message.add("プルプルしている")
        },
        duration: 0
    })

    /**
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
}