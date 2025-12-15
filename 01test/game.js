// ... innerhalb von const Game = { ...
    
    // NEUE FUNKTION: Teleportiert den Spieler hart zu Koordinaten
    teleportTo: function(targetSector, tx, ty) {
        // Sektor setzen
        this.state.sector = targetSector;
        // Map laden (ohne Dungeon Mode, also false)
        this.loadSector(targetSector.x, targetSector.y);
        
        // Koordinaten setzen
        this.state.player.x = tx;
        this.state.player.y = ty;
        
        // Fog of War aufdecken
        this.reveal(tx, ty);
        
        // Netzwerk Update sofort senden
        if(typeof Network !== 'undefined') {
            Network.sendMove(tx, ty, this.state.lvl, this.state.sector);
        }
        
        UI.update();
        UI.log(`Teleport erfolgreich: Sektor ${targetSector.x},${targetSector.y}`, "text-green-400");
    },
    
    // ... restliche Funktionen ...
