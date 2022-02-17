import { isObject } from "@vue/shared";
import { trigger } from "packages/reactivity/src/effect";
import { TrackOpTypes, TriggerOpTypes } from "packages/reactivity/src/operators";

const createSetter = (shallow = false) => {
    return function set(target, key, newval, receiver) {
        const oldval = target[key];

        if (oldval !== newval) {
            const res = Reflect.set(target, key, newval, receiver);
            // trigger(targe)
        }
    }
}
// import { track } from "packages/reactivity/src/effect";
let uid = 0;
let activeEffect:any;
const effectStacks: any[] = [];
const createReactiveEffect = (fn: () => void, options: any) => {
    const effect = () => {
        if (!effectStacks.includes(effect)) {
            effectStacks.push(effect);
            activeEffect = effectStacks[effectStacks.length - 1];
            fn();
            effectStacks.pop();
            activeEffect = effectStacks[effectStacks.length - 1];
        }
    }
    effect.id = uid++;
    effect.raw = fn;
    effect.options = options;
    effect._isEffect = true;
    return effect;
}

const effect = (fn: () => void, options: { lazy: any; }) => {
    if (!options.lazy) {
        fn();
    }
    return createReactiveEffect(fn, options);
}

const targetMap = new WeakMap();
const track = (target: any, type: TrackOpTypes, key: any) => {
    if (activeEffect) {
        let depsMap = targetMap.get(target);
        if (!depsMap) {

        }
    }
}


const createGetter = (isReadonly = false, shallow = false) => {
    return function get(target: object, key: PropertyKey, receiver: any):any {
        const res = Reflect.get(target, key, receiver);
        if (!isReadonly) {
            // 依赖收集
            track(target, TrackOpTypes.GET, key);
        }
        if (!shallow) {
            if (isObject(res)) {
                return isReadonly ? readonly(res) : reactive(res);
            }
        }
        return res;
    }
}

const get = createGetter();
const readonlyGet = createGetter(true);
const shallowReactiveGet = createGetter(false, true);
const shallowReadonlyGet = createGetter(true, true);

const set = createSetter();
const shallowReactiveSet = createSetter(true);

const mutableHandlers = {
    get,
    set,
};
const readonlyHandlers = {
    get: readonlyGet,
    set: () => {},
};
const shallowReactiveHandlers = {
    get: shallowReactiveGet,
    set: shallowReactiveSet,
};
const shallowReadonlyHandlers = {
    get: shallowReadonlyGet,
    set: () => {},
};

const reactiveMap = new WeakMap();
const readonlyMap = new WeakMap();
const createReactiveObject = (target: object, baseHandlers: ProxyHandler<any>, isReadonly = false) => {
    if (!isObject(target)) return target;
    const proxyMap = isReadonly ? readonlyMap : reactiveMap;
    const existingProxy = proxyMap.get(target);
    if (existingProxy) {
        return existingProxy;
    }
    const proxy = new Proxy(target, baseHandlers);
    proxyMap.set(target, existingProxy);
    return proxy;
};

const reactive = (target: any) => {
    return createReactiveObject(target, mutableHandlers);
};

const readonly = (target: any) => {
    return createReactiveObject(target, readonlyHandlers, true);
};

const shallowReactive = (target: any) => {
    return createReactiveObject(target, shallowReactiveHandlers);
};

const shallowReadonly = (target: any) => {
    return createReactiveObject(target, shallowReadonlyHandlers, true)
};