import {eventBus, EVENT_NAMES} from "./EventBus.js";

class SourceArray {
    _array = [];

    insert(item, idx) {
        this._array[idx] = item;
        this._emit();
    }

    removeByIdx(idx) {
        this._array.splice(idx, 1);
        this._emit();
    }

    getValue() {
        return this._array;
    }

    _emit() {
        eventBus.emit(EVENT_NAMES.UPDATE_ARRAY, this.getValue());
    }
}

export default new SourceArray();
