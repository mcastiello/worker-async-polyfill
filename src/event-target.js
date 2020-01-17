// Create a map of all the even handlers.
const eventHandlerMap = new WeakMap();

/**
 * Define a class similar to the EventTarget but that can be extended.
 * @type {EventTarget}
 * @class
 */
class EventTarget {
    /**
     * Initialise the event map.
     * @constructor
     */
    constructor() {
        eventHandlerMap.set(this, {});
    }

    /**
     * Add a listener to a specific event.
     * @param {String} eventName
     * @param {Function} eventCallback
     */
    addEventListener(eventName, eventCallback) {
        const handlers = eventHandlerMap.get(this);
        if (!handlers.hasOwnProperty(eventName)) {
            handlers[eventName] = [];
        }

        if (handlers[eventName].indexOf(eventCallback) < 0) {
            handlers[eventName].push(eventCallback);
        }
    }

    /**
     * Remove a registered listener to a specific event.
     * @param {String} eventName
     * @param {Function} eventCallback
     */
    removeEventListener(eventName, eventCallback) {
        const handlers = eventHandlerMap.get(this);

        if (handlers.hasOwnProperty(eventName)) {
            const index = handlers[eventName].indexOf(eventCallback);

            if (index >= 0) {
                handlers[eventName].splice(index, 1);
            }
        }
    }

    /**
     * Dispatch an event.
     * @param {Event} event
     */
    dispatchEvent(event) {
        const eventName = event.type;
        const handlers = eventHandlerMap.get(this);

        if (handlers.hasOwnProperty(eventName)) {
            const callbacks = handlers[eventName].slice();

            for (let callback of callbacks) {
                callback(event);
            }
        }
    }
}

export default EventTarget;
