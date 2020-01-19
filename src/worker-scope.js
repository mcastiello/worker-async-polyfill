/*
 * Copyright (c) 2020
 * Author: Marco Castiello
 * E-mail: marco.castiello@gmail.com
 * Project: Worker Async Polyfill
 */

import { Worker as PolyfillWorker } from './worker.js';
import { WorkerChannel } from './worker-channel.js';

// Initialise event maps.
const eventMap = new WeakMap();
const channelMap = new WeakMap();
const originalAnimationFrame = (callback) => self.requestAnimationFrame(callback);

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
            "timeouts": []
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
            "postMessage": (...params) => channelMap.get(this).postMessage(...params),
            "addEventListener": (...params) => this.addEventListener(...params),
            "removeEventListener": (...params) => this.removeEventListener(...params),
            "dispatchEvent": (...params) => this.dispatchEvent(...params),
            // Add transferable classes
            "ArrayBuffer": window.ArrayBuffer,
            "MessagePort": window.MessagePort,
            "ImageBitmap": window.ImageBitmap,
            "OffscreenCanvas": window.OffscreenCanvas
        };

        // Initialising timing functions.
        let setTimeout = (...params) => this.setTimeout(...params);
        let setInterval = (...params) => this.setInterval(...params);
        let requestAnimationFrame = (...params) => this.requestAnimationFrame(...params);
        let clearTimeout = (...params) => this.clearTimeout(...params);
        let clearInterval = (...params) => this.clearInterval(...params);
        let cancelAnimationFrame = (...params) => this.cancelAnimationFrame(...params);

        // Make available Worper specific properties.
        let close = () => this.terminate();
        let dump = (...params) => console.log();
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
        } catch (error) {
            this.running = false;
            const event = new Event("messageerror");
            event.message = error;
            this.dispatchEvent(event);
        }

        // Execute the checks for the worker status to see if something is still happening.
        const workerStatusCheck = () => {
            let events, timeouts, intervals, frames;
            if (eventMap.has(this)) {
                events = eventMap.get(this).events.length > 1 ||
                    typeof onmessage === "function" || typeof self.onmessage === "function";
                timeouts = eventMap.get(this).timeouts.length > 0;
                intervals = eventMap.get(this).intervals.length > 0;
                frames = eventMap.get(this).frames.length > 0;
            }

            this.running = events || timeouts || intervals || frames;

            if (this.running) {
                originalAnimationFrame(workerStatusCheck);
            } else {
                this.terminate();
            }
        };
        originalAnimationFrame(workerStatusCheck);
    }

    /**
     * Keep tracks of all the created timeouts.
     * @returns {Number}
     */
    setTimeout(...params) {
        if (eventMap.has(this)) {
            const index = self.setTimeout(...params);
            eventMap.get(this).timeouts.push(index);

            self.setTimeout(() => this.clearTimeout(index), (params[1]||0)+1);

            return index;
        }
    }

    /**
     * Keep tracks of all the created intervals.
     * @returns {Number}
     */
    setInterval(...params) {
        if (eventMap.has(this)) {
            const index = self.setInterval(...params);
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
            const index = self.requestAnimationFrame(...params);
            eventMap.get(this).frames.push(index);

            self.requestAnimationFrame(() => this.cancelAnimationFrame(index));

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

            return self.clearTimeout(index);
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

            return self.clearInterval(index);
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

            return self.cancelAnimationFrame(index);
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
                this.clearTimeout(timeouts[i]);
            }
            for (i=0, ii=intervals.length; i<ii; i++) {
                this.clearInterval(intervals[i]);
            }
            for (i=0, ii=frames.length; i<ii; i++) {
                this.cancelAnimationFrame(frames[i]);
            }

            eventMap.delete(this);
        }

        if (channelMap.has(this)) {
            channelMap.get(this).clear();
            channelMap.delete(this);
        }
    }
}

export { WorkerScope };
