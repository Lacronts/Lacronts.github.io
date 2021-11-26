import {ANIMATION_DIRECTION} from './Consts.js';
import utils from './Utils.js';
import {eventBus, EVENT_NAMES} from "./EventBus.js";

export class CanvasArray {
    _canvasArrayItems = [];
    _clonedItems = [];
    _pulledOutItem;
    _marked = {};

    constructor(ctx) {
        this.ctx = ctx;
        eventBus.subscribe(EVENT_NAMES.UPDATE_ARRAY, this.drawItems);
    }

    drawItems = (newArray) => {
        const {shouldChangeList, shouldRemoveList} = this.getArrayDiff(this.getSourceArray(), newArray);

        for (let i = 0; i < shouldChangeList.length; i++) {
            const value = shouldChangeList[i].value;
            const idx = shouldChangeList[i].idx;
            const item = new CanvasArrayItem(this.ctx, idx, value);
            item.draw();
            this._canvasArrayItems[idx] = item;
        }

        for (let i = 0; i < shouldRemoveList.length; i++) {
            const idx = shouldRemoveList[i].idx;
            this._canvasArrayItems[idx].clear();
            this._canvasArrayItems.splice(idx, 1);
        }
    }

    getArrayDiff(prev, next) {
        const shouldChangeList = [];
        const shouldRemoveList = [];
        const length = Math.max(next.length, prev.length);

        for (let i = 0; i < length; i++) {
            if (next[i] !== prev[i]) {
                next[i] === undefined ? shouldRemoveList.push({idx: i}): shouldChangeList.push({idx: i, value: next[i]});
            }
        }

        return {shouldChangeList, shouldRemoveList};
    }

    getSourceArray() {
        return this._canvasArrayItems.map(item => item.getValue());
    }

    async mark(idx, color, selectedIdx) {
        if (Number.isInteger(this._marked[color]) && this._marked[color] !== idx) {
            await Promise.all([this._canvasArrayItems[this._marked[color]]?.unselect(), this._canvasArrayItems[idx]?.unselect()]);
        }

        const promises = [this._canvasArrayItems[idx].select(color)];

        if (Number.isInteger(selectedIdx) && this._marked[color] === selectedIdx) {
            promises.push(this._canvasArrayItems[selectedIdx].select());
        }

        this._marked[color] = idx;

        return Promise.all(promises);
    }

    async unMark(color) {
        if (this._marked[color]) {
            const promise = this._canvasArrayItems[this._marked[color]].unselect();
            this._marked[color] = null;

            return promise;
        }
    }

    async select(...idxs) {
        const markedIdxs = Object.values(this._marked);
        await Promise.all(this._canvasArrayItems.map((item, idx) => !idxs.includes(idx) && !markedIdxs.includes(idx) && item?.unselect()));

        return Promise.all(idxs.map(idx => this._canvasArrayItems[idx]?.select()));
    }

    unselect(...idxs) {
        return Promise.all(this._canvasArrayItems.map((item, idx) => idxs.includes(idx) && item?.unselect()));
    }

    unselectAll() {
        this._marked = {};
        return Promise.all(this._canvasArrayItems.map(item => item?.unselect()));
    }

    moveItemTo(idx, newIdx, shouldClearPrev = true) {
        const item = new CanvasArrayItem(this.ctx, idx, this._canvasArrayItems[idx].value, true, this._canvasArrayItems[idx].backgroundColor);
        const nextPosition = CanvasArrayItem.getPosition(newIdx);

        return item.moveTo(nextPosition, newIdx - idx > 0 ? Math.PI * 1.5 : Math.PI / 2).then(() => {
            this._canvasArrayItems[newIdx] = item;

            const markedKeys = Object.keys(this._marked);

            if (markedKeys.length) {
                markedKeys.forEach((color) => {
                    if (this._marked[color] === idx) {
                        this._marked[color] = newIdx;
                    }
                })
            }

            if (shouldClearPrev) {
                this._canvasArrayItems[idx] = null;
            }
        });
    }

    moveIsPulledOutItemTo(newIdx) {
        const nextPosition = CanvasArrayItem.getPosition(newIdx);
        return this._pulledOutItem.moveTo(nextPosition, Math.PI / 2).then(() => {
            this._canvasArrayItems[newIdx] = this._pulledOutItem;
            this._pulledOutItem = null;
        });
    }

    swap(i, j) {
        return Promise.all([this.moveItemTo(i, j, false), this.moveItemTo(j, i, false)]);
    }

    pullOut(idx) {
        return new Promise(resolve => {
            this._pulledOutItem = new CanvasArrayItem(this.ctx, idx, this._canvasArrayItems[idx].getValue(), true);
            this._canvasArrayItems[idx] = null;
            return this._pulledOutItem.pullOutElement(resolve, ANIMATION_DIRECTION.TOP);
        })
    }

    pullIn() {
        return new Promise(resolve => {
            const {idx} = this._pulledOutItem.getPosition();
            this._pulledOutItem.pullInElement(idx, ANIMATION_DIRECTION.BOTTOM, resolve);
            this._canvasArrayItems[idx] = this._pulledOutItem;
        }).then(() => {this._pulledOutItem = null})
    }

    async cloneItems({targetIdx, wait, idxs}) {
        for (let i = 0; i < idxs.length; i++) {
            if (wait) {
                await utils.sleep(wait);
            }
            const sourceIdx = idxs[i];
            const cloned = new CanvasArrayItem(this.ctx, targetIdx + i, this._canvasArrayItems[sourceIdx].getValue(), true);
            cloned.y = CanvasArrayItem.initialY + CanvasArrayItem.height + 10;
            cloned.drawSelected();
            this._clonedItems.push(cloned);
        }
    }

    replaceItemsWithCloned() {
        const promises = this._clonedItems.map(item => {
            return new Promise(resolve => {
                const {idx} = item.getPosition();
                item.pullInElement(idx, ANIMATION_DIRECTION.TOP, resolve);
                this._canvasArrayItems[idx] = item;
            })
        });

        this._clonedItems = [];

        return Promise.all(promises);
    }

    reset(sourceArray) {
        this.ctx.clearRect(0,0, this.ctx.canvas.width, this.ctx.canvas.height);
        this._canvasArrayItems = [];
        this.drawItems(sourceArray);
    }
}

 class CanvasArrayItem {
    static xGap = 20;
    static initialX = 30;
    static initialY = 150;
    static width = 90;
    static height = 95;
    static getPosition(idx) {
        if (idx === 0) {
            return {x: CanvasArrayItem.initialX, y: CanvasArrayItem.initialY, idx};
        }

        return {x: CanvasArrayItem.initialX + (CanvasArrayItem.width + CanvasArrayItem.xGap) * idx, y: CanvasArrayItem.initialY, idx};
    }

    radius = 14;
    isPulledOut = false;
    isSelected = false;
    raf;
    backgroundColor = 'orange';

    constructor(ctx, idx, value, isSelected = false, backgroundColor = 'orange') {
        this.setCoordsByIdx(idx);
        this.ctx = ctx;
        this.value = value;
        this.isSelected = isSelected;
        this.backgroundColor = backgroundColor;
    }

     setCoordsByIdx(newIdx) {
         this.idx = newIdx;
         const {x, y} = this.getPosition();
         this.x = x;
         this.y = y;
     }

     drawSelected(withClear = false) {
        this.draw(1, withClear);
     }

    draw(alpha = 0, withClear = true, backgroundColor = this.backgroundColor) {
        alpha = Math.max(Math.min(1, alpha), 0);
        const textAlpha = Math.max(0, 1 - alpha * 2);

        withClear && this.clear();
        this.ctx.beginPath();
        this.ctx.moveTo(this.x + this.radius, this.y);
        this.ctx.lineTo(this.x + CanvasArrayItem.width - this.radius, this.y);
        this.ctx.quadraticCurveTo(this.x + CanvasArrayItem.width, this.y, this.x + CanvasArrayItem.width, this.y + this.radius);
        this.ctx.lineTo(this.x + CanvasArrayItem.width, this.y + CanvasArrayItem.height - this.radius);
        this.ctx.quadraticCurveTo(this.x + CanvasArrayItem.width, this.y + CanvasArrayItem.height, this.x + CanvasArrayItem.width - this.radius, this.y + CanvasArrayItem.height);
        this.ctx.lineTo(this.x + this.radius, this.y + CanvasArrayItem.height);
        this.ctx.quadraticCurveTo(this.x, this.y + CanvasArrayItem.height, this.x, this.y + CanvasArrayItem.height - this.radius);
        this.ctx.lineTo(this.x, this.y + this.radius);
        this.ctx.quadraticCurveTo(this.x, this.y, this.x + this.radius, this.y);
        this.ctx.closePath();
        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle = backgroundColor;
        this.ctx.fill();
        this.ctx.globalAlpha = textAlpha > 0 ? textAlpha: 1;
        this.ctx.fillStyle = textAlpha > 0 ? 'black' : 'white';
        this.ctx.fillText(this.value, this.x + CanvasArrayItem.width / 2,this.y + 50);
        this.ctx.globalAlpha = 1;
        this.ctx.fillStyle = 'black';
        this.ctx.stroke();
    }

    select(color) {
        if (this.isSelected) return Promise.resolve();
        if (color) this.backgroundColor = color;

        return new Promise(resolve => {
            let step = 0;

            const selectAnimation = () => {
                if (step < 1) {
                    step+=.1;
                    this.draw(step, true, color);
                    this.raf = requestAnimationFrame(selectAnimation);
                } else {
                    this.isSelected = true;
                    cancelAnimationFrame(this.raf);
                    setTimeout(resolve, 500);
                }
            }

            this.raf = requestAnimationFrame(selectAnimation);
        })
    }

    unselect() {
        if (!this.isSelected) return Promise.resolve();

        return new Promise(resolve => {
            let step = 1;

            const unselectAnimation = () => {
                if (step > 0) {
                    step-=.1;
                    this.draw(step);
                    this.raf = requestAnimationFrame(unselectAnimation);
                } else {
                    this.isSelected = false;
                    this.backgroundColor = 'orange';
                    cancelAnimationFrame(this.raf);
                    setTimeout(resolve, 400)
                }
            }

            this.raf = requestAnimationFrame(unselectAnimation);
        })
    }

    moveTo(nextPosition, rad) {
        return new Promise((resolve) => {
            const minX = Math.min(nextPosition.x, this.x);
            const centerX = Math.abs(nextPosition.x - this.x) / 2
            const startX = minX + centerX;
            const xPrecision = 1;
            let start = rad;
            let centerY = this.isPulledOut ? nextPosition.y - CanvasArrayItem.height : nextPosition.y;
            let startY = this.y;

            const endPullOutAnimation = (direction) => {
                centerY = direction === ANIMATION_DIRECTION.BOTTOM ? nextPosition.y - CanvasArrayItem.height : this.y;
                startY = this.y;
                this.raf = requestAnimationFrame(animation);
            }

            const pullOutAnimation = () => {
                if (rad > Math.PI) {
                    this.pullOutElement(endPullOutAnimation, ANIMATION_DIRECTION.BOTTOM);
                } else {
                    this.pullOutElement(endPullOutAnimation, ANIMATION_DIRECTION.TOP);
                }
            }

            const elipsisAnimation = () => {
                start += .1;
                this.clear();
                this.x = startX + centerX * Math.sin(start);
                this.y = startY + centerY * Math.cos(start);
                this.drawSelected()

                if (Math.abs(this.x - nextPosition.x) <= xPrecision) {
                    this.clear();
                    this.drawSelected();
                    this.raf = requestAnimationFrame(pullInAnimation);
                    return;
                }

                this.raf = requestAnimationFrame(elipsisAnimation);
            }

            const pullInAnimation = () => {
                if (rad > Math.PI) {
                    this.pullInElement(nextPosition.idx, ANIMATION_DIRECTION.TOP, resolve);
                } else {
                    this.pullInElement(nextPosition.idx, ANIMATION_DIRECTION.BOTTOM, resolve);
                }
            }

            const animation = () => {
                if (this.isPulledOut) {
                    elipsisAnimation();
                } else {
                    pullOutAnimation();
                }
            }

            this.raf = requestAnimationFrame(animation);
        });
    }

    pullOutElement(endCb, direction) {
        const isTopDirection = direction === ANIMATION_DIRECTION.TOP;
        const condition = isTopDirection ? this.y >= CanvasArrayItem.initialY - CanvasArrayItem.height - 2 : this.y <= CanvasArrayItem.initialY + CanvasArrayItem.height + 2;

        if (condition) {
            this.isPulledOut = true;
            this.clear();
            this.y = isTopDirection ? this.y - 6 : this.y + 6;
            this.drawSelected();
            this.raf = requestAnimationFrame(() => this.pullOutElement(endCb, direction));
        } else {
            endCb ? endCb(direction) : cancelAnimationFrame(this.raf);
        }
    }

    pullInElement(nextIdx, direction, callback) {
        const yPrecision = 12;
        const isTopDirection = direction === ANIMATION_DIRECTION.TOP;

        if (Math.abs(this.y - CanvasArrayItem.initialY) > yPrecision) {
            this.clear();
            this.y = isTopDirection ? this.y - 6 : this.y + 6;
            this.drawSelected();
            this.raf = requestAnimationFrame(() => this.pullInElement(nextIdx, direction, callback));
        } else {
            this.isPulledOut = false;
            this.clear();
            this.setCoordsByIdx(nextIdx);
            this.drawSelected();
            cancelAnimationFrame(this.raf);
            callback && callback();
        }
    }

    clear() {
        this.ctx.clearRect(
            this.x - this.ctx.lineWidth,
            this.y - this.ctx.lineWidth,
            CanvasArrayItem.width + 2 * this.ctx.lineWidth,
            CanvasArrayItem.height + 2 * this.ctx.lineWidth
        );
    }

     getPosition() {
        if (this.idx === 0) {
            return {x: CanvasArrayItem.initialX, y: CanvasArrayItem.initialY, idx: this.idx};
        }

        return {x: CanvasArrayItem.initialX + (CanvasArrayItem.width + CanvasArrayItem.xGap) * this.idx, y: CanvasArrayItem.initialY, idx: this.idx};
    }

    getValue() {
        return this.value;
    }
}
