class KPromise {
    constructor(handle) {
        this.resolveFnQueue = [];
        this.rejectFnQueue = [];
        this.finallyFnQueue = [];
        this['[[promiseStatus]]'] = 'pending';
        this['[[promiseResult]]'] = undefined;
        handle(this._resolve.bind(this), this._reject.bind(this));
    }

    _resolve(value) {
        this['[[promiseStatus]]'] = 'fulfilled';
        this['[[promiseResult]]'] = value;

        const run = () => {
            let cb;
            while((cb = this.resolveFnQueue.shift())) {
                // cb需要resolve函数的参数来作为自己的参数，因为cb是then里面的onresolved函数
                cb && cb(value);
            }
            while((cb = this.finallyFnQueue.shift())) {
                cb && cb();
            }
            // 因为promise.then是微任务，所以这里run执行的话并需要套在微任务当中，所以不能用setTimeout
            const ob = new MutationObserver(run);
            ob.observe(document.body, {
                attributes: true,
            });
            document.body.setAttribute('name', 'xxx');
        }
        
    }

    _reject(err) {
        this['[[promiseStatus]]'] = 'rejected';
        this['[[promiseResult]]'] = err;

        const run = () => {
            let cb;
            while((cb = this.rejectFnQueue.shift())) {
                // cb需要resolve函数的参数来作为自己的参数，因为cb是then里面的onrejected函数
                cb && cb(err);
            }
            while((cb = this.finallyFnQueue.shift())) {
                cb && cb();
            }
            // 因为promise.then是微任务，所以这里run执行的话并需要套在微任务当中，所以不能用setTimeout
            const ob = new MutationObserver(run);
            ob.observe(document.body, {
                attributes: true,
            });
            document.body.setAttribute('name', 'xxx');
        }
    }

    then(onResolved, onRejected) {
        // 这里之所以使用队列，是为了解决多个then的情况，多个then类似addEventListener那样多个函数注册不会覆盖而是会都执行
        this.resolveFnQueue.push(onResolved);
        this.rejectFnQueue.push(onRejected);

        // 1. onResolved要拿到_resolve的参数作为自己的参数
        // 2. then需要在_resolve执行完之后执行
        // 综上，onResolved函数放到_resolve函数里面执行

        // 3. then返回一个KPromise，这个KPromise的promiseResult为onResolved函数的返回值
        // 3.1 所以需要重新组装resolveFnQueue队列里面的函数
        return new KPromise((resolve, reject) => {
            const resolveFn = val => {
                let res = onResolved && onResolved(val);
                if (res instanceof KPromise) {
                    res.then(resolve);
                } else {
                    resolve(res);
                }
            };
            this.resolveFnQueue.push(resolveFn);
            const rejectFn = err => {
                let res = onRejected && onRejected(err);
                reject(res);
            };
            this.rejectFnQueue.push(rejectFn);
        });
    }

    catch(onRejected) {
        return new KPromise((resolve, reject) => {
            const rejectFn = err => {
                onRejected && onRejected(err);
            };
            this.rejectFnQueue.push(rejectFn);
        });
    }

    finally(cb) {
        this.finallyFnQueue.push(cb);
    }

    static resolve(val) {
        return new KPromise((resolve, reject) => {
            resolve(val)
        });
    }

    static reject(err) {
        return new KPromise((resolve, reject) => {
            reject(err);
        });
    }


    static race(lists) {
        return new KPromise((resolve, reject) => {
            lists.forEach(list => {
                let isFirst = true;
                list.then(res => {
                    isFirst && resolve(res);
                    isFirst = false;
                }, err => {
                    isFirst && reject(err);
                    if (isFirst) {
                        isFirst = false;
                        throw new Error(err);
                    }
                })
            });
        });
    }

    static all(lists) {
        return new KPromise((resolve, reject) => {
            let nums = 0;
            let resArr = [];
            lists.forEach((list, index) => {
                list.then(res => {
                    nums++;
                    resArr[index] = res;
                    if (nums === lists.length) resolve(resArr);
                }, err => {
                    reject(err);
                    throw new Error(err);
                });
            });
        });
    }

    static allSettled(lists) {
        return new KPromise((resolve, reject) => {
            let nums = 0;
            let resArr = [];
            lists.forEach((list, index) => {
                let obj = {};
                list.then(res => {
                    nums++;
                    obj.status = 'fulfilled';
                    obj.value = res;
                    resArr[index] = obj;
                    if (nums === lists.length) resolve(resArr);
                }, err => {
                    nums++;
                    obj.status = 'rejected';
                    obj.reason = err;
                    resArr[index] = obj;
                    if (nums === lists.length) resolve(resArr);
                });
            });
        });
    }




}
