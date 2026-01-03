// [v4.3] - 2026-01-03 07:00pm (Render Fixes)
// - FIX: Alle Map-Objekte (Zäune, Steine, Säulen) wieder sichtbar gemacht.
// - FIX: Emojis durch Canvas-Pixel-Art ersetzt (keine "Schatten-Bugs" mehr).
// - GFX: Spieler-Sprite Kontrast erhöht.

Object.assign(Game, {
    gameTileset: null,
    particles: [],
    lightningIntensity: 0,

    // --- TILES GENERATOR ---
    generateGameTileset: function() {
        if (this.gameTileset) return this.gameTileset;
        const TILE = 32;
        const cvs = document.createElement('canvas');
        cvs.width = TILE * 20; cvs.height = TILE; 
        const ctx = cvs.getContext('2d');

        const rect = (x, y, w, h, c) => { ctx.fillStyle=c; ctx.fillRect(x,y,w,h); };
        const noise = (x, c) => {
            rect(x,0,32,32,c);
            for(let i=0; i<30; i++) rect(x+Math.random()*32, Math.random()*32, 2, 2, Math.random()>0.5?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)');
        };

        // 0: ERDE
        noise(0, '#4e342e'); rect(5,5,4,4,'#3e2723');

        // 1: WAND (#)
        noise(32, '#263238'); rect(32,0,32,2,'#000'); rect(32,0,2,32,'#000'); rect(40,10,16,12,'#1a2327');

        // 2: BAUM (t)
        ctx.clearRect(64,0,32,32); rect(76,18,8,14,'#3e2723'); 
        ctx.fillStyle='#1b5e20'; ctx.beginPath(); ctx.arc(80,14,12,0,7); ctx.fill(); 

        // 3: TOTER BAUM (T)
        ctx.clearRect(96,0,32,32); rect(110,20,4,12,'#3e2723');
        ctx.strokeStyle='#3e2723'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(112,20); ctx.lineTo(104,10); ctx.stroke(); ctx.moveTo(112,22); ctx.lineTo(120,12); ctx.stroke();

        // 4: WASSER (~)
        noise(128, '#004d40'); rect(132,8,8,2,'#4db6ac'); rect(145,20,10,2,'#4db6ac');

        // 5: BERG (M)
        ctx.clearRect(160,0,32,32); ctx.fillStyle='#555'; ctx.beginPath(); ctx.moveTo(176,4); ctx.lineTo(190,30); ctx.lineTo(162,30); ctx.fill();

        // 6: KISTE (X)
        ctx.clearRect(192,0,32,32); rect(196,8,24,20,'#6d4c41'); ctx.strokeStyle='#3e2723'; ctx.lineWidth=2; ctx.strokeRect(196,8,24,20);
        ctx.beginPath(); ctx.moveTo(196,8); ctx.lineTo(220,28); ctx.stroke();

        // 7: STRASSE (=)
        noise(224, '#212121'); rect(238,12,4,8,'#fbc02d');

        // 8: ZAUN (x)
        ctx.clearRect(256,0,32,32); 
        ctx.fillStyle='#5d4037'; rect(258,10,2,14,'#5d4037'); rect(284,10,2,14,'#5d4037');
        rect(258,14,28,2,'#5d4037'); rect(258,20,28,2,'#5d4037');

        // 9: STEIN (o)
        ctx.clearRect(288,0,32,32); ctx.fillStyle='#757575'; ctx.beginPath(); ctx.arc(304,24,6,0,7); ctx.fill();

        // 10: SÄULE (|)
        ctx.clearRect(320,0,32,32); rect(328,4,16,28,'#37474f'); rect(332,8,8,20,'#263238');

        // 11: TÜR (+)
        rect(352,0,32,32,'#4e342e'); rect(356,4,24,24,'#8d6e63'); ctx.fillStyle='#ffd600'; ctx.beginPath(); ctx.arc(376,16,2,0,7); ctx.fill();

        // ICONS (Pixel Art)
        // 12: VAULT (V)
        ctx.clearRect(384,0,32,32); ctx.fillStyle='#222'; ctx.beginPath(); ctx.arc(400,16,12,0,7); ctx.fill();
        ctx.strokeStyle='#ffeb3b'; ctx.lineWidth=2; ctx.stroke(); ctx.fillStyle='#ffeb3b'; ctx.font="10px monospace"; ctx.fillText("101", 392, 20);

        // 13: RUSTY SPRINGS (R)
        ctx.clearRect(416,0,32,32); rect(418,10,28,14,'#b71c1c'); rect(422,14,20,6,'#fff');
        
        // 14: CLINIC (P)
        ctx.clearRect(448,0,32,32); rect(452,6,24,20,'#eee'); rect(462,10,4,12,'#f00'); rect(458,14,12,4,'#f00');

        // 15: SHOP ($)
        ctx.clearRect(480,0,32,32); rect(484,8,24,18,'#5d4037'); rect(492,20,8,6,'#ffd700');

        this.gameTileset = cvs;
        return cvs;
    },

    // --- RENDER LOOP ---
    draw: function() { 
        if(!this.ctx || !this.cacheCanvas || !this.state.currentMap) return;
        const ctx = this.ctx; const cvs = ctx.canvas;
        
        let tx = (this.state.player.x * this.TILE) - (cvs.width / 2); 
        let ty = (this.state.player.y * this.TILE) - (cvs.height / 2); 
        this.camera.x += (tx - this.camera.x) * 0.1; 
        this.camera.y += (ty - this.camera.y) * 0.1;
        this.camera.x = Math.max(0, Math.min(this.camera.x, (this.MAP_W * this.TILE) - cvs.width)); 
        this.camera.y = Math.max(0, Math.min(this.camera.y, (this.MAP_H * this.TILE) - cvs.height)); 

        this.renderWorldLayer(ctx, cvs);
        this.renderAtmosphere(ctx, cvs);
        this.renderHUD(ctx, cvs);
    },

    renderWorldLayer: function(ctx, cvs) {
        if(!this.staticCacheCreated) { this.renderStaticMap(); this.staticCacheCreated = true; }
        
        ctx.fillStyle = "#050505"; ctx.fillRect(0, 0, cvs.width, cvs.height); 
        ctx.imageSmoothingEnabled = false;

        const cx = Math.floor(this.camera.x); const cy = Math.floor(this.camera.y);
        ctx.drawImage(this.cacheCanvas, cx, cy, cvs.width, cvs.height, 0, 0, cvs.width, cvs.height);

        ctx.save(); ctx.translate(-cx, -cy);
        this.drawDynamicObjects(ctx);
        this.drawPlayerSprite(ctx);
        ctx.restore();
    },

    renderStaticMap: function() {
        if(!this.cacheCtx) this.initCache();
        const ctx = this.cacheCtx;
        const tiles = this.generateGameTileset();
        ctx.fillStyle = "#111"; ctx.fillRect(0, 0, this.cacheCanvas.width, this.cacheCanvas.height);

        for(let y=0; y<this.MAP_H; y++) {
            for(let x=0; x<this.MAP_W; x++) {
                if(!this.state.currentMap[y]) continue;
                const t = this.state.currentMap[y][x];
                const px = x*32, py = y*32;
                
                // BODEN
                if(['=','+'].includes(t)) ctx.drawImage(tiles, 7*32,0,32,32,px,py,32,32);
                else if(t==='~' || t==='W') ctx.drawImage(tiles, 4*32,0,32,32,px,py,32,32);
                else ctx.drawImage(tiles, 0,0,32,32,px,py,32,32);

                // OBJEKTE
                let idx = -1;
                if(t==='#') idx=1; else if(t==='t') idx=2; else if(t==='T') idx=3; 
                else if(t==='M') idx=5; else if(t==='X') idx=6;
                else if(t==='x') idx=8; else if(t==='o') idx=9; 
                else if(t==='|') idx=10; else if(t==='+') idx=11;

                if(idx >= 0) ctx.drawImage(tiles, idx*32, 0, 32, 32, px, py, 32, 32);
            }
        }
    },

    drawDynamicObjects: function(ctx) {
        const tiles = this.generateGameTileset();
        const sx=Math.floor(this.camera.x/32); const ex=sx+25;
        const sy=Math.floor(this.camera.y/32); const ey=sy+20;

        for(let y=sy; y<ey; y++) {
            for(let x=sx; x<ex; x++) {
                if(y<0||y>=this.MAP_H||x<0||x>=this.MAP_W) continue;
                const t = this.state.currentMap[y][x];
                const px = x*32, py = y*32;
                
                let idx = -1;
                if(t==='V') idx=12; if(t==='R') idx=13; if(t==='P') idx=14; if(t==='$') idx=15;
                
                if(idx >= 0) {
                    const bounce = Math.sin(Date.now()/300)*2;
                    ctx.drawImage(tiles, idx*32, 0, 32, 32, px, py + bounce, 32, 32);
                }
                if(this.state.hiddenItems && this.state.hiddenItems[`${x},${y}`]) {
                    ctx.fillStyle = `rgba(255,215,0,${0.5+Math.sin(Date.now()/100)*0.5})`;
                    ctx.beginPath(); ctx.arc(px+16, py+16, 3, 0, 7); ctx.fill();
                }
            }
        }
    },

    drawPlayerSprite: function(ctx) {
        const px = this.state.player.x * 32 + 16;
        const py = this.state.player.y * 32 + 16;
        const bounce = Math.sin(Date.now() / 150) * 2;
        
        ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.beginPath(); ctx.ellipse(px, py+14, 10, 5, 0, 0, 7); ctx.fill();

        ctx.translate(px, py + bounce);
        ctx.fillStyle = "#0055ff"; ctx.fillRect(-8, -8, 16, 16); 
        ctx.fillStyle = "#ffdd00"; ctx.fillRect(-2, -8, 4, 16); 
        ctx.fillStyle = "#ffccaa"; ctx.fillRect(-7, -18, 14, 10); 
        ctx.fillStyle = "#222"; ctx.fillRect(-6, 8, 4, 6); ctx.fillRect(2, 8, 4, 6);
        ctx.translate(-px, -(py + bounce));
    },

    renderAtmosphere: function(ctx, cvs) {
        const light = Game.getAmbientLight ? Game.getAmbientLight() : 1.0;
        
        ctx.globalCompositeOperation = 'multiply';
        const darkness = 1.0 - Math.max(0.2, light); 
        ctx.fillStyle = `rgba(0, 10, 25, ${darkness})`; 
        ctx.fillRect(0, 0, cvs.width, cvs.height);

        ctx.globalCompositeOperation = 'destination-out';
        const lamp = (x,y,r) => {
            const px=(x*32+16)-this.camera.x, py=(y*32+16)-this.camera.y;
            const g=ctx.createRadialGradient(px,py,0,px,py,r);
            g.addColorStop(0,"rgba(255,255,255,1)"); g.addColorStop(1,"rgba(255,255,255,0)");
            ctx.fillStyle=g; ctx.beginPath(); ctx.arc(px,py,r,0,7); ctx.fill();
        };

        lamp(this.state.player.x, this.state.player.y, 140);
        
        const sx=Math.floor(this.camera.x/32), ex=sx+25, sy=Math.floor(this.camera.y/32), ey=sy+20;
        for(let y=sy; y<ey; y++) {
            for(let x=sx; x<ex; x++) {
                if(y>=0 && y<this.MAP_H && x>=0 && x<this.MAP_W) {
                    const t = this.state.currentMap[y][x];
                    if(['C','$','P','V','R'].includes(t)) lamp(x,y,100);
                }
            }
        }
        
        ctx.globalCompositeOperation = 'source-over';
        this.renderParticles(ctx, cvs, Game.state.weather);
    },

    renderParticles: function(ctx, cvs, w) {
        if(this.particles.length < 50) this.particles.push({x:Math.random()*cvs.width, y:Math.random()*cvs.height, s:Math.random()+1});
        ctx.fillStyle = (w==='rain') ? 'rgba(150,150,255,0.5)' : 'rgba(200,200,150,0.3)';
        this.particles.forEach(p => {
            p.y += (w==='rain') ? 10 : 0.5; p.x -= 0.5;
            if(p.y>cvs.height) { p.y=-10; p.x=Math.random()*cvs.width; }
            ctx.fillRect(p.x, p.y, (w==='rain'?1:2), (w==='rain'?6:2));
        });
    },

    renderHUD: function(ctx, cvs) {
        ctx.fillStyle = "rgba(0, 255, 0, 0.03)";
        for(let i=0; i<cvs.height; i+=3) ctx.fillRect(0, i, cvs.width, 1);
        
        if(Game.getTimeString) {
            ctx.font = "bold 16px monospace"; ctx.textAlign = "right";
            ctx.fillStyle = "rgba(0,0,0,0.8)"; ctx.fillText(Game.getTimeString(), cvs.width-8, 26);
            ctx.fillStyle = "#39ff14"; ctx.fillText(Game.getTimeString(), cvs.width-10, 24);
        }
    }
});
