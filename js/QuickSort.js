import utils from './Utils.js';
import sourceArray from "./SourceArray.js";

const root = document.getElementById('quick-sort');
const {throwIfCanceled, cancelSort} = utils.getCancelFns();
const canvasArray = utils.init(root, quickSort, sourceArray, cancelSort, 'Быстрая сортировка');

async function quickSort(arr, start, end) {
    if (start === undefined) start = 0;
    if (end === undefined) end = arr.length - 1;

    if (start >= end) return;

    // индекс опорного элемента
    let pivot = await partition(arr, start, end);

    // рекурсивная сортировка подмассивов
    await quickSort(arr, start, pivot - 1);
    await quickSort(arr, pivot + 1, end);
}

async function partition(arr, start, end) {
    // Берем в качестве опорного последний элемент подмассива
    let pivotValue = arr[end];
    throwIfCanceled();
    await canvasArray.mark(end, 'black');

    // изначально считаем, что pivotValue минимальное значение
    // и должно находиться в начале массива
    let pivotIndex = start;
    throwIfCanceled();
    await canvasArray.mark(pivotIndex ,'red');

    // перебираем все элементы
    for (let i = start; i < end; i++) {
        if (i !== start) {
            throwIfCanceled();
            await canvasArray.select(i);
        }

        // значения меньше опорного перемещаем перед ним
        if (arr[i] < pivotValue) {
            if (i !== pivotIndex) {
                throwIfCanceled();
                await canvasArray.swap(i, pivotIndex);
                utils.swap(arr, i, pivotIndex);
            }
            pivotIndex++;

            if (pivotIndex !== end) {
                throwIfCanceled();
                await canvasArray.mark(pivotIndex ,'red');
            }
        }
    }

    // ставим опорный элемент в нужное место
    if (pivotIndex !== end && pivotValue !== arr[pivotIndex]) {
        throwIfCanceled();
        await canvasArray.select(pivotIndex, end);
        throwIfCanceled();
        await canvasArray.swap(pivotIndex, end);
        utils.swap(arr, pivotIndex, end);
    }

    throwIfCanceled();
    await canvasArray.unselectAll();

    return pivotIndex;
}
