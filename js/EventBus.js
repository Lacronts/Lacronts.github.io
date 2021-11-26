const EVENT_NAMES = {
    CANCEL_SORT: 'CANCEL_SORT',
    UPDATE_ARRAY: 'UPDATE_ARRAY',
}

class EventBus {
    listeners = {};

    subscribe(eventName, callback) {
        if (!this.listeners[eventName]) {
            this.listeners[eventName] = [callback];
        } else if (this.listeners[eventName].indexOf(callback) === -1) {
            this.listeners[eventName].push(callback);
        }

        return () => this.unsubscribe(eventName, callback);
    }

    unsubscribe(eventName, callback) {
        this.listeners[eventName]?.splice(this.listeners[eventName].indexOf(callback), 1);
    }

    emit(eventName, args) {
        this.listeners[eventName]?.forEach((callback) => callback(args));
    }
}

const eventBus = new EventBus();

export {eventBus, EVENT_NAMES};
