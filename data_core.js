// [v0.7.3]
window.GameData = window.GameData || {};

// --- PERKS (NEU) ---
window.GameData.perks = [
    { id: 'toughness', name: 'Zähigkeit', desc: '+20 Max HP dauerhaft.', icon: '🛡️' },
    { id: 'medic', name: 'Sanitäter', desc: 'Stimpacks heilen +50% mehr HP.', icon: '💉' },
    { id: 'fortune_finder', name: 'Schatzsucher', desc: 'Mehr Kronkorken in Loot.', icon: '💰' },
    { id: 'mysterious_stranger', name: 'Mysteriöser Fremder', desc: '10% Chance auf kritischen Treffer.', icon: '🕵️' }
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
    // City Tiles
    '$': '#ffd700', '&': '#ff8c00', 'P': '#ff3333', 'E': '#39ff14', 'F': '#00bfff', '|': '#777',
    'X': '#ff00ff', 
    // Map Colors
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
