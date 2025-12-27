// [v0.7.0]
if(typeof window.GameData === 'undefined') window.GameData = {};

Object.assign(window.GameData.items, {
    // ... (Alte Items bleiben, hier nur die neuen/angepassten)
    
    // --- BLUEPRINTS ---
    bp_ammo: { name: "Bauplan: Munition", type: "blueprint", recipeId: "craft_ammo", cost: 50, desc: "Lerne Munition herzustellen." },
    bp_stimpack: { name: "Bauplan: Stimpack", type: "blueprint", recipeId: "craft_stimpack", cost: 100, desc: "Medizinische Grundlagen." },
    bp_rusty_pistol: { name: "Bauplan: Rostige Pistole", type: "blueprint", recipeId: "craft_rusty_pistol", cost: 80, desc: "Besser als nichts." },
    bp_leather_armor: { name: "Bauplan: Lederrüstung", type: "blueprint", recipeId: "craft_leather", cost: 120, desc: "Schutz für Ödland-Wanderer." },
    bp_metal_armor: { name: "Bauplan: Metallrüstung", type: "blueprint", recipeId: "craft_metal", cost: 250, desc: "Schweres Blech." },
    bp_machete: { name: "Bauplan: Machete", type: "blueprint", recipeId: "craft_machete", cost: 150, desc: "Scharfer Stahl." },
    
    // Bestehende Items (Auszug zur Sicherheit, falls überschrieben wird)
    // Bitte sicherstellen, dass die vorherigen Items (fists, stimpack, etc.) hier auch stehen oder die Datei nur ergänzt wird.
    // Hier füge ich nur die wichtigsten hinzu, damit der Code läuft:
    
    fists: { name: "Fäuste", type: "weapon", slot: "weapon", baseDmg: 2, cost: 0, desc: "Deine bloßen Hände." },
    rusty_knife: { name: "Rostiges Messer", type: "weapon", slot: "weapon", baseDmg: 4, cost: 10, desc: "Alt, aber spitz." },
    rusty_pistol: { name: "Rostige Pistole", type: "weapon", slot: "weapon", baseDmg: 6, cost: 25, desc: "Klemmt manchmal." },
    machete: { name: "Machete", type: "weapon", slot: "weapon", baseDmg: 12, cost: 80, desc: "Rostige Klinge." }, // NEU für Crafting
    
    stimpack: { name: "Stimpack", type: "consumable", effect: "heal", val: 40, cost: 50, desc: "Heilt 40 HP." },
    junk_metal: { name: "Schrottmetall", type: "junk", cost: 2, desc: "Rostiges Metall." },
    screws: { name: "Schrauben", type: "component", cost: 5, desc: "Wichtig für Reparaturen." },
    duct_tape: { name: "Klebeband", type: "component", cost: 8, desc: "Hält die Welt zusammen." },
    leather: { name: "Lederstücke", type: "component", cost: 5, desc: "Von Tieren." },
    gunpowder: { name: "Schwarzpulver", type: "component", cost: 10, desc: "Explosiv." },
    
    // ... (Rest der Items aus v0.5.0)
});

if(typeof Game !== 'undefined') Game.items = window.GameData.items;
