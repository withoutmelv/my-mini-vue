// Reactivity

import { isObject } from "@vue/shared";

let uid = 0;
let activeEffect;
const effectStack = [];
const createReactiveEffect = (fn, options) => {
    const effect = () => {
        if (effectStack.includes(effect)) return; // 防止递归情况下陷入死递归
        activeEffect = effect;
        effectStack.push(activeEffect);
        fn();
        effectStack.pop();
        activeEffect = effectStack[effectStack.length - 1];
    }
    effect.id = uid++;
    effect.raw = fn;
    effect._isEffect = true;
    effect.options = options;
    return effect;
};

const targetMap = new WeakMap;
const track = (target, key) => {
    if (activeEffect) {
        let depsMap = targetMap.get(target);
        if (!depsMap) {
            targetMap.set(target, depsMap = new Map);
        }
        let dep = depsMap.get(key);
        if (!dep) {
            depsMap.set(key, dep = new Set);
        }
        dep.add(activeEffect);
    }
    
}

const effect = (fn, options) => {
    const effect = createReactiveEffect(fn, options);
    if (!options.lazy) {
        effect();
    }
    return effect;
};

const createGetter = (isReadonly = false, shallow = false) => {
    return function get(target, key, receiver) {
        const res = Reflect.get(target, key, receiver);
        if (!isReadonly) {
            // 触发依赖收集
            track(target, key);
        }
        if (!shallow && isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    }
};

const createSetter = (shallow = false) => {
    return function set(target, key, value, receiver) {
        const res = Reflect.get(target, key, receiver);
        if (res !== value) {
            if (!shallow) {
                // trigger
            }
            return Reflect.set(target, key, value, receiver);
        }
    }
};

const get = createGetter();
const readonlyGet = createGetter(true);
const shallowGet = createGetter(false, true);
const shallowReadonlyGet = createGetter(true, true);

const set = createSetter();
const shallowSet = createSetter(true);

const mutableHandlers = {
    get,
    set,
};
const readonlyHandlers = {
    readonlyGet,
    set: () => {
        console.warn('');
    },
};
const shallowReactiveHandlers = {
    shallowGet,
    shallowSet,
};
const shallowReadonlyHandlers = {
    shallowReadonlyGet,
    set: () => {
        console.warn('');
    },
};

const reactive = (target) => {
    return createReactiveObject(target, false, mutableHandlers);
};

const readonly = (target) => {
    return createReactiveObject(target, true, readonlyHandlers);
};

const shallow = (target) => {
    return createReactiveObject(target, false, shallowReactiveHandlers);
};

const shallowReadonly = (target) => {
    return createReactiveObject(target, true, shallowReadonlyHandlers);
};

const reactiveMap = new WeakMap;
const readonlyMap = new WeakMap;
const createReactiveObject = (target, isReadonly, baseHandlers) => {
    if (!isObject(target)) return target;
    const proxyMap = isReadonly ? readonlyMap : reactiveMap;
    const existingProxy = proxyMap.get(target);
    if (existingProxy) {
        return existingProxy;
    }
    const proxy = new Proxy(target, baseHandlers);
    proxyMap.set(target, proxy);
    return proxy;
}