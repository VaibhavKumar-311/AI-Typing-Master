export default class MultiplayerGame {
    constructor(roomCode, currentUsername, text) {
        this.roomCode = roomCode;
        this.currentUsername = currentUsername;
        this.text = text;
        
        this.typedText = "";
        this.totalStrokes = 0;
        this.correctStrokes = 0;
        this.startTime = null;
        this.completed = false;
        
        this.players = {}; // username -> { progress, wpm, is_ready, placement }
        
        this.ws = null;
        this.isRaceActive = false;
        
        // Throttling updates
        this.lastUpdateTime = 0;
        this.updateInterval = 100; // ms
        
        this.initWebSocket();
        this.initDOM();
    }
    
    initDOM() {
        this.textContainer = document.getElementById('typing-text');
        this.playersContainer = document.getElementById('players-container');
        this.statusOverlay = document.getElementById('status-overlay');
        this.statusText = document.getElementById('status-text');
        
        this.readyBtn = document.getElementById('ready-btn');
        this.readyBtn.addEventListener('click', () => {
            this.ws.send(JSON.stringify({ type: 'player_ready' }));
            this.readyBtn.classList.add('opacity-50', 'cursor-not-allowed');
            this.readyBtn.disabled = true;
            this.readyBtn.innerText = "Waiting...";
            
            // Check if we are host and can start
            if (this.isHost()) {
                // In a real production system, the backend validates all players are ready.
                // For this MVP, if host clicks ready, they can start countdown.
                setTimeout(() => {
                    this.ws.send(JSON.stringify({ type: 'start_countdown' }));
                }, 1000);
            }
        });
        
        window.addEventListener('keydown', (e) => this.handleTyping(e));
        this.renderText();
    }
    
    initWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
        this.ws = new WebSocket(`${protocol}${window.location.host}/ws/multiplayer/${this.roomCode}/`);
        
        this.ws.onopen = () => {
            console.log("Connected to room", this.roomCode);
            this.readyBtn.classList.remove('hidden');
        };
        
        this.ws.onmessage = (e) => {
            const data = JSON.parse(e.data);
            this.handleMessage(data);
        };
        
        this.ws.onclose = () => {
            console.log("Disconnected");
        };
    }
    
    handleMessage(data) {
        if (data.type === 'player_joined' || data.type === 'race_update' || data.type === 'player_ready_state') {
            if (!this.players[data.username]) {
                this.players[data.username] = { progress: 0, wpm: 0, is_ready: false };
            }
        }
        
        switch (data.type) {
            case 'player_joined':
                this.players[data.username].offline = false;
                if (data.progress) this.players[data.username].progress = data.progress;
                if (data.is_ready) this.players[data.username].is_ready = data.is_ready;
                break;
                
            case 'player_disconnected':
                if (this.players[data.username]) {
                    this.players[data.username].offline = true;
                }
                break;
                
            case 'player_ready_state':
                this.players[data.username].is_ready = data.is_ready;
                break;
                
            case 'race_update':
                this.players[data.username].progress = data.progress;
                this.players[data.username].wpm = data.wpm;
                break;
                
            case 'race_finish':
                this.players[data.username].placement = data.placement;
                break;
                
            case 'start_countdown':
                this.startCountdown(data.countdown);
                break;
        }
        
        this.renderPlayers();
    }
    
    isHost() {
        // Simple host determination: first connected player (alphabetically, or just assume the creator)
        // For robustness, ideally backend sends 'is_host' flag.
        return true; 
    }
    
    startCountdown(seconds) {
        this.readyBtn.classList.add('hidden');
        this.statusOverlay.classList.remove('hidden');
        
        let count = seconds;
        this.statusText.innerText = count;
        
        const intv = setInterval(() => {
            count--;
            if (count > 0) {
                this.statusText.innerText = count;
            } else {
                clearInterval(intv);
                this.statusText.innerText = "GO!";
                setTimeout(() => {
                    this.statusOverlay.classList.add('hidden');
                    this.isRaceActive = true;
                    this.startTime = Date.now();
                }, 500);
            }
        }, 1000);
    }
    
    handleTyping(e) {
        if (!this.isRaceActive || this.completed) return;
        if (e.key.length !== 1) return;
        
        this.totalStrokes++;
        const nextChar = this.text[this.typedText.length];
        
        if (e.key === nextChar) {
            this.correctStrokes++;
            this.typedText += e.key;
            this.renderText();
            
            this.broadcastProgress();
            
            if (this.typedText.length === this.text.length) {
                this.finishRace();
            }
        } else {
            // Mistake feedback
            this.textContainer.classList.add('text-red-400');
            setTimeout(() => this.textContainer.classList.remove('text-red-400'), 100);
        }
    }
    
    broadcastProgress() {
        const now = Date.now();
        if (now - this.lastUpdateTime > this.updateInterval || this.typedText.length === this.text.length) {
            this.lastUpdateTime = now;
            
            const progress = (this.typedText.length / this.text.length) * 100;
            const minutes = (now - this.startTime) / 60000;
            const wpm = minutes > 0 ? Math.round((this.typedText.length / 5) / minutes) : 0;
            
            this.ws.send(JSON.stringify({
                type: 'progress_update',
                progress: progress,
                wpm: wpm
            }));
        }
    }
    
    finishRace() {
        this.completed = true;
        this.isRaceActive = false;
        
        const minutes = (Date.now() - this.startTime) / 60000;
        const wpm = Math.round((this.text.length / 5) / minutes);
        const accuracy = (this.correctStrokes / this.totalStrokes) * 100;
        
        this.statusText.innerText = `FINISHED! ${wpm} WPM`;
        this.statusOverlay.classList.remove('hidden');
        
        // Save result
        fetch('/multiplayer/api/save-race-result/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': window.CSRF_TOKEN,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                room_code: this.roomCode,
                wpm: wpm,
                accuracy: accuracy
            })
        });
        
        // Wait and redirect
        setTimeout(() => {
            window.location.href = '/dashboard/';
        }, 5000);
    }
    
    renderText() {
        const typed = this.text.substring(0, this.typedText.length);
        const next = this.text.substring(this.typedText.length, this.typedText.length + 1);
        const untyped = this.text.substring(this.typedText.length + 1);
        
        this.textContainer.innerHTML = `<span class="text-white">${typed}</span><span class="bg-purple-600/50 text-white underline decoration-2">${next}</span><span class="text-gray-600">${untyped}</span>`;
    }
    
    renderPlayers() {
        this.playersContainer.innerHTML = '';
        
        // Sort players by placement if finished, then progress descending
        const sorted = Object.entries(this.players).sort((a, b) => {
            if (a[1].placement && b[1].placement) return a[1].placement - b[1].placement;
            if (a[1].placement) return -1;
            if (b[1].placement) return 1;
            return b[1].progress - a[1].progress;
        });
        
        sorted.forEach(([username, data]) => {
            const isMe = username === this.currentUsername;
            const isOffline = data.offline ? 'opacity-50 grayscale' : '';
            
            const div = document.createElement('div');
            div.className = `flex items-center gap-4 w-full ${isOffline}`;
            
            let statusIcon = '';
            if (data.placement) {
                statusIcon = data.placement === 1 ? '🥇' : data.placement === 2 ? '🥈' : data.placement === 3 ? '🥉' : '🏁';
            } else if (data.offline) {
                statusIcon = '🔌';
            } else if (data.is_ready && !this.isRaceActive) {
                statusIcon = '✅';
            }
            
            div.innerHTML = `
                <div class="w-24 text-right truncate ${isMe ? 'text-purple-400 font-bold' : 'text-gray-300'}">
                    ${username}
                </div>
                <div class="flex-grow bg-gray-800 rounded-full h-4 overflow-hidden border border-gray-700 relative">
                    <!-- Added duration-300 and ease-out for client-side interpolation -->
                    <div class="h-full ${isMe ? 'bg-gradient-to-r from-purple-500 to-indigo-500' : 'bg-gray-500'} transition-all duration-300 ease-out" style="width: ${data.progress}%"></div>
                </div>
                <div class="w-20 text-right font-mono text-gray-400">
                    ${data.wpm} WPM
                </div>
                <div class="w-8 text-center text-sm">
                    ${statusIcon}
                </div>
            `;
            
            this.playersContainer.appendChild(div);
        });
    }
}
