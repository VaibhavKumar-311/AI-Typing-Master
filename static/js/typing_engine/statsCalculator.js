export class StatsCalculator {
    constructor() {
        this.reset();
    }

    reset() {
        this.correctChars = 0;
        this.incorrectChars = 0;
        this.totalTyped = 0;
        this.startTime = null;
        this.keyEvents = [];
    }

    start() {
        if (!this.startTime) {
            this.startTime = Date.now();
        }
    }

    update(isCorrect, expectedChar, actualChar, timeElapsedMs) {
        this.totalTyped++;
        if (isCorrect) {
            this.correctChars++;
        } else {
            this.incorrectChars++;
        }
        
        this.keyEvents.push({
            expected: expectedChar,
            actual: actualChar,
            correct: isCorrect,
            time_ms: timeElapsedMs
        });
    }

    handleBackspace(wasCorrect) {
        if (wasCorrect) {
            this.correctChars--;
        } else {
            this.incorrectChars--;
        }
    }

    getStats(timeElapsedSeconds) {
        const minutes = timeElapsedSeconds / 60 || 0.01;
        
        const grossWpm = (this.correctChars + this.incorrectChars) / 5 / minutes;
        const netWpm = Math.max(0, (this.correctChars / 5) / minutes);
        
        const cpm = Math.round(this.correctChars / minutes);
        
        let accuracy = 100;
        if (this.correctChars + this.incorrectChars > 0) {
            accuracy = (this.correctChars / (this.correctChars + this.incorrectChars)) * 100;
        }

        return {
            wpm: Math.round(netWpm),
            grossWpm: Math.round(grossWpm),
            cpm: cpm,
            accuracy: accuracy.toFixed(1),
            mistakes: this.incorrectChars,
            keyEvents: this.keyEvents
        };
    }
}
