// [v5.7] - 2026-01-03 (Admin System Fix)
// - Fix: Inventar/Quests werden sicher als Array geladen (Fix für "forEach" Crash).
// - Fix: Game.items Check verhindert Absturz bei fehlenden Item-Daten.
// - Update: Kompatibel mit HTML v5.0 Layout.

const Admin = {
    // Config
    gatePass: "bimbo123",
    adminUser: "admin@pipboy-system.com",
    adminPass: "zintel1992",

    // State
    dbData: {}, 
    currentPath: null,
    currentUserData: null,
    itemsList: [], 

    // --- 1. GATEKEEPER & INIT ---
    
    unlock: function() {
        const input = document.getElementById('gate-pass').value;
        const msg = document.getElementById('gate-msg');
        
        if(input === this.gatePass) {
            msg.className = "mt-4 h-6 text-green-500 font-bold";
            msg.textContent = "ACCESS GRANTED. ESTABLISHING UPLINK...";
            this.connectFirebase();
        } else {
            msg.textContent = "ACCESS DENIED.";
            document.getElementById('gate-pass').value = '';
        }
    },

    connectFirebase: async function() {
        // Init Network if not ready
        if (typeof Network !== 'undefined' && !Network.db) {
            try { if(typeof Network.init === 'function') Network.init(); } catch(e) {}
        }

        try {
            await Network.login(this.adminUser, this.adminPass);
            
            // Switch UI
            document.getElementById('gate-screen').classList.add('hidden');
            const app = document.getElementById('app-ui');
            if(app) {
                app.classList.remove('hidden');
                setTimeout(() => app.classList.remove('opacity-0'), 50);
            }
            
            const connDot = document.getElementById('conn-dot');
            if(connDot) {
                connDot.classList.replace('bg-red-500', 'bg-green-500');
                connDot.classList.remove('animate-pulse');
            }
            
            this.initData();

        } catch(e) {
            const msgEl = document.getElementById('gate-msg');
            if(msgEl) msgEl.textContent = "UPLINK FAILED: " + e.code;
            console.error(e);
        }
    },

    initData: function() {
        // Load Game Items for Dropdown safe check
        const sel = document.getElementById('inv-add-select');
        if(typeof Game !== 'undefined' && Game.items && sel) {
            this.itemsList = Object.keys(Game.items).sort().map(k => ({id: k, name: Game.items[k].name}));
            sel.innerHTML = '<option value="">-- SELECT ITEM --</option>';
            this.itemsList.forEach(i => {
                const opt = document.createElement('option');
                opt.value = i.id;
                opt.textContent = `${i.name} (${i.id})`;
                sel.appendChild(opt);
            });
        } else {
            console.warn("Admin: Game.items not loaded yet or UI missing.");
        }

        // Listener
        if(Network.db) {
            Network.db.ref('saves').on('value', snap => {
                this.dbData = snap.val() || {};
                this.renderUserList();
                
                // Refresh selection if active
                if(this.currentPath) {
                    const parts = this.currentPath.split('/');
                    if(this.dbData[parts[1]] && this.dbData[parts[1]][parts[2]]) {
                        this.selectUser(this.currentPath, true);
                    }
                }
            });
        }
    },

    refresh: function() {
        location.reload(); 
    },

    // --- 2. USER LIST ---

    renderUserList: function() {
        const list = document.getElementById('user-list');
        const searchInput = document.getElementById('search-player');
        if(!list) return;

        const filter = searchInput ? searchInput.value.toLowerCase() : "";
        list.innerHTML = '';
        
        let count = 0;
        
        for(let uid in this.dbData) {
            const slots = this.dbData[uid];
            for(let slotIdx in slots) {
                const save = slots[slotIdx];
                const name = (save.playerName || "Unknown").toLowerCase();
                const path = `saves/${uid}/${slotIdx}`;
                
                if(filter && !name.includes(filter) && !uid.includes(filter)) continue;

                const div = document.createElement('div');
                const isSelected = this.currentPath === path;
                const isDead = (save.hp <= 0);
                
                div.className = `p-2 cursor-pointer border-b border-[#1a331a] flex justify-between items-center hover:bg-[#39ff14] hover:text-black transition-colors ${isSelected ? 'bg-[#39ff14] text-black font-bold' : 'text-[#39ff14]'}`;
                div.onclick = () => this.selectUser(path);
                
                div.innerHTML = `
                    <div class="flex flex-col overflow-hidden">
                        <span class="truncate uppercase">${isDead ? '💀 ' : ''}${save.playerName || 'NO_NAME'}</span>
                        <span class="text-[10px] opacity-60 font-mono">${save._userEmail || uid.substr(0,8)}</span>
                    </div>
                    <div class="text-right text-xs">
                        <div>LVL ${save.lvl || 1}</div>
                        <div>SEC ${save.sector ? `${save.sector.x},${save.sector.y}` : '?,?'}</div>
                    </div>
                `;
                list.appendChild(div);
                count++;
            }
        }
        const countEl = document.getElementById('user-count');
        if(countEl) countEl.textContent = count;
    },

    selectUser: function(path, silent = false) {
        this.currentPath = path;
        
        const parts = path.split('/');
        const uid = parts[1];
        const slot = parts[2];
        
        if(!this.dbData[uid] || !this.dbData[uid][slot]) return; 

        this.currentUserData = this.dbData[uid][slot];
        const d = this.currentUserData;

        // UI Reset Tabs if not silent
        if(!silent) {
            document.querySelectorAll('.active-tab').forEach(el => {
                el.classList.remove('active-tab');
                el.classList.add('inactive-tab');
            });
            const tabGen = document.getElementById('tab-btn-general');
            if(tabGen) {
                tabGen.classList.add('active-tab');
                tabGen.classList.remove('inactive-tab');
            }
            this.tab('general');
        }

        // Header Info
        const noSel = document.getElementById('no-selection');
        const editContent = document.getElementById('editor-content');
        if(noSel) noSel.classList.add('hidden');
        if(editContent) editContent.classList.remove('hidden');
        
        const setTxt = (id, txt) => { const el = document.getElementById(id); if(el) el.textContent = txt; };
        const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = val; };

        setTxt('edit-name', d.playerName || "Unknown");
        setTxt('edit-uid', uid);
        setTxt('edit-slot', slot);
        setTxt('edit-email', d._userEmail || "No Email");
        
        setVal('quick-lvl', d.lvl || 1);
        setVal('quick-xp', d.xp || 0);

        // Fill Tabs (Safely with try-catch)
        try { this.fillGeneral(d); } catch(e) { console.error("Fill General Error", e); }
        try { this.fillStats(d); } catch(e) { console.error("Fill Stats Error", e); }
        try { this.fillInv(d); } catch(e) { console.error("Fill Inv Error", e); }
        try { this.fillWorld(d); } catch(e) { console.error("Fill World Error", e); }
        try { this.fillRaw(d); } catch(e) { console.error("Fill Raw Error", e); }
        
        if(!silent) this.renderUserList(); 
    },

    // --- 3. EDITOR FILLERS ---

    fillGeneral: function(d) {
        const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = val; };
        setVal('inp-hp', Math.round(d.hp || 0));
        setVal('inp-maxhp', d.maxHp || 10);
        setVal('inp-rads', d.rads || 0);
        setVal('inp-caps', d.caps || 0);
    },

    fillStats: function(d) {
        const container = document.getElementById('special-container');
        if(!container) return;
        container.innerHTML = '';
        
        const stats = d.stats || { STR:1, PER:1, END:1, CHA:1, INT:1, AGI:1, LUC:1 };
        
        for(let key in stats) {
            const val = stats[key];
            const div = document.createElement('div');
            div.className = "panel-box p-2 flex justify-between items-center";
            div.innerHTML = `
                <span class="font-bold text-xl w-12">${key}</span>
                <input type="range" min="1" max="10" value="${val}" class="flex-grow mx-2 accent-[#39ff14]" 
                    onchange="document.getElementById('val-${key}').textContent=this.value; Admin.saveStat('${key}', this.value)">
                <span id="val-${key}" class="font-bold text-xl w-6 text-right">${val}</span>
            `;
            container.appendChild(div);
        }

        const statP = document.getElementById('inp-statPoints');
        if(statP) statP.value = d.statPoints || 0;
        const perkP = document.getElementById('inp-perkPoints');
        if(perkP) perkP.value = d.perkPoints || 0;
    },

    fillInv: function(d) {
        const tbody = document.getElementById('inv-table-body');
        if(!tbody) return;
        tbody.innerHTML = '';
        
        // [FIX] Convert Object to Array if necessary (Firebase quirk)
        let inv = [];
        if(d.inventory) {
            inv = Array.isArray(d.inventory) ? d.inventory : Object.values(d.inventory);
        }

        inv.forEach((item, idx) => {
            if(!item) return;
            const tr = document.createElement('tr');
            tr.className = "border-b border-[#1a551a] hover:bg-[#002200]";
            
            // Name resolve (Safe Check)
            let name = item.id;
            if(typeof Game !== 'undefined' && Game.items && Game.items[item.id]) {
                name = Game.items[item.id].name;
            }
            if(item.props && item.props.name) name = item.props.name + "*";

            tr.innerHTML = `
                <td class="p-2 truncate max-w-[120px]">${name}</td>
                <td class="p-2 font-mono text-xs opacity-50 hidden md:table-cell">${item.id}</td>
                <td class="p-2 text-center">
                    <input type="number" class="w-12 bg-black border border-[#1a551a] text-center" 
                        value="${item.count}" onchange="Admin.invUpdate(${idx}, this.value)">
                </td>
                <td class="p-2 text-center">
                    <button onclick="Admin.invDelete(${idx})" class="text-red-500 font-bold hover:text-white px-2">X</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    fillWorld: function(d) {
        const sx = d.sector ? d.sector.x : 0;
        const sy = d.sector ? d.sector.y : 0;
        
        const viewSec = document.getElementById('view-sector');
        if(viewSec) viewSec.textContent = `${sx},${sy}`;
        
        const tX = document.getElementById('tele-x');
        if(tX) tX.value = sx;
        const tY = document.getElementById('tele-y');
        if(tY) tY.value = sy;

        const qList = document.getElementById('quest-list');
        if(!qList) return;
        qList.innerHTML = '';
        
        // [FIX] Array check for quests too
        let quests = [];
        if(d.quests) {
            quests = Array.isArray(d.quests) ? d.quests : Object.values(d.quests);
        }
        
        if(quests.length === 0) qList.innerHTML = '<div class="text-gray-500 italic">No active quests.</div>';
        
        quests.forEach((q) => {
            const div = document.createElement('div');
            div.className = "flex justify-between border-b border-[#1a331a] p-1 text-sm";
            div.innerHTML = `
                <span>${q.id} <span class="text-xs opacity-50">(${q.stage})</span></span>
                <span class="${q.completed ? 'text-green-500' : 'text-yellow-500'}">${q.completed ? 'DONE' : 'ACTIVE'}</span>
            `;
            qList.appendChild(div);
        });
    },

    fillRaw: function(d) {
        const raw = document.getElementById('raw-json');
        if(raw) raw.value = JSON.stringify(d, null, 2);
    },

    // --- 4. ACTIONS & SAVING ---

    tab: function(id) {
        document.querySelectorAll('[id^="tab-btn-"]').forEach(b => {
            b.classList.replace('active-tab', 'inactive-tab');
        });
        const btn = document.getElementById('tab-btn-' + id);
        if(btn) btn.classList.replace('inactive-tab', 'active-tab');
        
        ['general', 'stats', 'inv', 'world', 'raw'].forEach(t => {
            const el = document.getElementById('tab-' + t);
            if(el) el.classList.add('hidden');
        });
        
        const target = document.getElementById('tab-' + id);
        if(target) target.classList.remove('hidden');
    },

    saveVal: function(key, val) {
        if(!this.currentPath) return;
        if(!isNaN(val) && val !== "") val = Number(val);
        Network.db.ref(this.currentPath + '/' + key).set(val);
    },

    modVal: function(key, amount) {
        if(!this.currentUserData) return;
        let current = this.currentUserData[key] || 0;
        this.saveVal(key, current + amount);
    },

    saveStat: function(stat, val) {
        if(!this.currentPath) return;
        Network.db.ref(this.currentPath + '/stats/' + stat).set(Number(val));
    },

    action: function(type) {
        if(!this.currentPath) return;
        const updates = {};
        const p = this.currentPath;

        if (type === 'heal') {
            updates['hp'] = this.currentUserData.maxHp || 100;
            updates['rads'] = 0;
            updates['isGameOver'] = false;
        }
        else if (type === 'de-rad') {
            updates['rads'] = 0;
        }
        else if (type === 'kill') {
            if(!confirm("KILL PLAYER?")) return;
            updates['hp'] = 0;
            updates['isGameOver'] = true;
        }
        else if (type === 'revive') {
            updates['hp'] = 10;
            updates['isGameOver'] = false;
        }
        else if (type === 'delete') {
            if(!confirm("DELETE SAVEGAME PERMANENTLY?")) return;
            Network.db.ref(p).remove();
            this.currentPath = null;
            document.getElementById('editor-content').classList.add('hidden');
            document.getElementById('no-selection').classList.remove('hidden');
            return;
        }
        else if (type === 'reset-vault') {
            if(!confirm("RESET CHARACTER TO VAULT 101 (SECTOR 4,4)?")) return;
            updates['sector'] = {x: 4, y: 4};
            updates['player'] = {x: 300, y: 200}; 
        }

        Network.db.ref(p).update(updates);
    },

    teleport: function() {
        const tX = document.getElementById('tele-x');
        const tY = document.getElementById('tele-y');
        if(!tX || !tY) return;

        const x = Number(tX.value);
        const y = Number(tY.value);
        
        if(!this.currentPath) return;

        Network.db.ref(this.currentPath + '/sector').set({x:x, y:y});
        Network.db.ref(this.currentPath + '/player').set({x:300, y:200}); 
    },

    invUpdate: function(idx, val) {
        val = Number(val);
        if(val <= 0) {
            this.invDelete(idx);
        } else {
            Network.db.ref(`${this.currentPath}/inventory/${idx}/count`).set(val);
        }
    },

    invDelete: function(idx) {
        if(!confirm("Remove Item?")) return;
        // Fix for array splice
        let inv = this.currentUserData.inventory;
        if (!Array.isArray(inv)) inv = Object.values(inv || {});
        
        inv.splice(idx, 1);
        Network.db.ref(this.currentPath + '/inventory').set(inv);
    },

    invAdd: function() {
        const sel = document.getElementById('inv-add-select');
        const qtyEl = document.getElementById('inv-add-qty');

        if(!sel || !qtyEl) return;

        const id = sel.value;
        const count = Number(qtyEl.value);
        
        if(!id) {
            alert("Bitte wähle ein Item aus der Liste!");
            return;
        }
        if(isNaN(count) || count < 1) {
            alert("Menge muss mindestens 1 sein.");
            return;
        }

        let inv = this.currentUserData.inventory;
        if (!Array.isArray(inv)) inv = Object.values(inv || {});
        
        let found = false;
        for(let item of inv) {
            if(item.id === id && !item.props) {
                item.count += count;
                found = true;
                break;
            }
        }
        if(!found) {
            inv.push({id: id, count: count, isNew: true});
        }
        
        Network.db.ref(this.currentPath + '/inventory').set(inv);
    },

    saveRaw: function() {
        try {
            const el = document.getElementById('raw-json');
            if(!el) return;
            const data = JSON.parse(el.value);
            if(confirm("OVERWRITE DATABASE WITH RAW JSON?")) {
                Network.db.ref(this.currentPath).set(data);
            }
        } catch(e) {
            alert("INVALID JSON: " + e.message);
        }
    }
};
