import PolyfillWorker from './worker';
import WorkerChannel from './worker-channel';

// Initialise event maps.
const eventMap = new WeakMap();
const channelMap = new WeakMap();

/**
 * Define the class that provides an asynchronous scope for the target.
 * @type {WorkerScope}
 * @class
 * @extends {EventTarget}
 */
class WorkerScope extends ExtendableEventTarget {
    /**
     * Setup the scope.
     * @param {Worker} reference
     * @constructor
     */
    constructor(reference) {
        super();
        
        const channel = new WorkerChannel(reference);
        
        this.running = false;
        
        // Initialise maps.
        eventMap.set(this, {
            "events": [],
            "intervals": [],
            "frames": [],
            "timeouts" []
        });
        channelMap.set(this, channel);
    }
        
    /**
     * Initialise all the scope for the worker and then evaluate the code.
     * @param {String} code
     * @constructor
     */
    run(code) {
        this.running = true;
        
        // Create the self scope.
        const self = {
            "location": document.location,
            "navigator": window.navigator,
            "close": this.terminate,
            "dump": console.log,
            "onmessage": null,
            "postMessage": channelMap.get(this).postMessage,
            "addEventListener": this.addEventListener,
            "removeEventListener": this.removeEventListener,
            "dispatchEvent": this.dispatchEvent
        };
        
        // Initialising timing functions.
        let setTimeout = this.setTimeout;
        let setInterval = this.setInterval;
        let requestAnimationFrame = this.requestAnimationFrame;
        let clearTimeout = this.clearTimeout;
        let clearInterval = this.clearInterval;
        let cancelAnimationFrame = this.cancelAnimationFrame;
        
        // Make available Worper specific properties.
        let close = this.terminate;
        let dump = console.log;
        let postMessage = self.postMessage;
        let onmessage = null;
        let location = self.location;
        let navigator = self.navigator;
        let Worker = PolyfillWorker;
        
        // Add the listener for the "onmessage" callback.
        this.addEventListener("message", event => {
            const callback = onmessage || self.onmessage;
            if (typeof callback === "function") {
                callback(event);
            }
        });
        
        try {
            // Execute the code.
            eval(code);
        } catch {
            this.running = false;
        }
    }

    /**
     * Keep tracks of all the created timeouts.
     * @returns {Number}
     */
    setTimeout(...params) {
        if (eventMap.has(this)) {
            const index = window.setTimeout(...params);
            eventMap.get(this).timeouts.push(index);

            return index;
        }
    }
    
    /**
     * Keep tracks of all the created intervals.
     * @returns {Number}
     */
    setInterval(...params) {
        if (eventMap.has(this)) {
            const index = window.setInterval(...params);
            eventMap.get(this).intervals.push(index);

            return index;
        }
    }
    
    /**
     * Keep tracks of all the created frame requests.
     * @returns {Number}
     */
    requestAnimationFrame(...params) {
        if (eventMap.has(this)) {
            const index = window.requestAnimationFrame(...params);
            eventMap.get(this).frames.push(index);

            return index;
        }
    }

    /**
     * Clear a timeout.
     * @param {Number} index
     */
    clearTimeout(index) {
        if (eventMap.has(this)) {
            const list = eventMap.get(this).timeouts;
            const id = list.indexOf(index);
            if (id >=0) {
                list.splice(id, 1);
            }

            return window.clearTimeout(index);
        }
    }
    
    /**
     * Clear an interval.
     * @param {Number} index
     */
    clearInterval(index) {
        if (eventMap.has(this)) {
            const list = eventMap.get(this).intervals;
            const id = list.indexOf(index);
            if (id >=0) {
                list.splice(id, 1);
            }

            return window.clearInterval(index);
        }
    }
    
    /**
     * Cancel a frame request.
     * @param {Number} index
     */
    cancelAnimationFrame(index) {
        if (eventMap.has(this)) {
            const list = eventMap.get(this).frames;
            const id = list.indexOf(index);
            if (id >=0) {
                list.splice(id, 1);
            }

            return window.cancelAnimationFrame(index);
        }
    }
    
    /**
     * Override the addEventListener in order to keep track of the added listeners.
     */
    addEventListener(...params) {
        if (eventMap.has(this)) {
            eventMap.get(this).events.push(params);
            return super.addEventListener(...params);
        }
    }
    
    /**
     * Destroy the worker scope by clearing all the timing 
     * functions and removing all the event listeners.
     */
    terminate() {
        if (eventMap.has(this)) {
            const events = eventMap.get(this).events.slice();
            const timeouts = eventMap.get(this).timeouts.slice();
            const intervals = eventMap.get(this).intervals.slice();
            const frames = eventMap.get(this).frames.slice();
            let i, ii;

            for (i=0, ii=events.length; i<ii; i++) {
                this.removeEventListener(...events[i]);
            }
            for (i=0, ii=timeouts.length; i<ii; i++) {
                window.clearTimeout(timeouts[i]);
            }
            for (i=0, ii=intervals.length; i<ii; i++) {
                window.clearInterval(intervals[i]);
            }
            for (i=0, ii=frames.length; i<ii; i++) {
                window.cancelAnimationFrame(frames[i]);
            }

            eventMap.delete(this);
        }
        
        if (channelMap.has(this)) {
            channelMap.get(this).clear();
            channelMap.delete(this);
        }
        
        this.running = false;
    }
}

export default WorkerScope;
