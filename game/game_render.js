// [2026-02-17 12:00:00] game_render.js - Fixed Syntax Error

Object.assign(Game, {
    particles: [],

    initCache: function() {
        this.cacheCanvas = document.createElement('canvas');
        this.cacheCanvas.width = this.MAP_W * this.TILE;
        this.cacheCanvas.height = this.MAP_H * this.TILE;
        this.cacheCtx = this.cacheCanvas.getContext('2d'); 
    },

    pseudoRand: function(x, y) {
        return Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
    },

    spawnParticle: function(x, y, type, count = 5) {
        const ts = this.TILE; 
        const px = x * ts + ts/2; 
        const py = y * ts + ts/2;
        for(let i=0; i<count; i++) {
            this.particles.push({
                x: px + (Math.random()*10-5), 
                y: py + (Math.random()*10-5),
                vx: (Math.random()-0.5)*4, 
                vy: (Math.random()-0.5)*4,
                life: 1.0, 
                type: type,
                color: type==='blood'?'#d32f2f':(type==='dust'?'#a1887f':'#fff'),
                size: Math.random()*3+1, 
                decay: 0.05
            });
        }
    },

    updateParticles: function() {
        for(let i=this.particles.length-1; i>=0; i--) {
            let p = this.particles[i]; 
            p.x+=p.vx; 
            p.y+=p.vy; 
            p.life-=p.decay;
            if(p.life<=0) this.particles.splice(i,1);
        }
    },

    drawParticles: function(ctx) {
        for(let p of this.particles) { 
            ctx.globalAlpha = p.life; 
            ctx.fillStyle = p.color; 
            ctx.fillRect(p.x, p.y, p.size, p.size); 
        }
        ctx.globalAlpha = 1.0;
    },

    renderStaticMap: function() { 
        if(!this.cacheCtx) this.initCache();
        const ctx = this.cacheCtx; 
        const map = this.state.currentMap;
        
        ctx.fillStyle = "#0d0d0d"; 
        ctx.fillRect(0, 0, this.cacheCanvas.width, this.cacheCanvas.height); 
        
        if(!map) return;

        for(let y=0; y<this.MAP_H; y++) {
            for(let x=0; x<this.MAP_W; x++) {
                const t = map[y][x];
                this.drawFloorDetail(ctx, x, y, t);

                if(t === '#') this.drawConnectedWall(ctx, x, y, map);
                else if(t === '^') this.drawMountain(ctx, x, y);
                else if(t === '=') this.drawRoad(ctx, x, y); 
                else if(t === '+') this.drawBridge(ctx, x, y); 
                else if(t === '~') { 
                    ctx.fillStyle = "#0d47a1"; 
                    ctx.fillRect(x*this.TILE, y*this.TILE, this.TILE, this.TILE); 
                }
            }
        }
    },

    drawFloorDetail: function(ctx, x, y, type) {
        const ts = this.TILE; 
        const px = x * ts; 
        const py = y * ts;
        const rand = this.pseudoRand(x, y);

        let color = "#1a1a1a"; // Default Wasteland
        
        if(type === '"') color = "#1b331b"; // Wald
        if(type === '_') color = "#3b3626"; // Wüste
        if(type === ';') color = "#241f1a"; // Sumpf
        
        if(type === 't') color = "#1b331b"; 
        if(type === '^') color = "#222"; 
        if(type === '~') return; 

        ctx.fillStyle = color;
        ctx.fillRect(px, py, ts, ts);

        if(type === '"' && rand > 0.6) { ctx.fillStyle = "#2e4e2e"; ctx.fillRect(px+rand*ts, py+(1-rand)*ts, 2, 2); }
        if(type === '_' && rand > 0.8) { ctx.fillStyle = "#5e5a4a"; ctx.fillRect(px+rand*ts, py+(1-rand)*ts, 2, 2); }
        if(type === '.' && rand > 0.7) { ctx.fillStyle = "#333"; ctx.fillRect(px+rand*ts, py+(1-rand)*ts, 2, 2); }
    }, // <--- HIER HAT DAS KOMMA GEFEHLT!

    drawRoad: function(ctx, x, y) {
        const ts = this.TILE; 
        const px = x * ts; 
        const py = y * ts;
        ctx.fillStyle = "#444"; 
        ctx.fillRect(px, py, ts, ts);
        if(this.pseudoRand(x,y) > 0.5) { 
            ctx.fillStyle = "#222"; 
            ctx.fillRect(px+4, py+4, ts-8, ts-8); 
        }
    },

    drawBridge: function(ctx, x, y) {
        const ts = this.TILE; 
        const px = x * ts; 
        const py = y * ts;
        ctx.fillStyle = "#0d47a1"; 
        ctx.fillRect(px, py, ts, ts);
        ctx.fillStyle = "#795548"; 
        ctx.fillRect(px + 2, py, ts - 4, ts); 
        ctx.fillStyle = "#3e2723"; 
        for(let i=0; i<ts; i+=4) ctx.fillRect(px, py+i, ts, 1);
        ctx.fillStyle = "#a1887f"; 
        ctx.fillRect(px, py, 2, ts); 
        ctx.fillRect(px + ts - 2, py, 2, ts); 
    },

    drawConnectedWall: function(ctx, x, y, map) {
        const ts = this.TILE; 
        const px = x * ts; 
        const py = y * ts;
        const rand = this.pseudoRand(x, y);
        const n = (y > 0) && map[y-1][x] === '#';
        
        const shade = Math.floor(70 + rand * 30); 
        ctx.fillStyle = `rgb(${shade},${shade},${shade})`; 
        ctx.fillRect(px, py, ts, ts);
        ctx.fillStyle = "#333"; 
        ctx.fillRect(px, py + ts - 8, ts, 8);
        ctx.fillStyle = "#666"; 
        if(!n) ctx.fillRect(px, py, ts, 4);
        
        if(rand > 0.4) { 
            ctx.fillStyle = "#111"; 
            ctx.beginPath(); 
            ctx.moveTo(px+ts*rand, py+ts*0.2); 
            ctx.lineTo(px+ts*rand+3, py+ts*0.6); 
            ctx.stroke(); 
        }
    },

    drawMountain: function(ctx, x, y) {
        const ts = this.TILE; 
        const px = x * ts; 
        const py = y * ts;
        const rand = this.pseudoRand(x, y);
        
        ctx.fillStyle = "#333"; 
        ctx.beginPath(); 
        ctx.moveTo(px, py+ts); ctx.lineTo(px+ts/2, py+ts*0.1); ctx.lineTo(px+ts, py+ts); 
        ctx.fill();
        
        ctx.fillStyle = "#444"; 
        ctx.beginPath(); 
        ctx.moveTo(px+ts*0.3, py+ts); ctx.lineTo(px+ts*0.5, py+ts*0.4); ctx.lineTo(px+ts*0.7, py+ts); 
        ctx.fill();
        
        ctx.fillStyle = (rand > 0.7) ? "#eee" : "#666"; 
        ctx.beginPath(); 
        ctx.moveTo(px+ts/2, py+ts*0.1); ctx.lineTo(px+ts*0.35, py+ts*0.4); ctx.lineTo(px+ts*0.65, py+ts*0.4); 
        ctx.fill();
    },

    drawTree: function(ctx, x, y, time) {
        const ts = this.TILE; 
        const px = x * ts; 
        const py = y * ts;
        const rand = this.pseudoRand(x, y);
        const sway = Math.sin(time / 1000 + x) * 2;
        
        ctx.fillStyle = "rgba(0,0,0,0.4)"; 
        ctx.beginPath(); 
        ctx.ellipse(px+ts/2, py+ts-5, ts/3, ts/6, 0, 0, Math.PI*2); 
        ctx.fill();
        
        ctx.fillStyle = "#5d4037"; 
        ctx.fillRect(px+ts/2-3, py+ts/2, 6, ts/2);
        
        const green = (rand > 0.5) ? "#388e3c" : "#2e7d32"; 
        ctx.fillStyle = green; 
        ctx.beginPath(); 
        ctx.arc(px+ts/2+sway, py+ts/2, ts/2.5, 0, Math.PI*2); 
        ctx.fill();
        
        ctx.fillStyle = (rand > 0.5) ? "#66bb6a" : "#4caf50";
        ctx.beginPath(); 
        ctx.arc(px+ts/2+(sway*1.5), py+ts/3, ts/3, 0, Math.PI*2); 
        ctx.fill();
    },

    drawWater: function(ctx, x, y, time) {
        const ts = this.TILE; 
        const px = x * ts; 
        const py = y * ts;
        ctx.fillStyle = "#0d47a1"; 
        ctx.fillRect(px, py, ts, ts);
        ctx.strokeStyle = "rgba(100, 220, 255, 0.4)"; 
        ctx.lineWidth = 1;
        const offset = (time / 100 + x * 10) % ts;
        ctx.beginPath(); 
        ctx.moveTo(px, py+offset); 
        ctx.lineTo(px+ts/2, py+offset+2); 
        ctx.lineTo(px+ts, py+offset); 
        ctx.stroke();
    },

    drawGrass: function(ctx, x, y, time) {
        const ts = this.TILE; 
        const px = x * ts; 
        const py = y * ts;
        const rand = this.pseudoRand(x, y);
        if(rand < 0.6) return;
        const sway = Math.sin(time / 500 + x * y) * 3;
        ctx.strokeStyle = (rand > 0.8) ? "#7cb342" : "#558b2f"; 
        ctx.lineWidth = 1;
        ctx.beginPath(); 
        ctx.moveTo(px+10, py+ts); 
        ctx.lineTo(px+10+sway, py+ts-8); 
        ctx.stroke();
    },

    checkLineOfSight: function(x0, y0, x1, y1) {
        let dx = Math.abs(x1-x0); 
        let dy = Math.abs(y1-y0);
        let sx = (x0<x1) ? 1 : -1; 
        let sy = (y0<y1) ? 1 : -1;
        let err = dx-dy; 
        let dist = 0;
        while(true) {
            if(x0===x1 && y0===y1) return true; 
            if(dist > 0) { 
                if(x0>=0 && x0<this.MAP_W && y0>=0 && y0<this.MAP_H) {
                    const t = this.state.currentMap[y0][x0];
                    if(['#', '^', 't'].includes(t)) return false; 
                }
            }
            let e2 = 2*err; 
            if(e2>-dy) { err-=dy; x0+=sx; } 
            if(e2<dx) { err+=dx; y0+=sy; } 
            dist++;
        }
    },

    draw: function() { 
        if(!this.ctx || !this.cacheCanvas) return; 
        if(!this.state.currentMap) return;
        
        const ctx = this.ctx; 
        const cvs = ctx.canvas; 
        const time = Date.now();
        
        if (cvs.clientWidth === 0) return;
        const viewW = cvs.clientWidth; 
        const viewH = cvs.clientHeight;
        
        let targetCamX = (this.state.player.x * this.TILE) - (viewW / 2); 
        let targetCamY = (this.state.player.y * this.TILE) - (viewH / 2); 
        const maxCamX = (this.MAP_W * this.TILE) - viewW; 
        const maxCamY = (this.MAP_H * this.TILE) - viewH; 
        
        const lerp = 0.1;
        this.camera.x += (Math.max(0, Math.min(targetCamX, maxCamX)) - this.camera.x) * lerp;
        this.camera.y += (Math.max(0, Math.min(targetCamY, maxCamY)) - this.camera.y) * lerp;
        
        ctx.fillStyle = "#000"; 
        ctx.fillRect(0, 0, viewW, viewH); 
        
        ctx.save(); 
        ctx.translate(-Math.floor(this.camera.x), -Math.floor(this.camera.y)); 
        
        const startX = Math.floor(this.camera.x / this.TILE); 
        const startY = Math.floor(this.camera.y / this.TILE); 
        const endX = startX + Math.ceil(viewW / this.TILE) + 1; 
        const endY = startY + Math.ceil(viewH / this.TILE) + 1; 

        for(let y=startY; y<endY; y++) { 
            for(let x=startX; x<endX; x++) { 
                if(y>=0 && y<this.MAP_H && x>=0 && x<this.MAP_W) { 
                    const dist = Math.sqrt((x-this.state.player.x)**2 + (y-this.state.player.y)**2);
                    if(dist > 10) continue;
                    if(!this.checkLineOfSight(this.state.player.x, this.state.player.y, x, y)) continue;

                    ctx.drawImage(this.cacheCanvas, x*this.TILE, y*this.TILE, this.TILE, this.TILE, x*this.TILE, y*this.TILE, this.TILE, this.TILE);
                    
                    const t = this.state.currentMap[y][x]; 
                    
                    if(t === '~') this.drawWater(ctx, x, y, time);
                    else if(t === 't') this.drawTree(ctx, x, y, time);
                    else if(t === '"') this.drawGrass(ctx, x, y, time);
                    else if(t === '.') this.drawGrass(ctx, x, y, time);
                    else if(t === 'M') this.drawMonster(ctx, x, y, time);
                    else if(t === 'W') this.drawWanderer(ctx, x, y, time);
                    
                    if(['X', 'V', 'R', 'S'].includes(t)) this.drawTile(ctx, x, y, t);
                    if(t === '?') this.drawTile(ctx, x, y, t);
                    
                    const opacity = Math.max(0, (dist - 4) / (10 - 4));
                    if(opacity > 0) { 
                        ctx.fillStyle = `rgba(0,0,0,${opacity})`; 
                        ctx.fillRect(x*this.TILE, y*this.TILE, this.TILE, this.TILE); 
                    }
                } 
            } 
        } 
        
        this.drawPlayer(ctx); 
        this.drawOtherPlayers(ctx);
        this.updateParticles(); 
        this.drawParticles(ctx);

        ctx.restore(); 

        ctx.fillStyle = "rgba(0, 255, 0, 0.02)"; 
        for(let i=0; i<viewH; i+=4) { ctx.fillRect(0, i, viewW, 1); }
    },
    
    drawPlayer: function(ctx) { 
        const px=this.state.player.x*this.TILE+this.TILE/2; 
        const py=this.state.player.y*this.TILE+this.TILE/2; 
        ctx.save(); 
        ctx.translate(px,py); 
        ctx.rotate(this.state.player.rot-Math.PI/2); 
        const g=ctx.createRadialGradient(0,0,10,0,0,140); 
        g.addColorStop(0,"rgba(255,255,200,0.25)"); 
        g.addColorStop(1,"rgba(255,255,200,0)"); 
        ctx.beginPath(); 
        ctx.moveTo(0,0); 
        ctx.arc(0,0,140,-Math.PI/5,Math.PI/5); 
        ctx.fillStyle=g; 
        ctx.fill(); 
        ctx.fillStyle="#39ff14"; 
        ctx.shadowBlur=10; 
        ctx.shadowColor="#39ff14"; 
        ctx.beginPath(); 
        ctx.moveTo(8,0); 
        ctx.lineTo(-6,7); 
        ctx.lineTo(-2,0); 
        ctx.lineTo(-6,-7); 
        ctx.fill(); 
        ctx.shadowBlur=0; 
        ctx.restore(); 
    },

    drawOtherPlayers: function(ctx) { 
        if(typeof Network==='undefined'||!Network.otherPlayers)return; 
        for(let pid in Network.otherPlayers){ 
            const p=Network.otherPlayers[pid]; 
            if(p.sector&&(p.sector.x!==this.state.sector.x||p.sector.y!==this.state.sector.y))continue; 
            const ox=p.x*this.TILE+this.TILE/2; 
            const oy=p.y*this.TILE+this.TILE/2; 
            ctx.fillStyle="#00ffff"; 
            ctx.beginPath(); 
            ctx.arc(ox,oy,6,0,Math.PI*2); 
            ctx.fill(); 
        } 
    },

    drawMonster: function(ctx,x,y,time) { 
        const ts=this.TILE; 
        const px=x*ts+ts/2; 
        const py=y*ts+ts/2; 
        const sc=1+Math.sin(time/200)*0.1; 
        ctx.save(); 
        ctx.translate(px,py); 
        ctx.scale(sc,sc); 
        ctx.fillStyle="#d32f2f"; 
        ctx.beginPath(); 
        ctx.arc(0,0,8,0,Math.PI*2); 
        ctx.fill(); 
        ctx.strokeStyle="#ff5252"; 
        ctx.lineWidth=2; 
        for(let i=0;i<8;i++){ 
            ctx.beginPath(); 
            ctx.moveTo(0,0); 
            const a=(i/8)*Math.PI*2; 
            ctx.lineTo(Math.cos(a)*12,Math.sin(a)*12); 
            ctx.stroke(); 
        } 
        ctx.fillStyle="#ffeb3b"; 
        ctx.fillRect(-4,-2,3,3); 
        ctx.fillRect(2,-2,3,3); 
        ctx.restore(); 
    },

    drawWanderer: function(ctx,x,y,time) { 
        const ts=this.TILE; 
        const px=x*ts+ts/2; 
        const py=y*ts+ts/2; 
        const b=Math.abs(Math.sin(time/300))*3; 
        ctx.save(); 
        ctx.translate(px,py-b); 
        ctx.fillStyle="#4fc3f7"; 
        ctx.beginPath(); 
        ctx.arc(0,-6,5,Math.PI,0); 
        ctx.lineTo(6,10); 
        ctx.lineTo(-6,10); 
        ctx.fill(); 
        ctx.fillStyle="#8d6e63"; 
        ctx.fillRect(-4,0,8,6); 
        ctx.restore(); 
    },

    drawTile: function(ctx,x,y,type) { 
        const ts=this.TILE; 
        const cx=x*ts+ts/2; 
        const cy=y*ts+ts/2; 
        const dI=(c,cl,s=20)=>{
            ctx.font=`bold ${s}px monospace`;
            ctx.fillStyle=cl;
            ctx.textAlign="center";
            ctx.textBaseline="middle";
            ctx.shadowColor=cl;
            ctx.shadowBlur=5;
            ctx.fillText(c,cx,cy);
            ctx.shadowBlur=0;
        }; 
        switch(type){ 
            case 'V':dI("⚙️","#ffff00",24);break; 
            case 'R':dI("💰","#ff3333",22);break; 
            case 'X':
                ctx.fillStyle="#8B4513";
                ctx.fillRect(cx-8,cy-6,16,12);
                ctx.strokeStyle="#ffd700";
                ctx.strokeRect(cx-8,cy-6,16,12);
                break; 
            case 'S':dI("🏪","#00ff00",22);break; 
            case 'H':dI("⛰️","#888",22);break; 
            case 'E':dI("EXIT","#00ffff",10);break; 
            case 'P':dI("✚","#ff0000",18);break; 
            case '?':dI("?","#ff00ff",20);break; 
        } 
    }
});
