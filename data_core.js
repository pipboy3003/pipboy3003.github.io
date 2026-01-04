// [v2.0.0] - 2026-01-05 12:55pm (Data Core Update)
window.GameData = window.GameData || {};

// --- PERKS (NEU v2.0) ---
window.GameData.perks = [
    { 
        id: 'toughness', 
        name: 'Härte', 
        icon: '🛡️', 
        maxRank: 5,
        desc: (rank) => `Erhöht max. HP um +${rank * 20}.` 
    },
    { 
        id: 'medic', 
        name: 'Feldsanitäter', 
        icon: '💉', 
        maxRank: 5,
        desc: (rank) => `Stimpacks und Essen heilen +${rank * 20}% mehr.` 
    },
    { 
        id: 'gun_nut', 
        name: 'Waffennarr', 
        icon: '🔫', 
        maxRank: 5,
        desc: (rank) => `Fernkampfwaffen verursachen +${rank * 10}% Schaden.` 
    },
    { 
        id: 'scrapper', 
        name: 'Schrottsammler', 
        icon: '⚙️', 
        maxRank: 5,
        desc: (rank) => `Beim Zerlegen erhältst du +${rank} zusätzliche Materialien.` 
    },
    { 
        id: 'strong_back', 
        name: 'Packesel', 
        icon: '🎒', 
        maxRank: 5,
        desc: (rank) => `Inventarkapazität +${rank * 2} Plätze.` 
    },
    { 
        id: 'commando', 
        name: 'Kommando', 
        icon: '💥', 
        maxRank: 5,
        desc: (rank) => `Kritische Trefferchance +${rank * 5}%.` 
    },
    { 
        id: 'rad_resistant', 
        name: 'Bleimagen', 
        icon: '☢️', 
        maxRank: 5,
        desc: (rank) => `Strahlungsschaden aus der Umwelt -${rank * 10}%.` 
    },
    { 
        id: 'fortune_finder', 
        name: 'Schnorrer', 
        icon: '💰', 
        maxRank: 5,
        desc: (rank) => `Findest +${rank * 10}% mehr Kronkorken in Kämpfen.` 
    },
    { 
        id: 'barter', 
        name: 'Meisterhändler', 
        icon: '🤝', 
        maxRank: 5,
        desc: (rank) => `Verkaufspreise beim Händler +${rank * 10}%.` 
    },
    { 
        id: 'survivalist', 
        name: 'Überlebenskünstler', 
        icon: '⛺', 
        maxRank: 5,
        desc: (rank) => `Lager-Regeneration +${rank * 10}% effektiver.` 
    }
];

// --- QUESTS ---
window.GameData.questDefs = [
    { 
        id: "q_start", 
        title: "Überleben 101", 
        desc: "Das Ödland ist gefährlich. Töte kleine Biester um zu üben.", 
        type: "kill", 
        target: "radRoach", 
        amount: 3, 
        minLvl: 1, 
        reward: { xp: 50, caps: 25 } 
    },
    { 
        id: "q_explore", 
        title: "Zivilisation?", 
        desc: "Finde die Handelsstadt Rusty Springs bei den Koordinaten [3,3].", 
        type: "visit", 
        target: "3,3", 
        amount: 1, 
        minLvl: 1, 
        reward: { xp: 100, caps: 50, items: [{id:'stimpack', c:2}] } 
    },
    { 
        id: "q_hunter", 
        title: "Plagenbeseitigung", 
        desc: "Blähfliegen übertragen Krankheiten. Lösche sie aus.", 
        type: "kill", 
        target: "bloatfly", 
        amount: 5, 
        minLvl: 2, 
        reward: { xp: 150, caps: 60, items: [{id:'radaway', c:1}] } 
    },
    { 
        id: "q_collect", 
        title: "Schrottsammler", 
        desc: "Sammle Schrottmetall, um dein Lager auszubauen.", 
        type: "collect", 
        target: "junk_metal", 
        amount: 10, 
        minLvl: 3, 
        reward: { xp: 200, items: [{id:'bp_machete', c:1}] } 
    },
    { 
        id: "q_raider", 
        title: "Gesetzeshüter", 
        desc: "Raider bedrohen die Handelsrouten. Zeig ihnen das Gesetz.", 
        type: "kill", 
        target: "raider", 
        amount: 5, 
        minLvl: 4, 
        reward: { xp: 300, caps: 150, items: [{id:'combat_armor', c:1}] } 
    }
];

// --- FARBPALETTE ---
window.GameData.colors = { 
    '.':'#2d241b', '_':'#4a4036', ',':'#1a261a', ';':'#1e1e11', '=':'#333333', 
    '#':'#555', 
    'line_default': '#2a5a2a', 'line_wall': '#39ff14', 
    'V': '#39ff14', 'C': '#eab308', 'S': '#ff0000', 'G': '#00ffff', 'H': '#888888', 
    '^': '#111', 'v':'#111', '<':'#111', '>':'#111',
    'M': '#3e2723', 'W': '#0d47a1', '~': '#2f4f2f', 
    't': '#1b5e20', 'T': '#0a3d0a', 'x': '#8b4513', 'o': '#808080',
    '+': '#666666', '"': '#3cb371', 'Y': '#deb887', 'U': '#212121',
    'A': '#cc0000', 'K': '#00bfff',
    '$': '#ffd700', '&': '#ff8c00', 'P': '#ff3333', 'E': '#39ff14', 'F': '#00bfff', '|': '#777',
    'X': '#ff00ff', 
    'wasteland': '#5d5345', 'desert': '#eecfa1', 'jungle': '#1a3300', 'city': '#555555', 'swamp': '#1e1e11'
};

// --- TEXTE ---
window.GameData.statLabels = { 'STR': 'STÄRKE', 'PER': 'WAHRNEHMUNG', 'END': 'AUSDAUER', 'INT': 'INTELLIGENZ', 'AGI': 'BEWEGLICHKEIT', 'LUC': 'GLÜCK' };

// --- BIOME ---
window.GameData.biomes = {
    'wasteland': { 
        ground: '.', water: 0.02, mountain: 0.03,
        features: [ { char: 'o', prob: 0.02, solid: true }, { char: 'x', prob: 0.03, solid: false }, { char: 't', prob: 0.01, solid: true } ]
    },
    'jungle': { 
        ground: ',', water: 0.08, mountain: 0.05,
        features: [ { char: 'T', prob: 0.08, solid: true }, { char: 't', prob: 0.15, solid: true }, { char: '"', prob: 0.15, solid: false } ]
    },
    'desert': { 
        ground: '_', water: 0.01, mountain: 0.10,
        features: [ { char: 'o', prob: 0.02, solid: true }, { char: 'Y', prob: 0.02, solid: true } ]
    },
    'city': { 
        ground: '=', water: 0.0, mountain: 0.0,
        features: [ { char: '#', prob: 0.10, solid: true }, { char: '+', prob: 0.08, solid: false }, { char: 'o', prob: 0.02, solid: true } ]
    },
    'swamp': { 
        ground: ';', water: 0.05, mountain: 0.0,
        features: [ { char: '~', prob: 0.10, solid: false }, { char: 'x', prob: 0.10, solid: false }, { char: 't', prob: 0.05, solid: true } ]
    }
};

// --- HACKING WORDS ---
window.GameData.hackWords = {
    easy: ["PASS", "CODE", "HACK", "DATA", "BIOS", "BOOT", "DISK", "FILE", "LOAD", "SAVE", "EXIT", "USER", "LOCK", "KEYS", "WIFI", "NODE"],
    medium: ["SERVER", "ACCESS", "SYSTEM", "ROUTER", "MEMORY", "CONFIG", "STATUS", "REBOOT", "UPDATE", "KERNEL", "SCRIPT", "SEARCH", "SIGNAL", "TARGET", "MATRIX", "BYPASS"],
    hard: ["FIREWALL", "PROTOCOL", "PASSWORD", "DATABASE", "SECURITY", "DOWNLOAD", "TERMINAL", "MAINFRAME", "OVERRIDE", "HARDWARE", "SOFTWARE", "ENCRYPTION", "NETWORK", "BACKDOOR"]
};

console.log("GameData Core loaded.");
