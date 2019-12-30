
export class ListNode {
    constructor(value, {prev=null, next = null} = {}) {
        this.value = value;
        this.next = next;
        this.prev = prev;
    }
}

/**
 * The only reason this class exists is that my connection died and I could not
 * download an external library. So I thought: why not implementing a Deque for
 * 11325th time in my life as an exercise? :]
 */
export class Deque {
    constructor({maxLength = Number.POSITIVE_INFINITY} = {}) {
        if (maxLength == null || maxLength <= 0)
            throw new Error('maxLength must be > 0');
        this.leftEnd = null;
        this.rightEnd = null;
        this._length = 0;
        this.maxLength = maxLength;
    }

    get length() {
        return this._length;
    }

    _checkNonEmpty(err='empty queue') {
        if (this._length === 0) throw new Error(err);
    }

    isEmpty() {
        return this._length === 0;
    }

    isNotEmpty() {
        return this._length !== 0;
    }

    isFull() {
        return this._length === this.maxLength;
    }

    isNotFull() {
        return this._length !== this.maxLength;
    }

    pushRight(value) {
        if (this.isEmpty()) {
            this.leftEnd = new ListNode(value);
            this.rightEnd = this.leftEnd;
        } else {
            let node = new ListNode(value);
            node.prev = this.rightEnd;
            this.rightEnd.next = node;
            this.rightEnd = node;
        }
        this._length++;
        if (this._length > this.maxLength)
            return this.popLeft();
        return null;
    }

    pushLeft(value) {
        if (this.isEmpty()) {
            this.leftEnd = this.rightEnd = new ListNode(value);
        } else {
            let node = new ListNode(value);
            node.next = this.leftEnd;
            this.leftEnd.prev = node;
            this.leftEnd = node;
        }
        this._length++;
        if (this._length > this.maxLength)
            return this.popRight();
        return null;
    }

    popLeft() {
        this._checkNonEmpty();
        let value = this.leftEnd.value;
        this.leftEnd = this.leftEnd.next;
        this._length--;
        if (this.length === 0)
            this.rightEnd = null;
        else
            this.leftEnd.prev = null;
        return value;
    }

    popRight() {
        this._checkNonEmpty();
        let value = this.rightEnd.value;
        this.rightEnd = this.rightEnd.prev;
        this._length--;
        if (this.length === 0)
            this.leftEnd = null;
        else
            this.rightEnd.next = null;
        return value;
    }

    peekLeft() {
        this._checkNonEmpty();
        return this.leftEnd.value;
    }

    peekRight() {
        this._checkNonEmpty();
        return this.rightEnd.value;
    }

    clear() {
        this.leftEnd = this.rightEnd = null;
        this._length = 0;
    }

    [Symbol.iterator]() {
        let node = this.leftEnd;
        return {
            next: () => {
                if (node == null) return {done: true};
                let out = node.value;
                node = node.next;
                return {value: out, done: false};
            }
        }
    }

    leftToRight() {
        return this[Symbol.iterator]();
    }

    rightToLeft() {
        let node = this.rightEnd;
        return {
            next: () => {
                if (node == null) return {done: true};
                let out = node.value;
                node = node.prev;
                return {value: out, done: false};
            }
        }
    }

    toString() {
        return `Deque([${[...this]}])`
    }
}