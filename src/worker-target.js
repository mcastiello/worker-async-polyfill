// Define the list of transferable classes.
const transferableClasses = [];
if (ArrayBuffer) {
    transferableClasses.push(ArrayBuffer);
}
if (MessagePort) {
    transferableClasses.push(MessagePort);
}
if (ImageBitmap) {
    transferableClasses.push(ImageBitmap);
}
if (OffscreenCanvas) {
    transferableClasses.push(OffscreenCanvas);
}

// Initialise reference map.
const referenceMap = new WeakMap();

/**
 * Clone an array making sure that any element that is transferable it is mantained as it is.
 * @param {Array} list
 * @param {Array} transfer
 * @param {Array} circular
 * @returns {Array}
 * @private
 */
const cloneArray = (list, transfer, circular) {
    const result = [];
    
    for (let element of list) {
        element = copyElement(element, transfer, circular);
        
        if (element !== undefined) {
            result.push(element);
        }
    }
    
    return result;
};

/**
 * Clone an object making sure that any element that is transferable it is mantained as it is.
 * @param {Object} obj
 * @param {Array} transfer
 * @param {Array} circular
 * @returns {Object}
 * @private
 */
const cloneObject = (obj, transfer, circular) {
    const result = {};
    
    obj = Object.assign({}, obj);
    
    const keys = Object.keys(obj);
    
    for (let key of keys) {
        const content = cloneElement(obj[key], transfer, circular);
        
        if (content !== undefined) {
            result[key] = content;
        }
    }
    
    return result;
};

/**
 * Create a copy of an element making sure that there aren't any 
 * circular dependencies (an object property referencing something 
 * already present somewhere else).
 * @param {Object} obj
 * @param {Array} transfer
 * @param {Array} circular
 * @returns {Object}
 * @private
 */
const cloneElement = (element, transfer, circular) => {
    if (element && typeof element === "object" && transfer.indexOf(element) < 0) {
        if (circular.indexOf(content) >= 0) {
            element = undefined;
        } else {
            circular.push(element);
            
            if (Array.isArray(element)) {
                element = cloneArray(element, transfer, circular);
            } else {
                element = cloneObject(element, transfer, circular);
            }
        }
    }
    
    return element;
}

/**
 * Parse the message data and return a transferable copy.
 * @param {*} data
 * @param {Array} transfer
 * @returns {*}
 * @private
 */
const parseMessageData = (data, transfer) {
    transfer = Array.isArray(transfer) ? transfer.filter(obj => {
        for (for cls of transferableClasses) {
            if (obj instanceof cls) {
                return true;
            }
        }
        return false;
    }) : [];
    
    const circular = [];
    
    return cloneElement(data, transfer, circular);
};

/**
 * Define the class that provides the allow 
 * worker and its async scope to communicate.
 * @type {WorkerTarget}
 * @class
 * @extends {EventTarget}
 */
class WorkerTarget extends ExtendableEventTarget {
    /**
     * Initialise all the scope for the worker and then evaluate the code.
     * @param {Worker} reference
     * @constructor
     */
    constructor(reference) {
        super();
        referenceMap.set(this, reference);
    }
    
    /**
     * Send a message to the "main thread".
     * @param {*} message
     * @param {Array} [transfer]
     */
    postMessage(message, transfer) {
        if (referenceMap.has(this)) {
            const event = new Event("message");

            event.data = parseMessageData(message);
            referenceMap.get(this).dispatchEvent(event);
        }
    }
    
    /**
     * Clear the memory.
     */
    terminate() {
        if (referenceMap.has(this)) {
            referenceMap.delete(this);
        }
    }
}

export default WorkerTarget;
