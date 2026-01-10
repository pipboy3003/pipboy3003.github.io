// [2026-01-10 05:30:00] game_actions.js - Smart Inventory Add & Alert

Object.assign(Game, {

    getCampUpgradeCost: function(currentLevel) {
        switch(currentLevel) {
            case 1: return { id: 'junk_metal', count: 25, name: 'Schrott' };
            case 2: return { id: 'cloth', count: 10, name: 'Stoff' };
            case 3: return { id: 'duct_tape', count: 5, name: 'Klebeband' };
            case 4: return { id: 'screws', count: 10, name: 'Schrauben' };
            case 5: return { id: 'gears', count: 10, name: 'Zahnräder' };
            case 6: return { id: 'adhesive', count: 5, name: 'Kleber' };
            case 7: return { id: 'springs', count: 5, name: 'Federn' };
            case 8: return { id: 'circuit', count: 5, name: 'Schaltkreise' };
            case 9: return { id: 'nuclear_mat', count: 3, name: 'Nukleares Material' };
            default: return null;
        }
    },

    getMaxSlots: function() {
        let base = 10;
        if (this.state.stats) {
            base += (this.state.stats.STR || 1);
        }
        const strongBack = this.getPerkLevel('strong_back');
        if (strongBack > 0) base += (strongBack * 5);

        if (this.state.equip && this.state.equip.back) {
            const pack = this.state.equip.back;
            let packBonus = 0;
            if (pack.bonus && pack.bonus.slots) packBonus = pack.bonus.slots;
            else if (pack.props && pack.props.bonus && pack.props.bonus.slots) packBonus = pack.props.bonus.slots;
            else if (this.items[pack.id] && this.items[pack.id].bonus && this.items[pack.id].bonus.slots) {
                packBonus = this.items[pack.id].bonus.slots;
            }
            base += packBonus;
        }
        return base;
    },
    
    switchToBestMelee: function() {
        const oldWeapon = this.state.equip.weapon;
        const oldName = (oldWeapon && oldWeapon.name && oldWeapon.name !== 'Fäuste') 
            ? (oldWeapon.props?.name || oldWeapon.name) 
            : "Fernkampfwaffe";

        if(!this.state.inventory || this.state.inventory.length === 0) {
            this.state.equip.weapon = this.items.fists;
            UI.log("Waffe abgelegt.", "text-red-500 font-bold");
            if(typeof UI.renderChar === 'function') UI.renderChar();
            return;
        }

        let bestWeapon = null;
        let bestDmg = -1;
        let bestIndex = -1;

        this.state.inventory.forEach((item, idx) => {
            const def = this.items[item.id];
            if (!def) return;

            const type = def.type ? def.type.toLowerCase() : '';
            const isWeaponType = type === 'weapon' || type === 'melee' || type === 'weapon_melee' || type.includes('weapon');
            const needsAmmo = def.ammo && def.ammo !== 'none';

            if (isWeaponType && !needsAmmo) {
                let dmg = def.dmg || 0;
                if (item.props && item.props.dmgMult) dmg *= item.props.dmgMult;
                
                if (dmg > bestDmg) {
                    bestDmg = dmg;
                    bestWeapon = item;
                    bestIndex = idx;
                }
            }
        });

        if (bestWeapon) {
            this.useItem(bestIndex); 
            const newName = bestWeapon.props?.name || this.items[bestWeapon.id].name;
            UI.log(`${newName} wurde statt ${oldName} angelegt, deine Munition ist leer`, "text-yellow-400 blink-red");
        } else {
            if (this.state.equip.weapon && this.state.equip.weapon.name !== "Fäuste") {
                this.unequipItem('weapon'); 
                UI.log("Keine Nahkampfwaffe gefunden! Fäuste!", "text-red-500");
            } else {
                UI.log("Keine Munition mehr!", "text-red-500");
            }
        }

        if(typeof UI.renderChar === 'function') UI.renderChar();
    },

    addRadiation: function(amount) {
        if(!this.state) return;
        if(typeof this.state.rads === 'undefined') this.state.rads = 0;
        
        let finalAmount = amount;
        if (amount > 0) {
            const perkLvl = this.getPerkLevel('rad_resistant');
            if (perkLvl > 0) {
                const reduction = perkLvl * 0.10; 
                finalAmount = Math.ceil(amount * (1 - reduction));
            }
        }

        this.state.rads = Math.min(this.state.maxHp, Math.max(0, this.state.rads + finalAmount));
        
        if(finalAmount > 0) UI.log(`+${finalAmount} RADS!`, "text-red-500 font-bold animate-pulse");
        else if(finalAmount < 0) UI.log(`${Math.abs(finalAmount)} RADS entfernt.`, "text-green-300");
        
        const effectiveMax = this.state.maxHp - this.state.rads;
        if(this.state.hp > effectiveMax) { this.state.hp = effectiveMax; }
        
        if(this.state.hp <= 0 && finalAmount > 0) {
            this.state.hp = 0; this.state.isGameOver = true;
            if(UI && UI.showGameOver) UI.showGameOver();
        }
        UI.update();
    },

    rest: function() { 
        if(!this.state) return;
        const isSafe = (this.state.view === 'vault' || this.state.view === 'city' || this.state.view === 'clinic' ||
                        (this.state.zone && (this.state.zone.includes("Vault") || this.state.zone.includes("Stadt") || this.state.zone.includes("City"))));

        if(!isSafe) {
            this.addRadiation(10);
            UI.log("Ungeschützt geschlafen: +10 RADS", "text-red-500 font-bold");
        } else {
            UI.log("Sicher geschlafen. Kein RAD Zuwachs.", "text-green-400");
        }

        const effectiveMax = this.state.maxHp - (this.state.rads || 0);
        this.state.hp = effectiveMax; 
        UI.log("Ausgeruht. HP voll (soweit möglich).", "text-blue-400"); 
        UI.update(); 
    },

    restInCamp: function() {
        if(!this.state || !this.state.camp) return;
        const lvl = this.state.camp.level || 1;
        
        this.addRadiation(5); 

        const effectiveMax = this.state.maxHp - (this.state.rads || 0);
        let healPct = 30 + ((lvl - 1) * 8); 
        if(lvl >= 10) healPct = 100;
        if(healPct > 100) healPct = 100;

        const healAmount = Math.floor(effectiveMax * (healPct / 100));
        const oldHp = this.state.hp;
        
        this.state.hp = Math.min(effectiveMax, this.state.hp + healAmount);
        const healed = Math.floor(this.state.hp - oldHp);

        UI.log(`Geschlafen (Lager Stufe ${lvl}).`, "text-blue-300");
        UI.log(`Regeneration: ${healPct}% (+${healed} TP) / +5 RADS`, "text-green-400 font-bold");

        UI.update();
        if(typeof UI.renderCamp === 'function') UI.renderCamp();
    },

    heal: function() { 
        if(this.state.caps >= 25) { 
            this.state.caps -= 25; 
            this.state.rads = 0; 
            this.state.hp = this.state.maxHp; 
            UI.log("BEHANDLUNG ERFOLGREICH: Alle RADS entfernt, Gesundheit vollständig wiederhergestellt.", "text-green-400 font-bold");
            UI.update(); 
            setTimeout(() => {
                if (Game.state.view === 'clinic') {
                    if(typeof UI.renderCity === 'function') UI.renderCity();
                }
            }, 1500); 
        } else { UI.log("Zu wenig Kronkorken.", "text-red-500"); }
    },
    
    buyAmmo: function(qty) { 
        this.buyItem('ammo', qty);
    },
    
    buyItem: function(id, qtyMode = 1) {
        const item = Game.items[id];
        if (!item) {
            if(typeof UI !== 'undefined') UI.error("Item-Daten fehlen für: " + id);
            return;
        }

        let stock = 0;
        let pricePerUnit = item.cost; 
        let itemsPerUnit = 1; 

        if (id === 'ammo') {
            stock = this.state.shop.ammoStock || 0; 
            itemsPerUnit = 10; 
            pricePerUnit = 10; 
        } else {
            stock = (this.state.shop.stock && this.state.shop.stock[id] !== undefined) ? this.state.shop.stock[id] : 0;
        }

        if (stock < itemsPerUnit) { 
             if(typeof UI !== 'undefined') UI.error("Händler hat das nicht mehr vorrätig.");
             return;
        }

        let packsToBuy = 1; 
        if (typeof qtyMode === 'number') {
            packsToBuy = qtyMode;
        } else if (qtyMode === 'max') {
            const maxAffordable = Math.floor(Game.state.caps / pricePerUnit);
            const maxInStock = Math.floor(stock / itemsPerUnit);
            packsToBuy = Math.min(maxAffordable, maxInStock);
            
            if(packsToBuy > 100) packsToBuy = 100;
            if(packsToBuy < 1) packsToBuy = 1; 
        }

        const totalCost = packsToBuy * pricePerUnit;
        const totalItemsReceived = packsToBuy * itemsPerUnit;

        if (totalItemsReceived > stock) {
            if(typeof UI !== 'undefined') UI.error("Händler hat nicht genug auf Lager.");
            return;
        }

        if (Game.state.caps < totalCost) {
            if(typeof UI !== 'undefined') UI.error("Nicht genug Kronkorken! (" + totalCost + " benötigt)");
            return;
        }

        if (id === 'camp_kit') {
            const hasKit = Game.state.inventory.some(i => i.id === 'camp_kit');
            const hasBuilt = !!Game.state.camp;
            if (hasKit || hasBuilt) {
                if(typeof UI !== 'undefined') UI.error("Du hast bereits ein Zelt!");
                return;
            }
        }

        Game.state.caps -= totalCost;
        Game.state.shop.merchantCaps += totalCost; 
        
        if (id === 'ammo') {
            Game.state.shop.ammoStock -= totalItemsReceived;
        } else {
            Game.state.shop.stock[id] -= packsToBuy;
        }

        Game.addToInventory(id, totalItemsReceived); 

        if(typeof UI !== 'undefined') {
            UI.log(`Gekauft: ${packsToBuy}x ${itemsPerUnit > 1 ? 'Paket ' : ''}${item.name} (-${totalCost} KK).`);
            if (Game.state.view === 'shop') UI.renderShop('buy'); 
        }
        
        Game.saveGame();
    },

    sellItem: function(invIndex, qtyMode = 1) {
        const entry = Game.state.inventory[invIndex];
        if (!entry) return;

        const item = Game.items[entry.id];
        if (!item) return;

        let valMult = entry.props && entry.props.valMult ? entry.props.valMult : 1;
        let unitPrice = Math.floor((item.cost * 0.25) * valMult);
        if (unitPrice < 1) unitPrice = 1;

        let amount = 1;
        if (typeof qtyMode === 'number') {
            amount = qtyMode;
        } else if (qtyMode === 'max') {
            amount = entry.count;
            const maxMerchantCanBuy = Math.floor(Game.state.shop.merchantCaps / unitPrice);
            if (amount > maxMerchantCanBuy) amount = maxMerchantCanBuy;
        }

        if (amount > entry.count) amount = entry.count;
        if (amount <= 0) {
             if(typeof UI !== 'undefined') UI.error("Der Händler ist pleite!");
             return;
        }

        const totalValue = unitPrice * amount;

        if (Game.state.shop.merchantCaps < totalValue) {
            if(typeof UI !== 'undefined') UI.error("Der Händler hat nicht genug Kronkorken.");
            return;
        }

        Game.state.caps += totalValue;
        Game.state.shop.merchantCaps -= totalValue;

        Game.removeFromInventory(entry.id, amount); 
        
        if (entry.id === 'ammo') {
             Game.state.shop.ammoStock = (Game.state.shop.ammoStock || 0) + amount;
        } else {
             if (!Game.state.shop.stock[entry.id]) Game.state.shop.stock[entry.id] = 0;
             Game.state.shop.stock[entry.id] += amount;
        }

        if(typeof UI !== 'undefined') {
            UI.log(`Verkauft: ${amount}x ${item.name} (+${totalValue} KK).`);
            if (Game.state.view === 'shop') UI.renderShop('sell');
        }
        
        Game.saveGame();
    },

    addToInventory: function(idOrItem, count=1) { 
        if(!this.state.inventory) this.state.inventory = []; 
        let itemId, props = null;

        if(typeof idOrItem === 'object') {
            itemId = idOrItem.id;
            props = idOrItem.props;
            count = idOrItem.count || 1;
        } else { itemId = idOrItem; }

        if (itemId === 'camp_kit') {
            const hasCamp = this.state.inventory.some(i => i.id === 'camp_kit');
            if (hasCamp) return false; 
        }

        const limit = this.getStackLimit(itemId);
        let remaining = count;
        let added = false;
        let isActuallyNew = false; 

        // 1. Auf bestehende Stacks?
        if (!props) {
            for (let item of this.state.inventory) {
                if (item.id === itemId && !item.props && item.count < limit) {
                    const space = limit - item.count;
                    const take = Math.min(space, remaining);
                    item.count += take;
                    remaining -= take;
                    added = true;
                    if (remaining <= 0) break;
                }
            }
        }

        // 2. Neue Slots
        if (remaining > 0) {
            const maxSlots = this.getMaxSlots();
            while (remaining > 0) {
                if (this.getUsedSlots() >= maxSlots) {
                    UI.log("INVENTAR VOLL!", "text-red-500 font-bold blink-red");
                    if (added && itemId === 'ammo') this.syncAmmo(); 
                    return false; 
                }
                const take = Math.min(limit, remaining);
                const newItem = { id: itemId, count: take, isNew: true };
                if (props) newItem.props = props;
                this.state.inventory.push(newItem);
                remaining -= take;
                added = true;
                isActuallyNew = true; 
            }
        }

        if (added) {
            const itemDef = this.items[itemId];
            const name = (props && props.name) ? props.name : (itemDef ? itemDef.name : itemId);
            const color = (props && props.color) ? props.color.split(' ')[0] : "text-green-400";
            
            if(itemId !== 'ammo' || count < 10) {
                UI.log(`+ ${name} (${count})`, color);
            } else {
                UI.log(`+ ${count} Munition`, "text-green-400");
            }
            
            if (itemId === 'ammo') this.syncAmmo();
            
            // [UPDATE] Alert nur auslösen, wenn neuer Slot
            if(isActuallyNew && typeof UI !== 'undefined' && UI.triggerInventoryAlert) {
                UI.triggerInventoryAlert();
            }
            return true;
        }
        return false;
    }, 
    
    removeFromInventory: function(itemId, amount=1) {
        if(!this.state) return false;
        let remaining = amount;
        
        for (let i = 0; i < this.state.inventory.length; i++) {
            const item = this.state.inventory[i];
            if (item.id === itemId) {
                const take = Math.min(item.count, remaining);
                item.count -= take;
                remaining -= take;
                if (item.count <= 0) {
                    this.state.inventory.splice(i, 1);
                    i--;
                }
                if (remaining <= 0) break;
            }
        }
        if(itemId === 'ammo') this.syncAmmo();
        return remaining === 0;
    },

    destroyItem: function(invIndex) {
        if(!this.state.inventory || !this.state.inventory[invIndex]) return;
        const item = this.state.inventory[invIndex];
        const def = this.items[item.id];
        
        let name = (item.props && item.props.name) ? item.props.name : def.name;

        this.state.inventory.splice(invIndex, 1);
        
        if(item.id === 'ammo') this.syncAmmo();
        
        UI.log(`${name} weggeworfen.`, "text-red-500 italic");
        
        UI.update();
        if(this.state.view === 'inventory') UI.renderInventory();
        this.saveGame();
    },

    scrapItem: function(invIndex) {
        if(!this.state.inventory || !this.state.inventory[invIndex]) return;
        if (this.state.view !== 'crafting') {
            UI.log("Zerlegen nur an einer Werkbank möglich!", "text-red-500");
            return;
        }

        const item = this.state.inventory[invIndex];
        if (item.id === 'junk_metal') {
            UI.log("Das ist bereits Schrott.", "text-orange-500");
            return;
        }

        const def = this.items[item.id];
        if(!def) return;

        let name = (item.props && item.props.name) ? item.props.name : def.name;
        let value = def.cost || 5;
        
        this.state.inventory.splice(invIndex, 1);

        let scrapAmount = Math.max(1, Math.floor(value / 10)); 
        const perkLvl = this.getPerkLevel('scrapper');
        if(perkLvl > 0) { scrapAmount += perkLvl; }

        this.addToInventory('junk_metal', scrapAmount);
        
        let msg = `Zerlegt: ${name} -> ${scrapAmount}x Schrott`;

        let screwChance = 0.3 + (perkLvl * 0.15); 
        const isComplex = def.type === 'weapon' || def.type === 'junk' || def.type === 'tool';

        if(isComplex && Math.random() < screwChance) {
            let screws = Math.max(1, Math.floor(value / 50));
            if (perkLvl >= 2 && Math.random() < 0.4) screws *= 2;
            this.addToInventory('screws', screws);
            msg += `, ${screws}x Schrauben`;
        }
        
        let plasticChance = 0.2 + (perkLvl * 0.15);
        if(value >= 100 && Math.random() < plasticChance) {
            let plastic = 1;
            if (perkLvl >= 3) plastic += 1;
            this.addToInventory('plastic', plastic);
            msg += `, ${plastic}x Plastik`;
        }

        UI.log(msg, "text-orange-400 font-bold");
        UI.update();
        if(typeof UI.renderCrafting === 'function') {
            UI.renderCrafting('scrap');
        }
        this.saveGame();
    },

    unequipItem: function(slot) {
        if(!this.state.equip[slot]) return;
        const item = this.state.equip[slot];

        if(item.name === "Fäuste" || item.name === "Vault-Anzug") {
             UI.log("Das kann nicht abgelegt werden.", "text-gray-500");
             return;
        }

        if(this.getUsedSlots() >= this.getMaxSlots()) {
             UI.log("Inventar voll! Ablegen nicht möglich.", "text-red-500");
             return;
        }

        let itemToAdd = item._fromInv || item.id;
        if (!itemToAdd && item.id) itemToAdd = item.id;
        let objToAdd = itemToAdd;
        if (!item._fromInv && item.props) objToAdd = { id: item.id, count: 1, props: item.props };
        else if (typeof itemToAdd === 'string') objToAdd = { id: itemToAdd, count: 1 };

        this.state.inventory.push(objToAdd);
        
        if(slot === 'weapon') this.state.equip.weapon = this.items.fists;
        else if(slot === 'body') this.state.equip.body = this.items.vault_suit;
        else this.state.equip[slot] = null; 

        UI.log(`${item.name} abgelegt.`, "text-yellow-400");
        this.recalcStats();
        if(typeof UI !== 'undefined' && this.state.view === 'char') UI.renderChar(); 
        this.saveGame();
    },

    useItem: function(invIndexOrId, mode = 1) { 
        let invItem, index;
        if(typeof invIndexOrId === 'string') {
            index = this.state.inventory.findIndex(i => i.id === invIndexOrId);
        } else { index = invIndexOrId; }

        if(index === -1 || !this.state.inventory[index]) return;
        invItem = this.state.inventory[index];
        const itemDef = this.items[invItem.id];
        
        if (itemDef.type === 'back') {
            const slot = 'back';
            let oldEquip = this.state.equip[slot];
            this.state.inventory.splice(index, 1);
            if(oldEquip) {
                const oldItem = { id: oldEquip.id, count: 1, props: oldEquip.props, isNew: true };
                this.state.inventory.push(oldItem);
            }
            this.state.equip[slot] = { ...itemDef, ...invItem.props };
            UI.log(`Rucksack angelegt: ${itemDef.name}`, "text-yellow-400");
            if(this.getUsedSlots() > this.getMaxSlots()) UI.log("WARNUNG: Überladen!", "text-red-500 blink-red");
            UI.update();
            if(this.state.view === 'inventory') UI.renderInventory();
            this.saveGame();
            return;
        }

        if(invItem.id === 'camp_kit') { this.deployCamp(index); return; }

        if(invItem.id === 'nuka_cola') {
            const effectiveMax = this.state.maxHp - (this.state.rads || 0);
            this.state.hp = Math.min(this.state.hp + 15, effectiveMax);
            this.state.caps += 1;
            this.addRadiation(5);
            UI.log("Nuka Cola: Erfrischend... und strahlend.", "text-blue-400");
            this.removeFromInventory('nuka_cola', 1);
            UI.update();
            return;
        }

        if(invItem.id === 'radaway') {
            this.addRadiation(-50); 
            UI.log("RadAway verwendet. Strahlung sinkt.", "text-green-300 font-bold");
            this.removeFromInventory('radaway', 1);
            UI.update();
            return;
        }

        if(itemDef.type === 'blueprint') {
            if(!this.state.knownRecipes.includes(itemDef.recipeId)) {
                this.state.knownRecipes.push(itemDef.recipeId);
                UI.log(`Gelernt: ${itemDef.name}`, "text-cyan-400 font-bold");
                invItem.count--;
                if(invItem.count <= 0) this.state.inventory.splice(index, 1);
            } else { UI.log("Du kennst diesen Bauplan bereits.", "text-gray-500"); }
            return;
        }
        else if(itemDef.type === 'consumable') { 
            if(itemDef.effect === 'heal' || itemDef.effect === 'heal_rad') { 
                let healAmt = itemDef.val; 
                
                const medicLvl = this.getPerkLevel('medic');
                if(medicLvl > 0) {
                    const bonus = 1 + (medicLvl * 0.2); 
                    healAmt = Math.floor(healAmt * bonus);
                }

                const effectiveMax = this.state.maxHp - (this.state.rads || 0);
                if(this.state.hp >= effectiveMax) { UI.log("Gesundheit voll.", "text-gray-500"); return; } 
                
                let countToUse = 1;
                if (mode === 'max') {
                    const missing = effectiveMax - this.state.hp;
                    if (missing > 0) {
                        countToUse = Math.ceil(missing / healAmt);
                        if (countToUse > invItem.count) countToUse = invItem.count;
                    } else { countToUse = 0; }
                }

                if (countToUse > 0) {
                    const totalHeal = healAmt * countToUse;
                    this.state.hp = Math.min(effectiveMax, this.state.hp + totalHeal); 
                    if(itemDef.effect === 'heal_rad' && itemDef.rad) {
                        this.addRadiation(itemDef.rad * countToUse);
                    }
                    UI.log(`Verwendet: ${countToUse}x ${itemDef.name} (+${totalHeal} HP)`, "text-blue-400"); 
                    this.removeFromInventory(invItem.id, countToUse);
                }
            } 
        } 
        else {
            const validSlots = ['weapon', 'body', 'head', 'legs', 'feet', 'arms'];
            if(validSlots.includes(itemDef.type)) {
                const slot = itemDef.slot || itemDef.type;
                let oldEquip = this.state.equip[slot];
                
                if(oldEquip && oldEquip.name !== "Fäuste" && oldEquip.name !== "Vault-Anzug") {
                    const existsInInv = this.state.inventory.some(i => {
                        if(i.props) return i.props.name === oldEquip.name;
                        const def = this.items[i.id];
                        if (def) return def.name === oldEquip.name;
                        return false;
                    });

                    if(!existsInInv) {
                        if(oldEquip._fromInv) this.state.inventory.push(oldEquip._fromInv);
                        else {
                            const oldKey = Object.keys(this.items).find(k => this.items[k].name === oldEquip.name);
                            if(oldKey) this.state.inventory.push({id: oldKey, count: 1, isNew: true});
                        }
                    }
                } 
                
                this.state.inventory.splice(index, 1);
                const equipObject = { ...itemDef, ...invItem.props, _fromInv: invItem }; 
                this.state.equip[slot] = equipObject;
                
                const displayName = invItem.props ? invItem.props.name : itemDef.name;
                UI.log(`Ausgerüstet: ${displayName}`, "text-yellow-400"); 
                
                this.recalcStats();
                const effectiveMax = this.state.maxHp - (this.state.rads || 0);
                if(this.state.hp > effectiveMax) this.state.hp = effectiveMax;
            }
        } 
        
        UI.update(); 
        if(this.state.view === 'inventory') UI.renderInventory(); 
        this.saveGame(); 
    }, 
    
    craftItem: function(recipeId) {
        const recipe = this.recipes.find(r => r.id === recipeId);
        if(!recipe) return;
        if(this.state.lvl < recipe.lvl) { UI.log(`Benötigt Level ${recipe.lvl}!`, "text-red-500"); return; }
        
        for(let reqId in recipe.req) {
            const countNeeded = recipe.req[reqId];
            const invItem = this.state.inventory.find(i => i.id === reqId);
            if (!invItem || invItem.count < countNeeded) { UI.log(`Material fehlt: ${this.items[reqId].name}`, "text-red-500"); return; }
        }
        for(let reqId in recipe.req) {
            const countNeeded = recipe.req[reqId];
            const invItem = this.state.inventory.find(i => i.id === reqId);
            invItem.count -= countNeeded;
            if(invItem.count <= 0) this.state.inventory = this.state.inventory.filter(i => i.id !== reqId);
        }
        
        if(recipe.out === "AMMO") { 
            this.addToInventory('ammo', recipe.count);
        } else { 
            this.addToInventory(recipe.out, recipe.count); 
        }
        
        UI.log(`Hergestellt: ${recipe.count}x ${recipe.out === "AMMO" ? "Munition" : this.items[recipe.out].name}`, "text-green-400 font-bold");

        if(recipe.type === 'cooking') {
            if(typeof UI.renderCampCooking === 'function') {
                UI.renderCampCooking();
            }
        } else {
            if(typeof UI !== 'undefined') UI.renderCrafting(); 
        }
    },

    startCombat: function() { 
        let pool = []; 
        let lvl = this.state.lvl; 
        const dLvl = this.state.dungeonLevel || 0;
        let difficultyMult = 1 + (dLvl * 0.2);
        let biome = this.worldData[`${this.state.sector.x},${this.state.sector.y}`]?.biome || 'wasteland'; 
        let zone = this.state.zone; 
        
        if(zone.includes("Supermarkt")) { pool = [this.monsters.raider, this.monsters.ghoul, this.monsters.wildDog]; if(lvl >= 4) pool.push(this.monsters.superMutant); } 
        else if (zone.includes("Höhle")) { pool = [this.monsters.moleRat, this.monsters.radScorpion, this.monsters.bloatfly]; if(lvl >= 3) pool.push(this.monsters.ghoul); } 
        else if(biome === 'city') { pool = [this.monsters.raider, this.monsters.ghoul, this.monsters.protectron]; if(lvl >= 5) pool.push(this.monsters.superMutant); if(lvl >= 7) pool.push(this.monsters.sentryBot); } 
        else if(biome === 'desert') { pool = [this.monsters.radScorpion, this.monsters.raider, this.monsters.moleRat]; } 
        else if(biome === 'jungle') { pool = [this.monsters.bloatfly, this.monsters.mutantRose, this.monsters.yaoGuai]; } 
        else if(biome === 'swamp') { pool = [this.monsters.mirelurk, this.monsters.bloatfly]; if(lvl >= 5) pool.push(this.monsters.ghoul); } 
        else { pool = [this.monsters.moleRat, this.monsters.radRoach, this.monsters.bloatfly]; if(lvl >= 2) pool.push(this.monsters.raider); if(lvl >= 3) pool.push(this.monsters.wildDog); } 
        
        if(lvl >= 8 && Math.random() < 0.1) pool = [this.monsters.deathclaw]; 
        if(pool.length === 0) pool = [this.monsters.radRoach]; 

        const template = pool[Math.floor(Math.random()*pool.length)]; 
        let enemy = { ...template }; 
        if(isNaN(difficultyMult)) difficultyMult = 1;
        enemy.hp = Math.floor(enemy.hp * difficultyMult);
        enemy.maxHp = enemy.hp;
        enemy.dmg = Math.floor(enemy.dmg * difficultyMult);
        enemy.loot = Math.floor(enemy.loot * difficultyMult);

        const fortuneLvl = this.getPerkLevel('fortune_finder');
        if(fortuneLvl > 0) {
            enemy.loot = Math.floor(enemy.loot * (1 + (fortuneLvl * 0.1)));
        }

        const isLegendary = Math.random() < 0.05; 
        if(isLegendary) { 
            enemy.isLegendary = true; 
            enemy.name = "Legendäre " + enemy.name; 
            enemy.hp *= 2; 
            enemy.maxHp = enemy.hp; 
            enemy.dmg = Math.floor(enemy.dmg*1.5); 
            enemy.loot *= 3; 
            if(Array.isArray(enemy.xp)) enemy.xp = [enemy.xp[0]*3, enemy.xp[1]*3]; 
        }
        
        if(typeof Combat !== 'undefined') { Combat.start(enemy); } 
        else { console.error("Combat module missing!"); }
    },
    
    gambleLegendaryLoot: function(sum) {
        UI.log(`🎲 Wasteland Gamble: ${sum}`, "text-yellow-400 font-bold");
        if(sum <= 9) {
            if(Math.random() < 0.5) { this.state.caps += 50; UI.log("Gewinn: 50 Kronkorken", "text-green-400"); } 
            else { this.addToInventory('ammo', 10); UI.log("Gewinn: 10x Munition", "text-green-400"); }
        }
        else if(sum <= 14) { 
            this.state.caps += 150;
            this.addToInventory('stimpack', 1);
            this.addToInventory('screws', 5);
            UI.log("Gewinn: 150 KK + Stimpack + Schrott", "text-blue-400");
        }
        else {
            const rareId = this.items['plasma_rifle'] ? 'plasma_rifle' : 'hunting_rifle';
            const item = Game.generateLoot(rareId);
            item.props = { prefix: 'legendary', name: `Legendäres ${this.items[rareId].name}`, dmgMult: 1.5, valMult: 3.0, bonus: {LUC: 2}, color: 'text-yellow-400 font-bold' };
            this.addToInventory(item);
            this.state.caps += 300;
            UI.log("JACKPOT! Legendäre Waffe + 300 KK!", "text-yellow-400 font-bold animate-pulse");
        }
        this.saveGame();
    },

    upgradeStat: function(key, e) { 
        if(e) e.stopPropagation(); 
        if(this.state.statPoints > 0) { 
            this.state.stats[key]++; 
            this.state.statPoints--; 
            this.recalcStats();
            UI.renderChar(); 
            UI.update(); 
            this.saveGame(); 
        } 
    },

    choosePerk: function(perkId) {
        if(this.state.perkPoints <= 0) {
            UI.log("Keine Perk-Punkte verfügbar!", "text-red-500");
            return;
        }

        const perkDef = this.perkDefs.find(p => p.id === perkId);
        if(!perkDef) return;

        if (Array.isArray(this.state.perks)) {
            const oldPerks = this.state.perks;
            this.state.perks = {};
            oldPerks.forEach(id => this.state.perks[id] = 1);
        }
        if (!this.state.perks) this.state.perks = {};

        const currentLvl = this.state.perks[perkId] || 0;
        const maxLvl = perkDef.max || 1;

        if (currentLvl >= maxLvl) {
            UI.log(`${perkDef.name} ist bereits auf Max-Level!`, "text-yellow-500");
            return;
        }

        this.state.perkPoints--;
        this.state.perks[perkId] = currentLvl + 1;
        
        UI.log(`Perk gelernt: ${perkDef.name} (Stufe ${this.state.perks[perkId]})`, "text-green-400 font-bold");
        
        this.recalcStats();
        this.saveGame();
        
        if(typeof UI.renderChar === 'function') UI.renderChar('perks');
    },

    deployCamp: function(invIndex, confirmed=false) {
        if(this.state.camp) { UI.log("Lager existiert bereits!", "text-red-500"); return; }
        if(this.state.zone.includes("Stadt") || this.state.dungeonLevel > 0) { UI.log("Hier nicht möglich!", "text-red-500"); return; }
        
        const cost = 100;
        if(this.state.caps < cost) { UI.log(`Benötigt ${cost} Kronkorken für Aufbau.`, "text-red-500"); return; }

        if(!confirmed) {
             if(typeof UI !== 'undefined' && UI.els.dialog) {
                 UI.els.dialog.style.display = 'flex';
                 UI.els.dialog.innerHTML = `
                    <div class="bg-black/95 border-2 border-yellow-400 p-6 rounded-lg shadow-[0_0_20px_#ffd700] text-center max-w-sm pointer-events-auto relative z-50">
                        <div class="text-4xl mb-4">⛺</div>
                        <h3 class="text-xl font-bold text-yellow-400 mb-2">LAGER ERRICHTEN?</h3>
                        <p class="text-gray-300 text-sm mb-6 leading-relaxed">Der Aufbau kostet Material im Wert von <span class="text-yellow-400 font-bold">${cost} Kronkorken</span>.</p>
                        <div class="flex gap-4 justify-center">
                            <button onclick="Game.deployCamp(${invIndex}, true); UI.els.dialog.style.display='none'; UI.els.dialog.innerHTML='';" class="border-2 border-green-500 bg-green-900/40 text-green-400 px-6 py-2 rounded font-bold hover:bg-green-500 hover:text-black transition-all">BAUEN</button>
                            <button onclick="UI.els.dialog.style.display='none'; UI.els.dialog.innerHTML='';" class="border-2 border-red-500 bg-red-900/40 text-red-400 px-6 py-2 rounded font-bold hover:bg-red-500 hover:text-black transition-all">ABBRECHEN</button>
                        </div>
                    </div>
                 `;
             }
             return;
        }

        this.state.caps -= cost;
        this.state.camp = { 
            sector: { x: this.state.sector.x, y: this.state.sector.y }, 
            x: this.state.player.x, y: this.state.player.y, level: 1 
        };
        UI.log(`Lager aufgeschlagen! (-${cost} KK)`, "text-green-400 font-bold");
        UI.switchView('camp');
        this.saveGame();
    },

    packCamp: function() {
        if(!this.state.camp) return;
        this.state.camp = null;
        UI.log("Lager eingepackt.", "text-yellow-400");
        UI.switchView('map');
        this.saveGame();
    },

    upgradeCamp: function() {
        if(!this.state.camp) return;
        const lvl = this.state.camp.level;
        
        if(lvl >= 10) {
            UI.log("Lager ist bereits auf Maximalstufe (10)!", "text-yellow-400");
            return;
        }

        const cost = this.getCampUpgradeCost(lvl);
        if(!cost) {
            UI.log("Kein weiteres Upgrade verfügbar.", "text-gray-500");
            return;
        }

        const scrapItem = this.state.inventory.find(i => i.id === cost.id);
        if(!scrapItem || scrapItem.count < cost.count) {
             UI.log(`Upgrade benötigt: ${cost.count}x ${cost.name}`, "text-red-500");
             return;
        }

        scrapItem.count -= cost.count;
        if(scrapItem.count <= 0) {
             this.state.inventory = this.state.inventory.filter(i => i.id !== cost.id);
        }

        this.state.camp.level++;
        UI.log(`Lager verbessert auf Stufe ${this.state.camp.level}!`, "text-green-400 font-bold animate-pulse");
        
        this.saveGame();
        
        if(typeof UI.renderCamp === 'function') UI.renderCamp();
    }
});
// Add helper just in case
Game.addItem = Game.addToInventory;


ui_view_inv.js:
// [TIMESTAMP] 2026-01-10 05:30:00 - ui_view_inv.js - New Item Glow Logic

Object.assign(UI, {

    // [v0.7.0] VIEW STATE
    charTab: 'status', 

    // --- INVENTAR ---
    renderInventory: function() {
        const list = document.getElementById('inventory-list');
        const countDisplay = document.getElementById('inv-count');
        const capsDisplay = document.getElementById('inv-caps');
        
        if(!list) return;
        
        list.innerHTML = '';
        if(capsDisplay) capsDisplay.textContent = Game.state.caps;
        
        const usedSlots = Game.getUsedSlots();
        const maxSlots = Game.getMaxSlots();
        
        if(countDisplay) {
            countDisplay.textContent = `${usedSlots} / ${maxSlots}`;
            countDisplay.className = usedSlots >= maxSlots ? "text-red-500 font-bold animate-pulse" : "text-green-500 font-mono";
        }
        
        const getIcon = (type) => {
            switch(type) {
                case 'weapon': return '🔫'; case 'body': return '🛡️'; case 'head': return '🪖';
                case 'legs': return '👖'; case 'feet': return '🥾'; case 'arms': return '🦾';
                case 'back': return '🎒'; case 'consumable': return '💉'; case 'junk': return '⚙️';
                case 'component': return '🔩'; case 'ammo': return '🧨'; case 'blueprint': return '📜'; 
                case 'tool': return '⛺'; default: return '📦';
            }
        };

        // [UPDATE] createBtn erhält jetzt das ganze Entry-Objekt, um isNew zu manipulieren
        const createBtn = (itemDef, entry, isEquipped, label, onClick) => {
            const btn = document.createElement('div');
            let cssClass = "relative border border-green-500 bg-green-900/30 w-full h-16 flex flex-col items-center justify-center transition-colors group";
            
            if(onClick) cssClass += " cursor-pointer hover:bg-green-500 hover:text-black";
            else cssClass += " cursor-default opacity-80"; 
            
            // [NEU] Glow Effekt wenn neu
            if (entry.isNew) {
                cssClass += " new-item-glow";
            }

            btn.className = cssClass;
            
            let displayName = entry.props && entry.props.name ? entry.props.name : itemDef.name;
            let extraClass = entry.props && entry.props.color ? entry.props.color : "";

            btn.innerHTML = `
                <div class="text-2xl">${getIcon(itemDef.type)}</div>
                <div class="text-[10px] truncate max-w-full px-1 font-bold ${extraClass}">${displayName}</div>
                <div class="absolute top-0 right-0 bg-green-900 text-white text-[10px] px-1 font-mono">${entry.count}</div>
            `;

            if(isEquipped) {
                const overlay = document.createElement('div');
                overlay.className = "absolute inset-0 bg-black/60 border-2 border-green-500 flex items-center justify-center text-green-500 font-bold tracking-widest text-[10px] pointer-events-none";
                overlay.textContent = label || "AUSGERÜSTET";
                btn.appendChild(overlay);
                btn.style.borderColor = "#39ff14"; 
            }
            
            // [NEU] Handler um den Glow zu entfernen
            const markAsRead = () => {
                if(entry.isNew) {
                    entry.isNew = false;
                    btn.classList.remove('new-item-glow');
                    // Optional: Speichern triggern, damit es beim Reload nicht wieder leuchtet
                    // Game.saveGame(); 
                }
            };

            // Bei Mouseover oder Click entfernen
            btn.onmouseenter = markAsRead;
            btn.onclick = (e) => {
                e.stopPropagation(); 
                markAsRead();
                if(onClick) onClick();
            };

            return btn;
        };

        const cats = {
            equip: { label: "🛡️ AUSRÜSTUNG", items: [] },
            aid:   { label: "💉 HILFSMITTEL", items: [] },
            misc:  { label: "⚙️ MATERIAL", items: [] }
        };

        const equippedList = [];

        Game.state.inventory.forEach((entry, index) => {
            if(entry.count <= 0) return;
            const item = Game.items[entry.id];
            if(!item) return;

            // Hier übergeben wir das 'entry' Objekt
            if(entry.id === 'camp_kit' && Game.state.camp) {
                 const btn = createBtn(item, entry, true, "AUFGESTELLT", null);
                 equippedList.push(btn); 
                 return;
            }

            const onClick = () => UI.showItemConfirm(index);
            const btn = createBtn(item, entry, false, null, onClick);

            if(['weapon', 'head', 'body', 'arms', 'legs', 'feet', 'back', 'tool'].includes(item.type)) {
                cats.equip.items.push(btn);
            } else if (item.type === 'consumable') {
                cats.aid.items.push(btn);
            } else {
                cats.misc.items.push(btn);
            }
        });

        let hasItems = false;
        ['equip', 'aid', 'misc'].forEach(key => {
            if(cats[key].items.length > 0) {
                hasItems = true;
                const header = document.createElement('div');
                header.className = "col-span-4 bg-green-900/40 text-green-300 text-xs font-bold px-2 py-1 mt-2 border-b border-green-700 tracking-wider flex items-center gap-2";
                header.innerHTML = cats[key].label;
                list.appendChild(header);
                cats[key].items.forEach(btn => list.appendChild(btn));
            }
        });

        const slots = ['weapon', 'head', 'body', 'arms', 'legs', 'feet', 'back'];
        slots.forEach(slot => {
            const equippedItem = Game.state.equip[slot];
            if(!equippedItem || equippedItem.name === 'Fäuste' || equippedItem.name === 'Vault-Anzug' || equippedItem.name === 'Kein Rucksack') return;

            let baseDef = Game.items[equippedItem.id];
            if(!baseDef) {
                const key = Object.keys(Game.items).find(k => Game.items[k].name === equippedItem.name);
                if(key) baseDef = Game.items[key];
            }
            if(!baseDef) return; 

            const onClick = () => UI.showEquippedDialog(slot);

            // Fake entry object für ausgerüstete Items (damit createBtn funktioniert)
            const fakeEntry = { 
                id: equippedItem.id, 
                count: 1, 
                props: equippedItem.props, 
                isNew: false // Ausgerüstete sind nie neu
            };

            const btn = createBtn(baseDef, fakeEntry, true, "AUSGERÜSTET", onClick);
            equippedList.push(btn);
        });

        if(equippedList.length > 0) {
            const sep = document.createElement('div');
            sep.className = "col-span-4 flex items-center justify-center text-[10px] text-green-900 font-bold tracking-widest my-2 opacity-80 mt-6";
            sep.innerHTML = "<span class='bg-black px-2 border-b border-green-900 w-full text-center'>--- AKTIV AUSGERÜSTET ---</span>";
            list.appendChild(sep);
            equippedList.forEach(b => list.appendChild(b));
        }

        if(!hasItems && equippedList.length === 0) {
            list.innerHTML = '<div class="col-span-4 text-center text-gray-500 italic mt-10">Leerer Rucksack...</div>';
        }
    },

    // --- CHARAKTER ---
    renderChar: function(mode) {
        if(mode) this.charTab = mode;
        const tab = this.charTab;

        const elName = document.getElementById('char-sheet-name');
        const elLvl = document.getElementById('char-sheet-lvl');
        if(elName) elName.textContent = Game.state.playerName;
        if(elLvl) elLvl.textContent = Game.state.lvl;

        ['status', 'stats', 'perks'].forEach(t => {
            const btn = document.getElementById(`tab-btn-${t}`);
            const view = document.getElementById(`view-${t}`);
            if(btn && view) {
                if(t === tab) {
                    btn.classList.add('active');
                    view.classList.remove('hidden');
                } else {
                    btn.classList.remove('active');
                    view.classList.add('hidden');
                }
            }
        });

        // --- NEW: TAB GLOW LOGIC ---
        const btnStats = document.getElementById('tab-btn-stats');
        if(btnStats) {
            if(Game.state.statPoints > 0) btnStats.classList.add('alert-glow-yellow');
            else btnStats.classList.remove('alert-glow-yellow');
        }

        const btnPerks = document.getElementById('tab-btn-perks');
        if(btnPerks) {
            if(Game.state.perkPoints > 0) btnPerks.classList.add('alert-glow-yellow');
            else btnPerks.classList.remove('alert-glow-yellow');
        }
        // ---------------------------

        if(tab === 'status') this.renderCharStatus();
        else if(tab === 'stats') this.renderCharStats();
        else if(tab === 'perks') this.renderCharPerks();
    },

    renderCharStatus: function() {
        // [FIX] Helper function to safely set text content without crashing
        const safeSetText = (id, text) => {
            const el = document.getElementById(id);
            if(el) el.textContent = text;
        };

        safeSetText('sheet-hp', `${Math.floor(Game.state.hp)}/${Game.state.maxHp}`);
        
        const nextXp = Game.expToNextLevel(Game.state.lvl);
        safeSetText('sheet-xp', `${Math.floor(Game.state.xp)}/${nextXp}`);
        
        const used = Game.getUsedSlots();
        const max = Game.getMaxSlots();
        const loadEl = document.getElementById('sheet-load');
        if(loadEl) {
            loadEl.textContent = `${used}/${max}`;
            loadEl.className = used >= max ? "text-red-500 font-bold animate-pulse" : "text-white font-bold";
        }

        safeSetText('sheet-crit', `${Game.state.critChance}%`);

        // Der Alert-Kasten kann drin bleiben, stört nicht
        const alertBox = document.getElementById('status-points-alert');
        if(alertBox) {
            if(Game.state.statPoints > 0 || Game.state.perkPoints > 0) {
                alertBox.classList.remove('hidden');
                alertBox.onclick = () => {
                    if(Game.state.statPoints > 0) UI.renderChar('stats');
                    else UI.renderChar('perks');
                };
            } else {
                alertBox.classList.add('hidden');
            }
        }

        const slots = ['head', 'back', 'weapon', 'body', 'arms', 'legs', 'feet'];
        
        slots.forEach(slot => {
            const el = document.getElementById(`slot-${slot}`);
            if(!el) return; // Existiert Element nicht, abbrechen

            const item = Game.state.equip[slot];
            
            const isEmpty = !item || 
                           (slot === 'back' && !item.props) || 
                           (!item.name || item.name === 'Fäuste' || item.name === 'Vault-Anzug' || item.name === 'Kein Rucksack');

            const nameEl = el.querySelector('.item-name');
            if(!nameEl) return; // Sicherstellen dass auch Kind-Element da ist

            if(isEmpty) {
                el.classList.remove('filled');
                el.classList.add('empty');
                nameEl.textContent = "---";
                nameEl.className = "item-name text-gray-600";
                el.onclick = null; 
            } else {
                el.classList.add('filled');
                el.classList.remove('empty');
                const name = item.props ? item.props.name : item.name;
                const color = (item.props && item.props.color) ? item.props.color : "text-[#39ff14]";
                
                nameEl.textContent = name;
                nameEl.className = `item-name ${color}`;
                el.onclick = () => UI.showEquippedDialog(slot);
            }
        });
    },

    renderCharStats: function() {
        const container = document.getElementById('special-list');
        const pointsEl = document.getElementById('sheet-stat-points');
        if(!container) return;

        container.innerHTML = '';
        if(pointsEl) pointsEl.textContent = Game.state.statPoints;

        const statOrder = ['STR', 'PER', 'END', 'INT', 'AGI', 'LUC'];
        const canUpgrade = Game.state.statPoints > 0;

        statOrder.forEach(key => {
            const val = Game.getStat(key);
            const label = (window.GameData && window.GameData.statLabels && window.GameData.statLabels[key]) ? window.GameData.statLabels[key] : key;
            
            let bar = '';
            for(let i=1; i<=10; i++) {
                bar += (i <= val) ? '<div class="h-2 w-full bg-[#39ff14] mr-0.5"></div>' : '<div class="h-2 w-full bg-green-900/30 mr-0.5"></div>';
            }

            const div = document.createElement('div');
            div.className = "flex items-center justify-between bg-green-900/10 border border-green-900 p-2";
            
            let btnHtml = '';
            if(canUpgrade && val < 10) {
                btnHtml = `<button class="w-8 h-8 bg-yellow-500 text-black font-bold flex items-center justify-center hover:bg-yellow-400" onclick="Game.upgradeStat('${key}', event)">+</button>`;
            } else {
                btnHtml = `<div class="w-8 h-8 flex items-center justify-center font-bold text-green-700 text-xl">${val}</div>`;
            }

            div.innerHTML = `
                <div class="flex-1">
                    <div class="flex justify-between mb-1">
                        <span class="font-bold text-green-400 text-lg">${key}</span>
                        <span class="text-xs text-green-600 uppercase tracking-widest mt-1">${label}</span>
                    </div>
                    <div class="flex w-32">${bar}</div>
                </div>
                <div class="ml-4">${btnHtml}</div>
            `;
            container.appendChild(div);
        });
    },

    renderCharPerks: function() {
        const container = document.getElementById('perks-list');
        const pointsEl = document.getElementById('sheet-perk-points');
        if(!container) return;

        const scrollPos = container.parentElement.scrollTop || 0;

        container.innerHTML = '';
        if(pointsEl) pointsEl.textContent = Game.state.perkPoints;
        const points = Game.state.perkPoints;

        if(Game.perkDefs) {
            Game.perkDefs.forEach(p => {
                const currentLvl = Game.getPerkLevel(p.id);
                const maxLvl = p.max || 1;
                const isMaxed = currentLvl >= maxLvl;
                const canAfford = points > 0 && !isMaxed;
                
                let levelBar = '';
                for(let i=0; i<maxLvl; i++) {
                    levelBar += (i < currentLvl) ? '<span class="text-yellow-400 text-sm">●</span>' : '<span class="text-gray-700 text-sm">○</span>';
                }

                const div = document.createElement('div');
                div.className = `border ${isMaxed ? 'border-yellow-900 bg-yellow-900/5' : 'border-green-800 bg-black'} p-3 flex justify-between items-center transition-all hover:border-green-500`;
                
                let actionBtn = '';
                if(canAfford) {
                    actionBtn = `<button class="bg-yellow-500/20 text-yellow-400 border border-yellow-500 px-3 py-1 text-xs font-bold hover:bg-yellow-500 hover:text-black" onclick="event.stopPropagation(); Game.choosePerk('${p.id}')">LERNEN</button>`;
                } else if (isMaxed) {
                    actionBtn = `<span class="text-green-700 font-bold text-xs border border-green-900 px-2 py-1">MAX</span>`;
                }

                div.innerHTML = `
                    <div class="flex items-center gap-3 flex-1">
                        <div class="text-3xl bg-green-900/20 w-12 h-12 flex items-center justify-center rounded border border-green-900">${p.icon}</div>
                        <div class="flex flex-col">
                            <span class="font-bold ${isMaxed ? 'text-yellow-600' : 'text-green-300'} text-lg">${p.name}</span>
                            <span class="text-xs text-gray-500">${p.desc}</span>
                            <div class="mt-1 tracking-widest">${levelBar}</div>
                        </div>
                    </div>
                    <div class="ml-2">
                        ${actionBtn}
                    </div>
                `;
                container.appendChild(div);
            });
        }

        if(scrollPos > 0) {
            requestAnimationFrame(() => {
                container.parentElement.scrollTop = scrollPos;
            });
        }
    }
});
