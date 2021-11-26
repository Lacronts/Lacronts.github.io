import {BACKSPACE_KEYCODE, MAX_ARR_LENGTH, MAX_ARR_ITEM_LENGTH} from "./Consts.js";
import sourceArray from "./SourceArray.js";

const root = document.getElementById('source-arr');

function init() {
    addInput();
    addChangeListeners();
}

function addInput() {
    const input = document.createElement('input');
    input.type = 'number';
    input.setAttribute('idx', getNextInputIdx());
    input.setAttribute('value', '');
    input.addEventListener('focus', handleInputFocus);
    input.addEventListener('blur', handleInputBlur);
    root.appendChild(input);
}

function getNextInputIdx() {
    const lastInput = root.lastElementChild;

    if (!lastInput) {
        return 0;
    }

    const lastInputIdx = +lastInput.getAttribute('idx');

    return lastInputIdx + 1;
}

function getElements() {
    return root.querySelectorAll('input');
}

function getElementsCount() {
    return getElements().length;
}

function getArrItemLength(value) {
    return value && value[0] === '-' ? MAX_ARR_ITEM_LENGTH + 1 : MAX_ARR_ITEM_LENGTH;
}

function addChangeListeners() {
    root.addEventListener('input', handleInput);
    root.addEventListener('keydown', handleKeyDown);
}

function recalculate(target) {
    root.removeChild(target);
    sourceArray.removeByIdx(target.getAttribute('idx'));

    const elements = getElements();

    for (let i = 0; i < elements.length; i++) {
        const isLast = elements.length - 1 === i;
        const el = elements[i];
        const currentIdx = +el.getAttribute('idx');
        const currentValue = +el.getAttribute('value');

        if (currentIdx !== i) {
            el.setAttribute('idx', i);
            currentValue !== +el.value && sourceArray.insert(+el.value, i);
        }

        if (isLast && currentValue && elements.length < MAX_ARR_LENGTH) {
            addInput();
        }
    }
}

function handleInput(event) {
    const {target} = event;
    const {value} = target;
    const maxItemLen = getArrItemLength(value);

    if (value.length <= maxItemLen) {
        const idx = +target.getAttribute('idx');
        const hasValue = !!value;

        if (hasValue) {
            event.target.setAttribute('value', +value);
            sourceArray.insert(+value, idx);
        } else {
            event.target.setAttribute('value', '');
        }

        if (value.length === maxItemLen) {
            document.querySelector(`#source-arr > input[idx="${Number(target.getAttribute('idx')) + 1}"]`)?.focus();
        }
    } else {
        event.target.value = event.target.getAttribute('value');
    }
}

function handleInputFocus(event) {
    const elementsCount = getElementsCount();
    const activeIdx = +event.target.getAttribute('idx');

    if (activeIdx < MAX_ARR_LENGTH - 1 && activeIdx === elementsCount - 1) {
        addInput();
    }
}

function handleInputBlur(event) {
    const elementsCount = getElementsCount();

    if (!event.target.value && elementsCount > 1) {
        recalculate(event.target);
    }
}

function handleKeyDown(event) {
    if (event.keyCode === BACKSPACE_KEYCODE) {
        const {value} = event.target;
        const idx = +event.target.getAttribute('idx');
        if (!value && idx > 0) {
            document.body.querySelector(`input[idx="${(idx - 1)}"]`).focus();
        }
    }
}

init();
