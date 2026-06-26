import EventEmitter from "events";

class AppEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
  }
}

const eventEmitter = new AppEventEmitter();

export default eventEmitter;