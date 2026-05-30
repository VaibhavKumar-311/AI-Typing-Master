export class Timer {
    constructor(duration, onTick, onComplete) {
        this.duration = duration;
        this.timeRemaining = duration;
        this.onTick = onTick;
        this.onComplete = onComplete;
        this.interval = null;
        this.startTime = null;
    }

    start() {
        if (this.interval) return;
        this.startTime = Date.now();
        this.interval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            this.timeRemaining = this.duration - elapsed;
            
            if (this.timeRemaining <= 0) {
                this.timeRemaining = 0;
                this.stop();
                this.onTick(0);
                this.onComplete();
            } else {
                this.onTick(this.timeRemaining);
            }
        }, 200);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
    
    reset(duration) {
        this.stop();
        this.duration = duration;
        this.timeRemaining = duration;
        this.onTick(this.timeRemaining);
    }
}
