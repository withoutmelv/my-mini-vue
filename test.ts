// import {
//     mutableHandlers,
//     readonlyHandlers,
//     shallowReactiveHandlers,
//     shallowReadonlyHandlers,
// } from './baseHandlers';

export function reactive(target) {
    return createReactiveObject(target, false, mutableHandlers);
};

export function shallowReactive(target) {
    return createReactiveObject(target, false, shallowReactiveHandlers);
};

export function readonly(target) {
    return createReactiveObject(target, true, readonlyHandlers);
};

export function shallowReadonly(target) {
    return createReactiveObject(target, true, shallowReadonlyHandlers);
};

const reactiveMap = new WeakMap();
const readonlyMap = new WeakMap(); 
const createReactiveObject = (target, isReadonly, baseHandlers) => {
    if (typeof target !== 'object' || target === null) return target;
    const proxyMap = isReadonly ? readonlyMap : reactiveMap;
    const existingProxy = proxyMap.get(target);
    if (existingProxy) {
        return existingProxy;
    }
    const proxy = new Proxy(target, baseHandlers);
    proxyMap.set(target, proxy);
    return proxy;
};


// import { reactive, readonly } from './reactive';

const createGetter = (isReadonly = false, shallow = false) => {
    return function get(target, key, receiver) {
        const res = Reflect.get(target, key, receiver);
        if (!isReadonly) {
            // 收集依赖
        }
        if (!shallow) {
            if (typeof res === 'object' && res !== null) {
                return isReadonly ? readonly(res) : reactive(res);
            }
        }
        return res;
    }
};

const createSetter = (shallow = false) => {
    return function set(target, key, value, receiver) {
        const res = Reflect.get(target, key, receiver);
        if (res !== value) {
            if (!shallow) {
                // 触发 trigger
            }
            return Reflect.set(target, key, value, receiver);
        }
    }
}; 

const get = createGetter();
const shallowGet = createGetter(false, true);
const readonlyGet = createGetter(true, false);
const shallowReadonlyGet = createGetter(true, true);

const set =  createSetter();
const shallowSet = createSetter(true);


export const mutableHandlers = {
    get,
    set,
};

export const shallowReactiveHandlers = {
    get: shallowGet,
    set: shallowSet,
};

export const readonlyHandlers = {
    get: readonlyGet,
    set: (target, key, receiver) => {
        console.warn('cannot set key on '+ key);
        return true;
    },
};

export const shallowReadonlyHandlers = {
    get: shallowReadonlyGet,
    set: (target, key, receiver) => {
        console.warn('cannot set key on '+ key);
        return true;
    },
};