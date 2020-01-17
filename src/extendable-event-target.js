/*
 * Copyright (c) 2020
 * Author: Marco Castiello
 * E-mail: marco.castiello@gmail.com
 * Project: Worker Async Polyfill
 */

import { EventTarget as PolyfillEventTarget } from './event-target.js';
    
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
