import PolyfillEventTarget from './event-target';
    
// Check if the Event target class exists and can be extended
let available = false;
if (self.EventTarget) {
    try {
        new EventTarget(); 
        available = true
    } catch (e) {}
}

// If not, use the polyfill
self.ExtendableEventTarget = available ? self.EventTarget : PolyfillEventTarget;
