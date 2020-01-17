/*
 * Copyright (c) 2020
 * Author: Marco Castiello
 * E-mail: marco.castiello@gmail.com
 * Project: Worker Async Polyfill
 */

import './extendable-event-target.js';
import { Worker as PolyfillWorker } from './worker.js';

if (!self.Worker) {
    self.Worker = PolyfillWorker;
}
