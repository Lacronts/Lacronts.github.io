import utils from './Utils.js';
import sourceArray from './SourceArray.js';

const root = document.getElementById('merge-sort');
const {throwIfCanceled, cancelSort} = utils.getCancelFns();
const canvasArray = utils.init(root, mergeSort, sourceArray, cancelSort, 'Сортировка слиянием');

async function mergeSort(arr, offset = 0) {
    if (arr.length <= 1) return arr;

    let middle = Math.floor(arr.length / 2);

    let left = arr.slice(0, middle);
    let right = arr.slice(middle);
    const rightOffset = offset + middle;

    throwIfCanceled();
    return await mergeSortedArrays(await mergeSort(left, offset), await mergeSort(right, rightOffset), offset, rightOffset);
}

async function mergeSortedArrays(arr1, arr2, arr1Offset, arr2Offset) {
    let newArray = [];

    let index1 = 0;
    let index2 = 0;

    while(index1 < arr1.length && index2 < arr2.length) {
        let min = null;
        throwIfCanceled();
        await canvasArray.select(index1 + arr1Offset, index2 + arr2Offset);

        if (arr1[index1] < arr2[index2]) {
            throwIfCanceled();
            await canvasArray.cloneItems({targetIdx: newArray.length + arr1Offset, idxs: [index1 +arr1Offset]});
            min = arr1[index1];
            index1++;
        } else {
            throwIfCanceled();
            await canvasArray.cloneItems({targetIdx: newArray.length + arr1Offset, idxs: [index2 +arr2Offset]});
            min = arr2[index2];
            index2++;
        }

        newArray.push(min);
    }

    const rest1 = arr1.slice(index1);
    const rest2 = arr2.slice(index2);
    const targetIdx1 = newArray.length + arr1Offset;
    const targetIdx2 = targetIdx1 + rest1.length;

    const idxs1 = rest1.map((_, idx) => index1 + arr1Offset + idx);
    const idxs2 = rest2.map((_, idx) => index2 + arr2Offset + idx);

    throwIfCanceled();
    await canvasArray.cloneItems({targetIdx: targetIdx1, idxs: idxs1, wait: 700});
    throwIfCanceled();
    await canvasArray.cloneItems({targetIdx: targetIdx2, idxs: idxs2, wait: 700});

    throwIfCanceled();
    await utils.sleep(500);

    throwIfCanceled();
    await canvasArray.replaceItemsWithCloned();

    throwIfCanceled();
    await canvasArray.unselectAll();

    return [...newArray, ...rest1, ...rest2];
}
