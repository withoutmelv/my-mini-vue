import { hasOwn, isArray, isIntegerKey, isObject } from "@vue/shared";
import { trigger } from "packages/reactivity/src/effect";
import { TrackOpTypes, TriggerOpTypes } from "packages/reactivity/src/operators";
// import { track } from "packages/reactivity/src/effect";

let uid = 0;
let activeEffect;
const effectStack = [];
const createReactiveEffect = (fn, options) => {
    const effect = () => {
        try {
            effectStack.push(effect);
            activeEffect = effectStack[effectStack.length - 1];
            return fn();
        } finally {
            effectStack.pop();
            activeEffect = effectStack[effectStack.length - 1];
        }
    };
    effect.id = uid++;
    effect.options = options;
    effect._isEffect = true;
    effect.raw = fn;
    effect.deps = [];
    return effect;
}

const effect = (fn, options) => {
    const effect = createReactiveEffect(fn, options);
    if (!options.lazy) {
        effect();
    }
    return effect;
}

const targetMap = new WeakMap();
const track = (target, type, key) => {
    if (activeEffect) {
        let depsMap = targetMap.get(target);
        if (!depsMap) {
            targetMap.set(target, (depsMap = new Map()));
        }
        let deps = depsMap.get(key);
        if (!deps) {
            depsMap.set(key, (deps = new Set()));
        }
        deps.add(activeEffect);
    }
    
}

const createGetter = (isReadonly = false, shallow = false) => {
    return function get(target: object, key: PropertyKey, receiver: any) {
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


const trigger = (target, type, key, newval, oldval?) => {
    const depsMap = targetMap.get(target);
    const effects = new Set();
    const addToEffects = (addEffects) => {
        addEffects.forEach(effect => {
            effects.add(effect);
        });
    }
    if (depsMap) {
        if (key === 'length') {
            depsMap.forEach((val, key) => {
                if (isArray(target) && isIntegerKey(key) && key >= length || key === 'length') {
                    addToEffects(val);
                }
            });
        } else {
            if (key !== undefined) {
                const deps = depsMap.get(key);
                addToEffects(deps);
            }
            switch(type) {
                case TriggerOpTypes.ADD:
                    if(isArray(target) && isIntegerKey(key) && key > length) {
                        addToEffects(depsMap.get('length'));
                    }
                    break;
                default:
                    break;
            }
        }
        effects.forEach(effect => {
            if (effect.options.scheduler) {
                return effect.options.scheduler(effect);
            }
            effect();
        });
    }
}

const createSetter = (shallow = false) => {
    return function set(target, key, newval, receiver) {
        const oldval = target[key];
        const res = Reflect.set(target, key, newval, receiver);
        if (oldval !== newval) {
            const isSet = isArray(target) && isIntegerKey(key) ? key < target.length : hasOwn(target, key);
            if (isSet) {
                trigger(target, TriggerOpTypes.SET, key, newval, oldval);
            } else {
                trigger(target, TriggerOpTypes.ADD, key, newval);
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
const createReactiveObject = (target: object, baseHandlers: ProxyHandler<any>, isReadonly = false, shallow = false) => {
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
};

const readonly = (target: any) => {
    return createReactiveObject(target, readonlyHandlers, true);
}

const shallowReactive = (target: any) => {
    return createReactiveObject(target, shallowReactiveHandlers, false, true);
}

const shallowReadonly = (target: any) => {
    return createReactiveObject(target, shallowReadonlyHandlers, true, true);
}