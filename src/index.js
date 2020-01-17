import './extendable-event-target';
import PolyfillWorker from './worker';

if (!self.Worker) {
    self.Worker = PolyfillWorker;
}
