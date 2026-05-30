(function() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const reducedMotion = localStorage.getItem('reduced_motion') === 'true';
    
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.documentElement.setAttribute('data-reduced-motion', reducedMotion);
    
    window.ThemeManager = {
        setTheme: function(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            this.syncBackend('theme', theme);
        },
        setReducedMotion: function(value) {
            document.documentElement.setAttribute('data-reduced-motion', value);
            localStorage.setItem('reduced_motion', value);
            this.syncBackend('reduced_motion', value);
        },
        setAudioPack: function(pack) {
            localStorage.setItem('audio_pack', pack);
            this.syncBackend('audio_pack', pack);
        },
        getAudioPack: function() {
            return localStorage.getItem('audio_pack') || 'silent';
        },
        playKeystroke: function() {
            const pack = this.getAudioPack();
            if (pack === 'silent') return;
            
            if (!this.audioCtx) {
                this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
            
            // Throttle massive concurrent calls
            const now = this.audioCtx.currentTime;
            if (this.lastPlay && now - this.lastPlay < 0.02) return;
            this.lastPlay = now;
            
            const osc = this.audioCtx.createOscillator();
            const gainNode = this.audioCtx.createGain();
            
            osc.connect(gainNode);
            gainNode.connect(this.audioCtx.destination);
            
            if (pack === 'mechanical') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(120 + Math.random() * 40, now);
                gainNode.gain.setValueAtTime(0.04, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                osc.start();
                osc.stop(now + 0.05);
            } else if (pack === 'terminal') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800 + Math.random() * 50, now);
                gainNode.gain.setValueAtTime(0.02, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                osc.start();
                osc.stop(now + 0.1);
            }
        },
        syncBackend: function(key, value) {
            if (!window.CSRF_TOKEN) return;
            fetch('/settings/api/sync/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': window.CSRF_TOKEN
                },
                body: JSON.stringify({ key: key, value: value })
            }).catch(e => console.error("Theme sync error", e));
        }
    };
})();
