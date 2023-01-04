
let pending = false;
let timerFunc;
const callbacks = [];
const flushCallbacks = () => {
    pending = false;
    const copies = callbacks.slice();
    callbacks.length = 0;
    for (let i = 0; i < copies.length; i++) {
        copies[i]();
    }
}

if (typeof Promise !== 'undefined') {
    timerFunc = () => {
        Promise.resolve().then(flushCallbacks);
    };
} else if (typeof MutationObserver !== 'undefined'){
    let count = 0;
    const ob = new MutationObserver(flushCallbacks);
    const textNode = document.createTextNode(String(count));
    ob.observe(textNode, {
        characterData: true,
    });
    timerFunc = () => {
        count = (count + 1) % 2;
        textNode.data = count;
    };
} else if (typeof setImmediate !== 'undefined') {
    timerFunc = () => {
       setImmediate(flushCallbacks); 
    }
} else if (typeof setTimeout !== 'undefined') {
    timerFunc = () => {
        setTimeout(flushCallbacks);
    }
}



const nextTick = (cb, ctx) => {
    let _resolve;
    callbacks.push(() => {
        if (cb) {
            cb();
        } else {
            _resolve(ctx);
        }
    })

    // if (!pending) {
    //     pending = true;
    //     timerFunc();
    // }
    if (pending) return;
    pending = true;
    timerFunc();

    if (typeof Promise !== 'undefined' && !cb) {
        return new Promise((resolve, reject) => {
            _resolve = resolve;
        })
    }
};