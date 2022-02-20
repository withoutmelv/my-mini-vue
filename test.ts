import { hasOwn, isArray, isChanged, isIntegerKey, isObject } from "@vue/shared";
import { TrackOpTypes, TriggerOpTypes } from "packages/reactivity/src/operators";

let uid = 0;
let activeEffect:any;
const effectStack:any = [];
const createReactiveEffect = (fn, options) => {
    const effect = () => {
        if (!effectStack.includes(effect)) {
            effectStack.push(effect);
            activeEffect = effectStack[effectStack.length - 1];
            fn();
            effectStack.pop();
            activeEffect = effectStack[effectStack.length - 1];
        }
    }
    effect.id = uid++;
    effect._isEffect = true;
    effect.raw = fn;
    effect.options = options;
    effect.deps = [];
    return effect;
}

const targetMap = new WeakMap();
const track = (target, type, key) => {
    if (activeEffect) {
        let depsMap = targetMap.get(target);
        if (!depsMap) {
            targetMap.set(target, depsMap = new Map());
        }
        let deps = depsMap.get(key);
        if (!deps) {
            target.set(key, deps = new Set());
        }
        deps.add(activeEffect);
        activeEffect.deps.push(dep);
    }
}

const effect = (fn, options) => {
    const effect = createReactiveEffect(fn, options);
    if (!options.lazy) {
        fn();
    }
    return effect;
}

const trigger = (target, type, key, newval, oldval?) => {
    const depsMap = targetMap.get(target);
    if (!depsMap) return;
    const effects = new Set();
    const add = (addToEffect:any) => {
        if (!addToEffect) return;
        addToEffect.forEach((effect:any) => {
            effects.add(effect);
        })
    }

    if (key === 'length' && isArray(target)) {
        depsMap.forEach((dep:any, key:any) => {
            if (key >= newval || key === 'length') {
                add(dep);
            }
        })
    }else if (key !== undefined) {
        add(depsMap.get(key));
    }

    switch(type) {
        case TriggerOpTypes.ADD:
            if (isArray(target) && isIntegerKey(key)) {
                add(depsMap.get('length'));
            }
            break;
        default: 
            break;
    }


    effects.forEach((eff:any) => {
        eff();
    });


}
const createSetter = (shallow = false) => {
    return function set(target, key, value, receiver) {
        const res = target[key];
        if (shallow) return;
        const hasKey = isArray(res) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key);
        if (!hasKey) {
            trigger(target, TriggerOpTypes.ADD, key, value);
        } else if (isChanged(res, value)) {
            trigger(target, TriggerOpTypes.SET, key, value, res);
        }
        return Reflect.set(target, key, value, receiver);;
    }
}

const createGetter = (isReadonly = false, shallow = false) => {
    return function get(target, key, receiver) {
        const res = Reflect.get(target, key, receiver);
        if (!isReadonly) {
            track(target, TrackOpTypes.GET, key);
        }
        if (!shallow && isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    }
}

const get = createGetter();
const readonlyGet = createGetter(false, true);
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
const createReactiveObject = (target: any, baseHandlers: any, isReadonly = false) => {
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

const reactive = (target: any) => {
    return createReactiveObject(target, mutableHandlers);
}

const readonly = (target: any) => {
    return createReactiveObject(target, readonlyHandlers, true);
}

const shallowReactive = (target: any) => {
    return createReactiveObject(target, shallowReactiveHandlers);
}

const shallowReadonly = (target: any) => {
    return createReactiveObject(target, shallowReadonlyHandlers, true);
}