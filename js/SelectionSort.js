import utils from './Utils.js';
import sourceArray from './SourceArray.js';

const root = document.getElementById('selection-sort');
const {throwIfCanceled, cancelSort} = utils.getCancelFns();
const canvasArray = utils.init(root, selectionSort, sourceArray, cancelSort, 'Сортировка выбором');

async function selectionSort(arr) {
    const res = [...arr];

    for (let i = 0; i < res.length - 1; i++) {
        let min = i;
        throwIfCanceled();
        await canvasArray.mark(i, 'red');

        for (let j = i + 1; j < res.length; j++) {
            throwIfCanceled();
            await canvasArray.select(i, j);

            if (res[min] > res[j]) {
                min = j;
                throwIfCanceled();
                await canvasArray.mark(j, 'red', i);
            } else {
                throwIfCanceled();
                await canvasArray.unselect(j);
            }
        }

        if (min !== i) {
            throwIfCanceled();
            await canvasArray.swap(i, min);
            utils.swap(res, i, min);
        } else {
            throwIfCanceled();
            await canvasArray.unMark('red');
        }

        throwIfCanceled();
        await canvasArray.unselectAll();
    }
}
