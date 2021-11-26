import {CanvasArray} from "./CanvasArray.js";

function swap(arr, i, j) {
    [arr[i], arr[j]] = [arr[j], arr[i]];

    return arr;
}

function createStartButton(root) {
    const button = document.createElement('button')
    button.classList.add('start-button');
    button.textContent = 'Начать сортировку';
    root.appendChild(button);

    return button;
}

function createCanvas(root) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext("2d");

    canvas.width = 1140;
    canvas.height = 400;
    canvas.classList.add('canvas');
    root.appendChild(canvas);

    ctx.font = '40px serif';
    ctx.textAlign="center";
    ctx.textBaseline = "middle";

    return ctx;
}

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    })
}

function getCancelFns() {
    let canceled = false;
    let intervalId;

    return {
        throwIfCanceled: function () {
            if (canceled) {
                canceled = false;
                throw {canceled: true}
            }
        },
        cancelSort: function () {
            canceled = true;
            return new Promise(resolve => {
                intervalId = setInterval(() => {
                    if (!canceled) {
                        clearInterval(intervalId);
                        resolve();
                    }
                }, 100);
            })
        }
    }
}

function init(id, sortFn, sourceArray, cancelSort, title = 'Название алгоритма сортировки') {
    const root = createRoot(id, title);
    const ctx = createCanvas(root);
    const canvasArray = new CanvasArray(ctx);
    let promise;

    const button = createStartButton(root);

    document.addEventListener("visibilitychange",  () => {
        if (document.hidden) {
            cancelSort().then(() => {
                canvasArray.reset([...sourceArray.getValue()]);
                promise = null;
            });
        }
    });

    button.addEventListener('click', async () => {
        const source = [...sourceArray.getValue()];
        if (promise) {
            button.classList.add('disabled');
            button.disabled = true;
            await cancelSort();
            button.classList.remove('disabled');
            button.disabled = false;
            promise = null;
        }
        canvasArray.reset(source);
        promise = sortFn(source).then(() => promise = null).catch(() => promise = null);
    });

    return canvasArray;
}

function createRoot(id, title) {
    const main = document.querySelector('main');
    const section = document.createElement('section');
    section.classList.add('section');

    const subheader = document.createElement('h6');
    subheader.classList.add('subheader');
    subheader.innerText = title;
    section.appendChild(subheader);

    const root = document.createElement('div');
    root.setAttribute('id', id);
    section.appendChild(root);

    main.appendChild(section);

    return root;
}

export default {
    swap,
    sleep,
    getCancelFns,
    init,
}
