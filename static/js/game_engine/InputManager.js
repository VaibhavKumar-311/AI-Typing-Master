export default class InputManager {
    constructor() {
        this.keys = {};
        this.onKeyPress = null;
        
        this.handleKeyDown = this.handleKeyDown.bind(this);
        
        window.addEventListener('keydown', this.handleKeyDown);
    }
    
    handleKeyDown(e) {
        // Anti-cheat: ignore synthetic events
        if (!e.isTrusted) return;
        
        // Ignore modifier keys
        if (e.ctrlKey || e.altKey || e.metaKey) return;
        
        if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
            if (e.key === ' ' || e.key === 'Backspace' || e.key === '/') {
                e.preventDefault();
            }
            if (this.onKeyPress) {
                this.onKeyPress(e.key);
            }
        }
    }
    
    destroy() {
        window.removeEventListener('keydown', this.handleKeyDown);
    }
}
