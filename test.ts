import { hasOwn, isArray, isChanged, isFunction, isIntegerKey, isObject } from "@vue/shared";
import { trigger } from "packages/reactivity/src/effect";
import { TrackOpTypes, TriggerOpTypes } from "packages/reactivity/src/operators";
// import { track } from "packages/reactivity/src/effect";

let uid = 0;
let activeEffect: any;
const effectStack: any[] = [];
const createReactiveEffect = (fn: () => any, options: any) => {
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
    /**
     * @type {never[]}
     */
    effect.deps = [];
    return effect;
}

const effect = (fn: any, options: { lazy: any; scheduler?: (effect: any) => void; }) => {
    const effect = createReactiveEffect(fn, options);
    if (!options.lazy) {
        effect();
    }
    return effect;
}

const targetMap = new WeakMap();
const track = (target: object, type: TrackOpTypes, key: PropertyKey) => {
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


const trigger = (target: object, type: TriggerOpTypes, key: string | number | undefined, newval: undefined, oldval?: undefined) => {
    const depsMap = targetMap.get(target);
    const effects = new Set();
    const addToEffects = (addEffects: any[]) => {
        addEffects.forEach((effect: unknown) => {
            effects.add(effect);
        });
    }
    if (depsMap) {
        if (key === 'length') {
            depsMap.forEach((val: any, key: string | number) => {
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
    return function set(target: string | object, key: PropertyKey, newval: any, receiver: any) {
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



const ref = (val: any) => {
    return new RefImpl();
}

const shallowRef = (val: any) => {
    return new RefImpl();
}


const convert = (target: any) => {
    return isObject(target) ? reactive(target) : ref(target);
}
class RefImpl {
    private _value;
    public readonly __v_isRef = true;
    constructor(private _rawval: undefined, private shallow = false) {
        this._value = shallow ? _rawval : convert(_rawval);
    }

    get value() {
        track(this, TrackOpTypes.GET, 'value');
        return this._rawval;
    }

    set value(newval) {
        if (isChanged(this._rawval, newval)) {
            this._rawval = newval;
            this._value = this.shallow ? this._rawval : convert(this._rawval);
            trigger(this, TriggerOpTypes.SET, 'value', newval, this._rawval);
        }
    }
}


const toRef = (target: any, key: string) => {
    return new ObjectRefImpl(target, key);
};

const toRefs = (target: any) => {
    const obj = isArray(target) ? [] : {};
    for (let i in target) {
        obj[i] = toRef(target, i);
    }
}


class ObjectRefImpl {
    public readonly __v_isRef = true;
    constructor(private _target: { [x: string]: any; }, private _key: string | number) {

    }

    get value() {
        return this._target[this._key];
    }

    set value(newval) {
        this._target[this._key] = newval; 
    }
}



class ComputedRefImpl {
    private _value:any;
    private _dirty = true;
    public readonly effect;
    public readonly __v_isRef = true;
    constructor(getter: any, private readonly setter: (arg0: any) => void) {
        this.effect = effect(getter, {
            lazy: true,
            scheduler: (effect:any) => {
                if (!this._dirty) {
                    this._dirty = true;
                    trigger(this, TriggerOpTypes.SET, 'value');
                }
            }
        });
    }

    get value() {
        if (this._dirty) {
            this._dirty = false;
            this._value = this.effect();
            track(this, TrackOpTypes.GET, 'value');
        }
        return this._value;
    }

    set value(newval) {
        this.setter(newval);
    }
}


const computed = (getterOrOptions: { get: any; set: any; }) => {
    let getter;
    let setter;
    if (isFunction(getterOrOptions)) {
        getter = getterOrOptions;
        setter = () => {
            console.warn('computed is Readonly');
        }
    } else {
        getter = getterOrOptions.get;
        setter = getterOrOptions.set;
    }
    return new ComputedRefImpl(getter, setter);
}