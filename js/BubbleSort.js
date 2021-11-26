import utils from './Utils.js';
import sourceArray from './SourceArray.js';

const root = document.getElementById('bubble-sort');
const {throwIfCanceled, cancelSort} = utils.getCancelFns();
const canvasArray = utils.init(root, bubbleSort, sourceArray, cancelSort, 'Сортировка пузырьком');

async function bubbleSort(arr) {
    for (let i = 0; i < arr.length - 1; i++) {
        for(let j = arr.length - 1; j >= i + 1; j--) {
            throwIfCanceled()
            await canvasArray.select(i, j);

            if (arr[j] < arr[i]) {
                throwIfCanceled()
                await canvasArray.swap(i, j);
                utils.swap(arr, i, j);
            }
        }
    }
    throwIfCanceled();
    await canvasArray.unselectAll();
}
