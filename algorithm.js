// LRUCache (least recently use)最近使用
class LRUCache {
    constructor(capacity) {
        this.capacity = capacity;
        this.cache = new Map();
    }

    get(key) {
        if (!this.cache.has(key)) return null;
        const temp = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, temp);
        return temp;
    }

    set(key, value) {
        if (this.cache.has(key)) {
            this.cache.delete(key);
            this.cache.set(key, value);
        } else {
            if (this.cache.size >= this.capacity) {
                let firstKey = this.cache.keys().next();
                this.cache.delete(firstKey.value);
                this.cache.set(key, value);
            } else {
                this.cache.set(key, value);
            }
        }
    }
}

// LFUCache (least frequently use)最频繁使用
class LFUCache {
    constructor(capacity) {
        this.capacity = capacity;
        this.cache = new Map();
        // cache中值的数据结构 {value: <需要记录的值>, freq: <当前这一项对应的使用频次>}
    }

    get(key) {
        if (!this.cache.has(key)) return null;
        const res = this.cache.get(key);
        res.freq += 1;
        // 这里之所以要delete是为了实现在频次相同时删除最近未使用的
        this.cache.delete(key);
        this.cache.set(key, res);
        return res;
    }

    set(key, value) {
        if (this.cache.has(key)) {
            const res = this.cache.get(key);
            res.value = value;
            res.freq += 1;
            // 这里之所以要delete是为了实现在频次相同时删除最近未使用的
            this.cache.delete(key);
            this.cache.set(key, res);
        } else {
            if (this.cache.size >= this.capacity) {
                // 未命中且超出长度限制，找到使用频次最少的那一项然后删除掉，再将新的添加
                const resArr = Array.from(this.cache.keys());
                let min = -Infinity;
                let index = -1;
                for(let i = 0; i < resArr.length; i++) {
                    const target = this.cache.get(resArr[i]);
                    if (min < target.freq) {
                        min = target.freq;
                        index = i;
                    }
                }
                const deleteItem = resArr[index];
                this.cache.delete(deleteItem);
                this.cache.set(key, {
                    value: value,
                    freq: 1,
                });
            } else {
                this.cache.set(key, {
                    value: value,
                    freq: 1,
                });
            }
        }
    }
}


// BinaryHeap
class BinaryHeap {
    constructor(compare) {
        this.compare = compare;
        this.data = [];
    }

    insert(value) {
        this.insertAt(this.data.length, value);
    }

    insertAt(index, value) {
        if (index > this.data.length) return;
        this.data[index] = value;
        while (index > 0 && this.compare(this.data[index], this.data[Math.floor((index - 1) / 2)]) < 0) {
            this.data[index] = this.data[Math.floor((index - 1) / 2)];
            this.data[Math.floor((index - 1)/ 2)] = value;
            index = Math.floor((index - 1) / 2);
        }
    }

    deleteItem(index) {
        if (index >= this.data.length) return;
        while (index < this.data.length) {
            let left = index *2 + 1;
            let right = index * 2 + 2;
            if (left >= this.data.length) break;
            if (right >= this.data.length) {
                this.data[index] = this.data[left];
                index = left;
            }
            if (this.compare(this.data[left], this.data[right]) < 0) {
                this.data[index] = this.data[left];
                index = left;
            } else {
                this.data[index] = this.data[right];
                index = right;
            }
        }

        if (index < this.data.length - 1) {
            this.insertAt(index, this.data.pop());
        } else {
            this.data.pop();
        }
    }
}