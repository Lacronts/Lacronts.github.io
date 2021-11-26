import utils from './Utils.js';
import sourceArray from './SourceArray.js';

const root = document.getElementById('insertion-sort');
const {throwIfCanceled, cancelSort} = utils.getCancelFns();
const canvasArray = utils.init(root, insertionSort, sourceArray, cancelSort, 'Сортировка вставкой');

async function insertionSort(arr) {
    const res = [...arr];

    for (let j = 1; j < res.length; j++) {
        const key = res[j];
        let i = j - 1;

        throwIfCanceled();
        await canvasArray.unselectAll();
        throwIfCanceled();
        await canvasArray.pullOut(j);
        throwIfCanceled();
        await utils.sleep(200);

        while (i >= 0) {
            throwIfCanceled();
            await canvasArray.select(i);

            if (res[i] > key) {

                res[i + 1] = res[i];

                throwIfCanceled();
                await canvasArray.moveItemTo(i, i + 1);

                i = i - 1;
            } else {
                break;
            }
        }

        if (key === res[i + 1]) {
            throwIfCanceled();
            await canvasArray.pullIn();
        } else {
            throwIfCanceled();
            await canvasArray.moveIsPulledOutItemTo(i + 1);
        }

        throwIfCanceled();
        await canvasArray.unselectAll();
        res[i + 1] = key;
    }

    throwIfCanceled();
    await canvasArray.unselectAll();
}
