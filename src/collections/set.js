
export class ObjectSet {
    constructor(...iterables) {
        this._items = new Map();
        for (let it of iterables)
            this.expand(it);
    }

    size() {
        return this._items.size;
    }

    has(x) {
        return this._has(x.toString());
    }

    _has(string) {
        return this._items.has(string);
    }

    add(x) {
        this._items.set(x.toString(), x)
        return this;
    }

    expand(iterable) {
        for (let x of iterable)
            this.add(x);
    }

    union(...iterables) {
        return new ObjectSet(this, ...iterables);
    }

    intersection(set) {
        let res = new ObjectSet();
        let iter = this, bag = set;
        if (this.size > set.size) {
            iter = set;
            bag = this;
        }
        for (let x of iter)
            if (bag.has(x))
                res.add(x);
        return res;
    }

    diff(set) {
        let res = new ObjectSet();
        for (let x of this)
            if (!set.has(x))
                res.add(x);
        return res;
    }

    delete(x) {
        return this._items.delete(x.toString);
    }

    clear() {
        this._items = new Map();
        return this;
    }

    isEmpty() {
        return this._items.size === 0;
    }

    [Symbol.iterator]() {
        return this._items.values();
    }

    values() {
        return this._items.values();
    }

    toString() {
        if (this.isEmpty())
            return '{}';
        let it = this._items.keys();
        let s = "{" + it.next().value;
        for (let x of it)
            s += ", " + x;
        return s + "}";
    }

    pop() {
        if (this.isEmpty())
            throw "called set.pop() on an empty set";
        let key = this._items.keys().next().value;
        let x = this._items.get(key);
        this._items.delete(key);
        return x;
    }
}