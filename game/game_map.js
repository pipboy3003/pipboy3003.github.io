// [2026-02-21 22:50:00] game_map.js - POI Discovery Hook

Object.assign(Game, {
    reveal: function(px, py) { 
        if(!this.state) return; 
        if(!this.state.explored) this.state.explored = {}; 
        
        // NEU: Tracker für entdeckte Orte auf der Weltkarte
        if(!this.state.discoveredPOIs) this.state.discoveredPOIs = {};
        
        const r = 3; 
        const sx = this.state.sector.x;
        const sy = this.state.sector.y;
        const sk = `${sx},${sy}`; 

        for(let y = py - r; y <= py + r; y++) {
            for(let x = px - r; x <= px + r; x++) {
                if(x >= 0 && x < this.MAP_W && y >= 0 && y < this.MAP_H) {
                    const key = `${sk}_${x},${y}`;
                    const tile = this.state.currentMap[y][x];
                    
                    if (!this.state.explored[key]) {
                        this.state.explored[key] = tile;
                    }
                    
                    // NEU: Wenn es ein wichtiges Gebäude ist, in Liste eintragen
                    if (['V', 'C', 'G', 'S', 'H', 'A', 'R'].includes(tile)) {
                        if (!this.state.discoveredPOIs[sk]) this.state.discoveredPOIs[sk] = [];
                        if (!this.state.discoveredPOIs[sk].includes(tile)) {
                            this.state.discoveredPOIs[sk].push(tile);
                            if(typeof UI !== 'undefined' && UI.log) UI.log("Neuen Ort auf Weltkarte verzeichnet!", "text-yellow-400 font-bold");
                            this.saveGame();
                        }
                    }
                }
            }
        }
    },

    move: function(dx, dy) {
        if(!this.state || this.state.isGameOver || this.state.view !== 'map' || this.state.inDialog) return;
        const nx = this.state.player.x + dx; const ny = this.state.player.y + dy;
        
        if(nx < 0 || nx >= this.MAP_W || ny < 0 || ny >= this.MAP_H) { this.changeSector(nx, ny); return; }

        const t = this.state.currentMap[ny][nx]; const pk = `${nx},${ny}`;

        if(this.state.hiddenItems && this.state.hiddenItems[pk]) {
            this.addToInventory(this.state.hiddenItems[pk], 1);
            if(typeof UI !== 'undefined') UI.log(`Gefunden!`, "text-yellow-400 font-bold"); 
            if(typeof UI !== 'undefined' && UI.shakeView) UI.shakeView(); 
            delete this.state.hiddenItems[pk];
        }

        if (t === 'X') { this.openChest(nx, ny); return; } 
        if (t === 'v') { this.descendDungeon(); return; }
        if (t === '?') { this.testMinigames(); return; } 

        if(['M', 'W', '#', 'U', 't', 'o', 'Y', '|', 'F', 'T', 'R', '^', '~'].includes(t) && t !== 'R' && t !== '+') { 
            if(this.state.hiddenItems && this.state.hiddenItems[pk]) { this.addToInventory(this.state.hiddenItems[pk], 1); delete this.state.hiddenItems[pk]; return; }
            if(typeof UI !== 'undefined' && UI.shakeView) UI.shakeView();
            if(['#', '^', '|'].includes(t) && this.spawnParticle) this.spawnParticle(nx, ny, 'rubble', 4);
            if(['M', 'W'].includes(t) && this.spawnParticle) this.spawnParticle(nx, ny, 'blood', 6);
            return; 
        }
        
        if(this.spawnParticle) this.spawnParticle(this.state.player.x, this.state.player.y, 'dust', 3);

        this.state.player.x = nx; this.state.player.y = ny;
        
        if(dx===1) this.state.player.rot=Math.PI/2; if(dx===-1) this.state.player.rot=-Math.PI/2;
        if(dy===1) this.state.player.rot=Math.PI; if(dy===-1) this.state.player.rot=0;

        this.reveal(nx, ny);
        
        if(typeof Network!=='undefined') Network.sendHeartbeat();

        if(t==='V') { 
            if(typeof UI !== 'undefined' && typeof UI.enterVault === 'function') {
                UI.enterVault(); 
            } else {
                if(typeof UI !== 'undefined') UI.log("Vault 101 erreicht", "text-yellow-400");
            }
            return; 
        }
        
        if(t==='C') { this.enterCity(); return; } 
        if(t==='S'||t==='H'||t==='A'||t==='R'||t==='K') { this.tryEnterDungeon(t==='S'?'market':(t==='H'?'cave':(t==='A'?'military':(t==='R'?'raider':'tower')))); return; }
        
        if(Math.random() < 0.03 && !['=', '+', 'V', 'C'].includes(t)) { this.startCombat(); return; }
        if(typeof UI !== 'undefined' && UI.update) UI.update();
    },

    changeSector: function(px, py) { 
        let sx=this.state.sector.x, sy=this.state.sector.y; let newPx=px, newPy=py;
        if(py<0){sy--;newPy=this.MAP_H-1;newPx=this.state.player.x;} else if(py>=this.MAP_H){sy++;newPy=0;newPx=this.state.player.x;}
        if(px<0){sx--;newPx=this.MAP_W-1;newPy=this.state.player.y;} else if(px>=this.MAP_W){sx++;newPx=0;newPy=this.state.player.y;}
        
        if(sx<0||sx>=this.WORLD_W||sy<0||sy>=this.WORLD_H){
            if(typeof UI !== 'undefined') UI.log("Ende der Welt.", "text-red-500");
            return;
        }
        
        this.state.sector = {x:sx, y:sy}; 
        this.loadSector(sx, sy); 
        this.state.player.x = newPx; 
        this.state.player.y = newPy;
        
        this.ensureWalkableSpawn(); 
        this.reveal(newPx, newPy); 
        this.saveGame();
        
        if(typeof this.updateQuestProgress === 'function') this.updateQuestProgress('visit', `${sx},${sy}`, 1);
        if(typeof UI !== 'undefined') UI.log(`Sektor: ${sx},${sy}`, "text-blue-400"); 
    },

    ensureWalkableSpawn: function() {
        if(!this.state||!this.state.currentMap) return;
        
        if(this.state.player.x < 0 || this.state.player.x >= this.MAP_W || 
           this.state.player.y < 0 || this.state.player.y >= this.MAP_H) {
            this.state.player.x = 25;
            this.state.player.y = 25;
        }

        const px=this.state.player.x; const py=this.state.player.y;
        for(let dy=-1; dy<=1; dy++) for(let dx=-1; dx<=1; dx++) {
            const tx=px+dx, ty=py+dy;
            if(tx>=0&&tx<this.MAP_W&&ty>=0&&ty<this.MAP_H) {
                const t=this.state.currentMap[ty][tx];
                if(['^', 'Y', 't', '~', '#'].includes(t)) this.state.currentMap[ty][tx] = '.';
            }
        }
        const ct = this.state.currentMap[py][px];
        if(ct === '~') this.state.currentMap[py][px] = '+';
    },

    loadSector: function(sx_in, sy_in) { 
        const sx=parseInt(sx_in), sy=parseInt(sy_in); const key=`${sx},${sy}`;
        if(this.state.worldSeed && typeof WorldGen!=='undefined') WorldGen.setSeed(this.state.worldSeed);
        
        if(!this.worldData[key]) {
            let biome='wasteland', map;
            if(typeof WorldGen!=='undefined') {
                biome = WorldGen.getSectorBiome(sx, sy);
                map = WorldGen.createSector(this.MAP_W, this.MAP_H, sx, sy);
            } else map=Array(this.MAP_H).fill().map(()=>Array(this.MAP_W).fill('.'));
            this.worldData[key]={layout:map, biome:biome};
        }
        this.state.currentMap = this.worldData[key].layout;
        if(!this.state.visitedSectors.includes(key)) this.state.visitedSectors.push(key);
        
        this.state.hiddenItems = {};
        if(Math.random() < 0.3) {
             let hx = Math.floor(Math.random()*this.MAP_W);
             let hy = Math.floor(Math.random()*this.MAP_H);
             if(['t','#'].includes(this.state.currentMap[hy][hx])) this.state.hiddenItems[`${hx},${hy}`] = 'screws';
        }

        let zn = "Ödland";
        const bd = this.worldData[key].biome;
        if(bd === 'forest') zn = "Verstrahlter Wald";
        if(bd === 'swamp') zn = "Todes-Sümpfe";
        if(bd === 'desert') zn = "Die Glühende See";
        if(bd === 'mountain') zn = "Felsengebirge";
        this.state.zone = `${zn} (${sx},${sy})`; 
        
        this.ensureWalkableSpawn(); 
        if(this.renderStaticMap) this.renderStaticMap(); 
        this.reveal(this.state.player.x, this.state.player.y);
    },
    
    tryEnterDungeon: function(t){const k=`${this.state.sector.x},${this.state.sector.y}_${t}`;const c=this.state.cooldowns?this.state.cooldowns[k]:0;if(c&&Date.now()<c){if(typeof UI!=='undefined')UI.showDungeonLocked(Math.ceil((c-Date.now())/60000));return;}if(typeof UI!=='undefined')UI.showDungeonWarning(()=>this.enterDungeon(t));},
    enterDungeon: function(t,l=1){if(l===1){this.state.savedPosition={x:this.state.player.x,y:this.state.player.y};this.state.sectorExploredCache=JSON.parse(JSON.stringify(this.state.explored));}this.state.dungeonLevel=l;this.state.dungeonType=t;if(typeof WorldGen!=='undefined'){WorldGen.setSeed((this.state.sector.x+1)*(this.state.sector.y+1)*Date.now()+l);const d=WorldGen.generateDungeonLayout(this.MAP_W,this.MAP_H);this.state.currentMap=d.map;this.state.player.x=d.startX;this.state.player.y=d.startY;if(l<3)for(let y=0;y<this.MAP_H;y++)for(let x=0;x<this.MAP_W;x++)if(this.state.currentMap[y][x]==='X')this.state.currentMap[y][x]='v';}this.state.zone="Dungeon";this.state.explored={};this.reveal(this.state.player.x,this.state.player.y);if(this.renderStaticMap)this.renderStaticMap();if(typeof UI!=='undefined')UI.update();},
    descendDungeon: function(){this.enterDungeon(this.state.dungeonType,this.state.dungeonLevel+1);if(typeof UI!=='undefined'){UI.shakeView();UI.log("Tiefer...","text-purple-400");}},
    openChest: function(x,y){if(this.state.dungeonLevel>=3){if(typeof UI!=='undefined')UI.startMinigame('memory',()=>this.forceOpenChest(x,y));return;}this.forceOpenChest(x,y);},
    forceOpenChest: function(x,y){this.state.currentMap[y][x]='B';if(this.renderStaticMap)this.renderStaticMap();const m=this.state.dungeonLevel||1;this.state.caps+=(100*m);this.addToInventory('legendary_part',1);if(Math.random()<0.5)this.addToInventory('stimpack',1);if(typeof UI!=='undefined')UI.showDungeonVictory(100*m,m);setTimeout(()=>this.leaveCity(),4000);},
    leaveCity: function(){this.state.view='map';this.state.dungeonLevel=0;if(this.state.savedPosition){this.state.player.x=this.state.savedPosition.x;this.state.player.y=this.state.savedPosition.y;this.state.savedPosition=null;}if(typeof UI!=='undefined')UI.switchView('map').then(()=>{if(this.renderStaticMap)this.renderStaticMap();});},
    
    enterCity: function() {
        this.state.savedPosition = { x: this.state.player.x, y: this.state.player.y };
        if (typeof UI !== 'undefined' && typeof UI.enterCityCinematic === 'function') {
            UI.enterCityCinematic(() => {
                this.state.view = 'city';
                this.saveGame();
                UI.switchView('city').then(() => { if(UI.renderCity) UI.renderCity(); });
            });
        } else {
            this.state.view = 'city';
            this.saveGame();
            if(typeof UI !== 'undefined') UI.switchView('city').then(() => { if(UI.renderCity) UI.renderCity(); });
        }
    },
    
    testMinigames: function(){if(UI.els.dialog){UI.els.dialog.style.display='flex';UI.els.dialog.innerHTML='<div class="bg-black text-white p-4 border border-green-500"><button onclick="UI.startMinigame(\'hacking\')">HACK</button><button onclick="UI.els.dialog.style.display=\'none\'">X</button></div>';}}
});
