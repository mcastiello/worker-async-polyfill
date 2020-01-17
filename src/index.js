import './extendable-event-target.js';
import { Worker as PolyfillWorker } from './worker.js';

if (!self.Worker) {
    self.Worker = PolyfillWorker;
}
