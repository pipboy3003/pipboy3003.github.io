# ☢️ PIP-BOY 3000 Mk-V Web-RPG

Ein browserbasiertes Retro-RPG im Fallout-Stil. Erkunde das Ödland, kämpfe gegen Mutanten, sammle Loot und verbessere deine S.P.E.C.I.A.L.-Attribute – alles verpackt in einem nostalgischen grünen Terminal-Interface.

---

## ⭐ Key Features

### 🖥️ UI & Design
* **CRT-Retro-Look:** Scanlines, grünes Phosphor-Design und flackernde Bildschirmeffekte.
* **Split-Screen Layout:**
    * **Links:** Interaktives Log & Status-Meldungen.
    * **Rechts:** Canvas-basierte Karte oder Kampfbildschirm.
* **Mobile Optimierung:** Responsives Design mit einem ein/ausblendbaren D-Pad Overlay für Touch-Steuerung.
* **Dynamische Views:** Nahtloses Umschalten zwischen Karte, Inventar, Wiki und Quest-Log ohne Neuladen der Seite.

### 🌍 Welt & Erkundung
* **Prozedurale Generierung:** Unendliche Weltkarte unterteilt in Sektoren (8x8 Grid global).
* **Biome:** Unterscheidung zwischen Ödland, Wüste (Sand), Dschungel (Grün) und Ruinenstädten.
* **Fog of War:** Erkundete Gebiete werden gespeichert, unbekannte sind schwarz.
* **Interaktive Orte:**
    * **Vault:** Startpunkt und sicherer Hafen (Gratis Heilung).
    * **Städte:** Händler für Waffen, Rüstung und Munition.
    * **Dungeons:** (z.B. Supermarkt) mit erhöhtem Risiko.
* **Visuelle Hinweise:** Pulsierende Marker für wichtige Orte (Vaults, Tore, Städte).

### ⚔️ Kampf & Gegner
* **Rundenbasiertes System:** Klassisches Angreifen oder Fliehen.
* **Gegner-Vielfalt:** Von Maulwurfsratten bis zu Todeskrallen, abhängig vom Biom und Level.
* **Legendäres System:**
    * **15% Chance:** Gegner können als "Legendär" erscheinen (stärker, besserer Loot).
    * **Würfel-Minigame:** Nach dem Sieg über einen legendären Gegner erscheint ein 3-Würfel-Overlay.
    * **Belohnungen:** Kronkorken, Munition oder der mächtige "Overdrive"-Buff.

### 📈 RPG-Mechaniken
* **S.P.E.C.I.A.L. Stats:** Stärke, Wahrnehmung, Ausdauer etc. beeinflussen Kampfwerte und HP.
* **Leveling:** XP-System mit Level-Ups, die Skill-Punkte gewähren.
* **Wirtschaft:** Kronkorken (Caps) als Währung für Heilung und Ausrüstung.
* **Buffs:** Zeitbasierte Effekte (z.B. Overdrive), die in Echtzeit ablaufen.

---

## 🚀 Installation & Start
1. Alle Dateien in einen Ordner laden.
2. `index.html` im Browser öffnen.
3. (Optional) Für korrekte Darstellung der `views` sollte ein lokaler Server verwendet werden (z.B. VS Code Live Server), da manche Browser lokale Fetch-Requests blockieren.

