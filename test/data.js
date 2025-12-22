window.GameData = {
    // --- FARBPALETTE (NEON / HELL für ASCII auf Schwarz) ---
    colors: { 
        '.': '#8b7355',  // Boden (Braun-Hell)
        '_': '#eecfa1',  // Wüste (Sand)
        ',': '#228b22',  // Dschungelboden (Forest Green)
        ';': '#556b2f',  // Sumpf (Olive)
        '=': '#808080',  // Straße/Stadt (Grau)
        '#': '#d3d3d3',  // Mauer (Hellgrau)
        
        'M': '#a0522d',  // Berge (Sienna)
        'W': '#1e90ff',  // Wasser (Dodger Blue)
        '~': '#00ced1',  // Sumpfwasser (Dark Turquoise)
        
        't': '#32cd32',  // Kleiner Baum (Lime Green)
        'T': '#006400',  // Großer Baum (Dark Green)
        'x': '#8b4513',  // Toter Baum / Hindernis
        'o': '#696969',  // Stein
        
        'V': '#ffff00',  // Vault (Gelb)
        'C': '#00ffff',  // City (Cyan)
        
        // UI Colors
        'wasteland': '#8b7355', 
        'desert': '#eecfa1', 
        'jungle': '#228b22', 
        'city': '#808080', 
        'swamp': '#556b2f',
        'forest': '#228b22',
        'mountain': '#a0522d'
    },

    statLabels: { 'STR': 'STÄRKE', 'PER': 'WAHRNEHMUNG', 'END': 'AUSDAUER', 'INT': 'INTELLIGENZ', 'AGI': 'BEWEGLICHKEIT', 'LUC': 'GLÜCK' },

    // --- BIOME (Definiert die Zeichen) ---
    biomes: {
        'wasteland': { 
            ground: '.', water: 0.02, mountain: 0.03,
            features: [ { char: 'o', prob: 0.02, solid: true }, { char: 'x', prob: 0.03, solid: false }, { char: 't', prob: 0.01, solid: true } ]
        },
        'forest': { 
            ground: ',', water: 0.05, mountain: 0.05,
            features: [ { char: 'T', prob: 0.15, solid: true }, { char: 't', prob: 0.20, solid: true }, { char: 'o', prob: 0.05, solid: true } ]
        },
        'desert': { 
            ground: '_', water: 0.01, mountain: 0.10,
            features: [ { char: 'o', prob: 0.05, solid: true }, { char: 'x', prob: 0.02, solid: false } ]
        },
        'city': { 
            ground: '=', water: 0.0, mountain: 0.0,
            features: [ { char: '#', prob: 0.15, solid: true }, { char: 'o', prob: 0.05, solid: true } ]
        },
        'swamp': { 
            ground: ';', water: 0.20, mountain: 0.0,
            features: [ { char: '~', prob: 0.15, solid: false }, { char: 'x', prob: 0.10, solid: false }, { char: 't', prob: 0.05, solid: true } ]
        },
        'mountain': {
            ground: '.', water: 0.0, mountain: 0.40,
            features: [ { char: 'M', prob: 0.20, solid: true }, { char: 'o', prob: 0.20, solid: true } ]
        },
        'vault': { ground: '.', water: 0, mountain: 0, features: [] } // Safe Zone
    },

    hackWords: {
        easy: ["PASS", "CODE", "HACK", "DATA", "BIOS", "BOOT", "DISK", "FILE", "LOAD", "SAVE", "EXIT", "USER", "LOCK", "KEYS", "WIFI", "NODE"],
        medium: ["SERVER", "ACCESS", "SYSTEM", "ROUTER", "MEMORY", "CONFIG", "STATUS", "REBOOT", "UPDATE", "KERNEL", "SCRIPT", "SEARCH", "SIGNAL", "TARGET", "MATRIX", "BYPASS"],
        hard: ["FIREWALL", "PROTOCOL", "PASSWORD", "DATABASE", "SECURITY", "DOWNLOAD", "TERMINAL", "MAINFRAME", "OVERRIDE", "HARDWARE", "SOFTWARE", "ENCRYPTION", "NETWORK", "BACKDOOR"]
    },

    items: { 
        stimpack: { name: "Stimpack", type: "consumable", effect: "heal", val: 50, cost: 25 },
        meat_roach: { name: "Kakerlakenfleisch", type: "junk", cost: 2 },
        meat_mole: { name: "Rattenfleisch", type: "junk", cost: 4 },
        meat_fly: { name: "Blähfliegen-Düse", type: "junk", cost: 3 },
        meat_lurk: { name: "Softshell-Fleisch", type: "junk", cost: 15 },
        meat_scorp: { name: "Skorpion-Drüse", type: "junk", cost: 12 },
        hide_yao: { name: "Yao Guai Leder", type: "junk", cost: 25 },
        scrap_metal: { name: "Metallschrott", type: "component", cost: 1 },
        adhesive: { name: "Wunderkleber", type: "component", cost: 10 },
        screws: { name: "Schrauben", type: "component", cost: 5 },
        gears: { name: "Zahnräder", type: "component", cost: 8 },
        springs: { name: "Federn", type: "component", cost: 8 },
        circuitry: { name: "Schaltkreise", type: "component", cost: 20 },
        nuclear_mat: { name: "Nukleares Material", type: "component", cost: 35 },
        legendary_part: { name: "★ Legendäres Modul", type: "rare", cost: 100 },
        
        fists: { name: "Fäuste", slot: 'weapon', type: 'weapon', baseDmg: 2, bonus: {}, cost: 0, requiredLevel: 0, isRanged: false }, 
        vault_suit: { name: "Vault-Anzug", slot: 'body', type: 'body', bonus: { END: 1 }, cost: 0, requiredLevel: 0 }, 
        knife: { name: "Kampfmesser", slot: 'weapon', type: 'weapon', baseDmg: 8, bonus: { STR: 1 }, cost: 15, requiredLevel: 1, isRanged: false }, 
        bat: { name: "Baseballschläger", slot: 'weapon', type: 'weapon', baseDmg: 12, bonus: { STR: 2 }, cost: 25, requiredLevel: 2, isRanged: false },
        bat_spiked: { name: "Nagelschläger", slot: 'weapon', type: 'weapon', baseDmg: 18, bonus: { STR: 2 }, cost: 50, requiredLevel: 3, isRanged: false },
        pistol: { name: "10mm Pistole", slot: 'weapon', type: 'weapon', baseDmg: 14, bonus: { AGI: 1 }, cost: 50, requiredLevel: 1, isRanged: true }, 
        pistol_tac: { name: "Taktische 10mm", slot: 'weapon', type: 'weapon', baseDmg: 20, bonus: { AGI: 2, PER: 1 }, cost: 100, requiredLevel: 4, isRanged: true },
        leather_armor: { name: "Lederharnisch", slot: 'body', type: 'body', bonus: { END: 2 }, cost: 30, requiredLevel: 1 }, 
        leather_armor_h: { name: "Gehärtetes Leder", slot: 'body', type: 'body', bonus: { END: 4 }, cost: 80, requiredLevel: 3 },
        shotgun: { name: "Kampfschrotflinte", slot: 'weapon', type: 'weapon', baseDmg: 24, bonus: { STR: 1 }, cost: 120, requiredLevel: 3, isRanged: true }, 
        rifle_hunting: { name: "Jagdgewehr", slot: 'weapon', type: 'weapon', baseDmg: 35, bonus: { PER: 2 }, cost: 180, requiredLevel: 4, isRanged: true },
        laser_rifle: { name: "Laser-Gewehr", slot: 'weapon', type: 'weapon', baseDmg: 30, bonus: { PER: 2, INT: 1 }, cost: 300, requiredLevel: 5, isRanged: true }, 
        combat_armor: { name: "Kampf-Rüstung", slot: 'body', type: 'body', bonus: { END: 4 }, cost: 150, requiredLevel: 5 },
        metal_armor: { name: "Metall-Rüstung", slot: 'body', type: 'body', bonus: { END: 6, AGI: -1 }, cost: 250, requiredLevel: 7 },
        power_fist: { name: "Powerfaust", slot: 'weapon', type: 'weapon', baseDmg: 45, bonus: { STR: 3 }, cost: 400, requiredLevel: 8, isRanged: false },
        plasma_rifle: { name: "Plasma-Gewehr", slot: 'weapon', type: 'weapon', baseDmg: 55, bonus: { PER: 2, INT: 2 }, cost: 600, requiredLevel: 10, isRanged: true }
    },

    monsters: { 
        radRoach: { name: "Rad-Kakerlake", hp: 15, dmg: 3, xp: [10, 15], loot: 1, minLvl: 1, drops: [{id:'meat_roach', c:0.6}] }, 
        bloatfly: { name: "Blähfliege", hp: 10, dmg: 5, xp: [12, 18], loot: 2, minLvl: 1, drops: [{id:'meat_fly', c:0.7}, {id:'nuclear_mat', c:0.05}] },
        moleRat: { name: "Maulwurfsratte", hp: 25, dmg: 6, xp: [15, 25], loot: 3, minLvl: 1, drops: [{id:'meat_mole', c:0.5}] }, 
        wildDog: { name: "Wilder Hund", hp: 40, dmg: 9, loot: 0, xp: [30, 50], minLvl: 2, drops: [{id:'meat_mole', c:0.4}] }, 
        mutantRose: { name: "Mutanten-Pflanze", hp: 45, dmg: 15, loot: 5, xp: [45, 60], minLvl: 1, drops: [{id:'adhesive', c:0.4}] }, 
        radScorpion: { name: "Radskorpion", hp: 90, dmg: 18, loot: 15, xp: [80, 100], minLvl: 3, drops: [{id:'meat_scorp', c:0.5}, {id:'nuclear_mat', c:0.1}] },
        raider: { name: "Raider", hp: 60, dmg: 12, loot: 20, xp: [50, 70], minLvl: 2, drops: [{id:'stimpack', c:0.15}, {id:'scrap_metal', c:0.3}] }, 
        ghoul: { name: "Wilder Ghul", hp: 50, dmg: 10, loot: 5, xp: [40, 60], minLvl: 2, drops: [{id:'nuclear_mat', c:0.1}] }, 
        mirelurk: { name: "Mirelurk", hp: 110, dmg: 20, loot: 10, xp: [90, 120], minLvl: 4, drops: [{id:'meat_lurk', c:0.8}, {id:'adhesive', c:0.3}] },
        protectron: { name: "Protectron", hp: 130, dmg: 15, loot: 30, xp: [100, 140], minLvl: 4, drops: [{id:'scrap_metal', c:1.0}, {id:'circuitry', c:0.4}] },
        yaoGuai: { name: "Yao Guai", hp: 180, dmg: 35, loot: 0, xp: [180, 250], minLvl: 6, drops: [{id:'hide_yao', c:1.0}, {id:'springs', c:0.3}] },
        sentryBot: { name: "Wachbot MK-II", hp: 250, dmg: 45, loot: 80, xp: [300, 400], minLvl: 8, drops: [{id:'scrap_metal', c:1.0}, {id:'gears', c:0.8}, {id:'nuclear_mat', c:0.5}] },
        deathclaw: { name: "Todesklaue", hp: 400, dmg: 70, loot: 100, xp: [600, 800], minLvl: 10, drops: [{id:'hide_yao', c:1.0}, {id:'gears', c:0.5}] } 
    },

    recipes: [
        { id: "stimpack", out: "stimpack", count: 1, req: { "meat_fly": 1, "adhesive": 1 }, lvl: 1 },
        { id: "ammo_pack", out: "AMMO", count: 15, req: { "scrap_metal": 2 }, lvl: 1 },
        { id: "bat_upgrade", out: "bat_spiked", count: 1, req: { "bat": 1, "scrap_metal": 5, "adhesive": 1 }, lvl: 2 },
        { id: "leather_upgrade", out: "leather_armor_h", count: 1, req: { "leather_armor": 1, "hide_yao": 2, "adhesive": 2 }, lvl: 3 },
        { id: "pistol_mod", out: "pistol_tac", count: 1, req: { "pistol": 1, "screws": 3, "gears": 2 }, lvl: 4 },
        { id: "laser_mod", out: "laser_rifle", count: 1, req: { "rifle_hunting": 1, "circuitry": 2, "nuclear_mat": 1 }, lvl: 6 }
    ]
};
