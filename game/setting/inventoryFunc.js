/** 通常のインベントリの操作 */

// カーソル移動
function inventoryArrowUp(game, e, totalOptions) {
    if (e.key === 'ArrowUp') {
        if (totalOptions > 0) {
            game.seBox.playMenu(3)
            game.inventorySelection = (game.inventorySelection - 1 + totalOptions) % totalOptions
            game.renderer.render()
        }
    }
    return e.key === 'ArrowUp'
}
function inventoryArrowDown(game, e, totalOptions) {
    if (e.key === 'ArrowDown') {
        if (totalOptions > 0) {
            game.seBox.playMenu(3)
            game.inventorySelection = (game.inventorySelection + 1) % totalOptions
            game.renderer.render()
        }
    }
    return e.key === 'ArrowDown'
}

// 以下、キーの処理
function inventoryY(game, e) {
    if (e.key === 'y') {
        // アイテム整理（ソート）
        game.seBox.playMenu(3)
        let sortItems = game.player.inventory.sort((a, b) => {
            if (a.constructor.name.localeCompare(b.constructor.name) === 0) {
                return a.name.localeCompare(b.name)
            } else {
                return b.constructor.name.localeCompare(a.constructor.name)
            }
        })
        game.player.inventory = sortItems
        game.renderer.render()
    }
    return e.key === 'y'
}

// 足元アイテムの操作
function inventoryGroundP(game, e) {
    if (e.key === 'p') {
        if (game.groundItem.tile === '🔼') return; // 足元が階段なら何もしない
        game.seBox.playPickup()
        game.message.add(`${game.groundItem.name}を拾った`)
        // 足元アイテムを拾う
        pickupItem(game, game.groundItem)
        game.updateData({ tx: game.player.x, ty: game.player.y })
        game.renderer.render()
    }
    return e.key === 'p'
}
function inventoryGroundU(game, e) {
    if (e.key === 'u') {
        // 足元が階段なら降りる
        if (game.groundItem.tile === '🔼') {
            game.inventoryOpen = false
            game.groundItem = null
            game.generateDungeon(true)
            game.renderer.render()
            EffectsManager.showFloorOverlay(game.gameContainer, game.floor)
        }
        // 足元アイテムを使用
        else if (game.groundItem.use) {
            game.inventoryOpen = false
            game.renderer.render()
            // インベントリがマックスで足元の武器・盾を装備できない
            if ((game.groundItem instanceof WeaponItem || game.groundItem instanceof ShieldItem) && game.player.inventory.length >= CONFIG.INVENTORY_MAX) return
            game.groundItem.use(game).then(()	=> {
                // もし足元のアイテムが武器・盾なら、使用後にインベントリへ追加
                if ((game.groundItem instanceof WeaponItem || game.groundItem instanceof ShieldItem)) {
                    if (game.player.inventory.length < CONFIG.INVENTORY_MAX) {
                        game.player.inventory.push(game.groundItem)
                    } else {
                        game.items.push(game.groundItem)
                    }
                }
                // 箱は消費しない
                if (!(game.groundItem instanceof BoxItem) &&
                        // 射撃じゃなければ消費、射撃でも数が0なら消費する
                        (!(game.groundItem instanceof ShootingItem) || game.groundItem.stack === 0)) {
                    game.groundItem = null
                }
                // 箱を見る以外ならターンを進める
                if (!(game.groundItem instanceof BoxItem)) {
                    game.updateData({ tx: game.player.x, ty: game.player.y })
                }
            })
        }
        game.inventoryOpen = false
        game.renderer.render()
    }
    return e.key === 'u'
}

// 通常の所持品の操作
async function inventoryU(game, e) {
    if (e.key === 'u' && !game.boxSelected) {
        let item = game.player.inventory[game.inventorySelection]
        game.inventoryOpen = false
        if (item && item.use) {
            game.renderer.render()
            // アイテムを使う
            await item.use(game)
            // 武器・盾・箱じゃなければ消費する
            if (!((item instanceof WeaponItem || item instanceof ShieldItem)) && !(item instanceof BoxItem) &&
                    // 射撃じゃなければ消費、射撃でも数が0なら消費する
                    (!(item instanceof ShootingItem) || item.stack === 0)) {
                game.player.inventory.splice(game.inventorySelection, 1)
                if (game.inventorySelection >= game.player.inventory.length) {
                    game.inventorySelection = game.player.inventory.length - 1
                }
            }
            // 箱を見る以外ならターンを進める
            if (!(item instanceof BoxItem)) {
                game.updateData({ tx: game.player.x, ty: game.player.y })
            }
        }
        game.renderer.render()
    }
    return e.key === 'u' && !game.boxSelected
}
function inventoryD(game, e) {
    if (e.key === 'd' && !game.boxSelected) {
        if (game.groundItem) return e.key === 'd' && !game.boxSelected

        let item = game.player.inventory[game.inventorySelection]
        if (item) {
            if ((item instanceof WeaponItem || item instanceof ShieldItem) && game.player.weapon === item) {
                game.player.attack -= game.player.weapon.bonus
                game.player.weapon = null
                EffectsManager.showEffect(game.gameContainer, game.player, game.player.x, game.player.y, `装備解除-${item.bonus}`, "heal")
                game.message.add(`${item.name}の装備を外した`)
                // # MESSAGE
            }
            // ここ、アイテムを置く場合は足元に設置する
            if (!game.groundItem) {
                game.groundItem = item
                game.message.add(`${item.name}を足元に置いた`)
                game.updateData({ tx: game.player.x, ty: game.player.y })
            } else {
                item.x = game.player.x
                item.y = game.player.y
                game.items.push(item)
            }
            game.player.inventory.splice(game.inventorySelection, 1)
            if (game.inventorySelection >= game.player.inventory.length) {
                game.inventorySelection = game.player.inventory.length - 1
            }
        }
        game.inventoryOpen = false
        game.renderer.render()
    }
    return e.key === 'd' && !game.boxSelected
}
function inventoryX(game, e) {
    if (e.key === 'x' && !game.boxSelected) {
        // 足元が階段 || インベントリが空なら何もしない
        if (game.groundItem.tile === '🔼' || game.player.inventory.length === 0) return e.key === 'x' && !game.boxSelected

        // 交換処理（所持品内の交換など）
        let invItem = game.player.inventory[game.inventorySelection]
        // ここでは、通常交換処理（例：選択中のアイテムと足元アイテムの交換）はgroundItemが存在している場合のみ行う
        if (game.groundItem) {
            let temp = invItem
            game.player.inventory[game.inventorySelection] = game.groundItem
            game.groundItem = temp
            EffectsManager.showEffect(game.gameContainer, game.player, game.player.x, game.player.y, "交換")
            game.message.add(`${temp.name}と${game.player.inventory[game.inventorySelection].name}を交換した`)
            game.seBox.playPickup()
            // # MESSAGE
            if ((game.groundItem instanceof WeaponItem || game.groundItem instanceof ShieldItem) && game.player.weapon) {
                // インベントリの装備している武器・盾を交換したら外す
                game.groundItem.use(game)
            }
            game.updateData({ tx: game.player.x, ty: game.player.y })
        }
        game.inventoryOpen = false
        game.renderer.render()
    }
    return e.key === 'x' && !game.boxSelected
}
function inventoryI(game, e) {
    if (e.key === 'i') { // 入れる操作
        const selectedItem = game.player.inventory[game.inventorySelection] || game.groundItem
        
        // 仮に、別途箱用の選択状態（this.boxSelected）があれば、その箱に入れる
        if (game.boxSelected && !(selectedItem instanceof BoxItem)) {
            if (game.boxSelected.insertItem(selectedItem)) {
                if ((selectedItem instanceof WeaponItem || selectedItem instanceof ShieldItem)) {
                    // 箱に入れたので、装備を解除
                    if (game.player.weapon === selectedItem) {
                        selectedItem.use(game)
                    }
                }
                if (game.groundItem === selectedItem) {
                    // 足元のアイテムを入れたら足元を削除
                    game.groundItem = null
                } else {
                    // 箱に入れたので、インベントリから削除
                    game.player.inventory.splice(game.inventorySelection, 1)
                }
                
                // インベントリの参照を修正する
                if (game.player.inventory.length <= game.inventorySelection) {
                    game.inventorySelection--
                }
                
                game.boxSelected.updateName()
                game.renderer.render()
            } else {
                EffectsManager.showEffect(game.gameContainer, game.player, game.player.x, game.player.y, "容量オーバー", "damage")
                game.message.add(`これ以上入れられない`)
                // # MESSAGE
            }
        } else if (game.boxSelected === selectedItem) {
            game.boxSelected = null
        } else if (selectedItem instanceof BoxItem) {
            game.boxSelected = selectedItem
        }
        game.renderer.render()
    }
    return e.key === 'i'
}
async function inventoryT(game, e) {
    if (e.key === 't') {
        let item = game.player.inventory[game.inventorySelection]
        if (item) {
            if ((item instanceof WeaponItem || item instanceof ShieldItem) && game.player.weapon === item) {
                game.player.attack -= game.player.weapon.bonus
                game.player.weapon = null
                EffectsManager.showEffect(game.gameContainer, game.player, game.player.x, game.player.y, `装備解除-${item.bonus}`, "heal")
                game.message.add(`${item.name}の装備を外した`)
                // # MESSAGE
            }
            game.inventoryOpen = false
            game.renderer.render()

            let throwItem = new ShootingItem(0, 0, item.name, item.tile, 1, item.bonus * 3 || 2, 7, item.tile, true, item)
            throwItem.name = item.name
            await throwItem.use(game)
            
            game.player.inventory.splice(game.inventorySelection, 1)
            if (game.inventorySelection >= game.player.inventory.length) {
                game.inventorySelection = game.player.inventory.length - 1
            }
            game.updateData({ tx: game.player.x, ty: game.player.y })
        }
        game.renderer.render()
    }
    return e.key === 't'
}
function inventoryEscape(game, e) {
    if (e.key === 'Escape' || e.key === 'e') {
        game.seBox.playMenu(4)
        game.inventoryOpen = false
        game.boxSelected = null
        game.renderer.render()
    }
    return e.key === 'Escape' || e.key === 'e'
}

/** 箱の操作 */
// ↑/↓でカーソル移動
function inventoryBoxArrowUp(box, e) {
    if (e.key === "ArrowUp") {
        e.preventDefault()
        box.game.seBox.playMenu(3)
        if (box.contents.length > 0) {
            box.selectionIndex = (box.selectionIndex - 1 + box.contents.length) % box.contents.length
            box.renderList()
        }
    }
    return e.key === "ArrowUp"
}
function inventoryBoxArrowDown(box, e) {
    if (e.key === "ArrowDown") {
        e.preventDefault()
        box.game.seBox.playMenu(3)
        if (box.contents.length > 0) {
            box.selectionIndex = (box.selectionIndex + 1) % box.contents.length
            box.renderList()
        }
    }
    return e.key === "ArrowDown"
}
// 出す：箱内の選択アイテムを取り出してインベントリへ
function inventoryBoxD(box, e) {
    if (e.key.toLowerCase() === "d") {
        e.preventDefault()
        const inventory = box.game.player.inventory
        const maxInventory = CONFIG.INVENTORY_MAX
        // インベントリがいっぱいなら出せない
        if (inventory.length === maxInventory) {
            box.game.message.add("これ以上出せない")
        } else if (box.contents.length > 0) {
            const item = box.removeItem(box.selectionIndex)
            box.game.player.inventory.push(item)
            if (box.selectionIndex >= box.contents.length) {
                box.selectionIndex = Math.max(0, box.contents.length - 1)
            }
            box.renderList()
        }
    }
    return e.key.toLowerCase() === "d"
}
// 使う：箱内の選択アイテムを使用
function inventoryBoxU(box, e) {
    if (e.key.toLowerCase() === 'u') {
        e.preventDefault()
        if (box.contents.length > 0) {
            const item = box.contents[box.selectionIndex]
            box.cleanup(box.game)
            box.renderList()
            // 武器・盾類は使えない
            if (!((item instanceof WeaponItem || item instanceof ShieldItem)) && !(item instanceof ShootingItem)) {
                if (item.use) item.use(box.game).then(() => {
                    // 使用後、アイテムが消費されるなら削除する
                    box.contents.splice(box.selectionIndex, 1)
                    if (box.selectionIndex >= box.contents.length) {
                        box.selectionIndex = Math.max(0, box.contents.length - 1)
                    }
                    // 名前の隣の数字を更新
                    box.updateName()
                    // 使ったら箱を閉じてターンを進める
                    box.game.updateData({ tx: box.game.player.x, ty: box.game.player.y })
                    box.game.renderer.render()
                })
            } else {
                box.game.message.add(`${item.name}は箱の中で使えない`)
            }
        }
    }
    return e.key.toLowerCase() === 'u'
}
// 置く：箱内の選択アイテムを取り出して地面に設置
function inventoryBoxX(box, e) {
    if (e.key.toLowerCase() === "x") {
        e.preventDefault()
        if (box.contents.length > 0 && !box.game.groundItem) {
            box.game.groundItem = box.contents[box.selectionIndex]
            const item = box.removeItem(box.selectionIndex)
            item.x = box.game.player.x
            item.y = box.game.player.y
            if (box.selectionIndex >= box.contents.length) {
                box.selectionIndex = Math.max(0, box.contents.length - 1)
            }
            // 置いたら箱を閉じてターンを進める
            box.cleanup(box.game)
            box.renderList()
            box.game.message.add(`${item.name}を足元に置いた`)
            box.game.updateData({ tx: box.game.player.x, ty: box.game.player.y })
        }
    }
    return e.key.toLowerCase() === "x"
}
// 名前をつける
function inventoryBoxR(box, e) {
    if (e.key === "r") {
        box.rename()
        box.game.renderer.render()
    }
    return e.key.toLowerCase() === "r"
}
// Esc でオーバーレイを閉じる
function inventoryBoxEscape(box, e) {
    if (e.key === "Escape") {
        e.preventDefault()
        box.cleanup(box.game)
		box.updateName()
    }
    return e.key === "Escape"
}
