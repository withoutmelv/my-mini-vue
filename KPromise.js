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
                
            }
        })
    }


}
