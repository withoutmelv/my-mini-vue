import { hasOwn, isArray, isChanged, isFunction, isIntegerKey, isObject } from "@vue/shared";
import { trigger } from "packages/reactivity/src/effect";
// import { track } from "packages/reactivity/src/effect";
import { TrackOpTypes, TriggerOpTypes } from "packages/reactivity/src/operators";

let uid = 0;
const effectStack: any[] = [];
let activeEffect: { deps: any[]; };
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
    effect._isEffect = true;
    effect.options = options;
    effect.raw = fn;
    /**
     * @type {never[]}
     */
    effect.deps = [];
    return effect;
}

const effect = (fn: any, options: { lazy: any; }) => {
    const effect = createReactiveEffect(fn, options);
    if (!options.lazy) {
        effect();
    }
    return effect;
}

const targetMap = new WeakMap;
const track = (target: object, type: TrackOpTypes, key: string) => {
    if (activeEffect) {
        let depsMap = targetMap.get(target);
        if (!depsMap) {
            targetMap.set(target, depsMap = new Map());
        }
        let deps = depsMap.get(key);
        if (!deps) {
            depsMap.set(target, deps = new Set());
        }
        deps.push(activeEffect);
        activeEffect.deps.push(dep);
    }
}


const createGetter = (isReadonly = false, isShallow = false) => {
    return function get(target: object, key: PropertyKey, receiver: any) {
        let res = Reflect.get(target, key, receiver);
        if (!isReadonly) {
            track(target, TrackOpTypes.GET, key);
        }
        if (!isShallow) {
            if (isObject(res)) {
                return res = isReadonly ? readonly(res) : reactive(res); 
            }
        }
        return res;
    } 
};


// const effects = new Set();
//         const add = (effectsToAdd: any[]) => {
//             if (effectsToAdd) {
//                 effectsToAdd.forEach((effect: any) => {
//                     effects.add(effect);
//                 })
//             }
//         }

//         if (key === 'length' && isArray(target)) {
//             depsMap.forEach((dep:any, key:any) => {
//                 if (key >= newval || key === 'length') {
//                     add(dep);
//                 }
//             });
//         } else if (key !== undefined) {
//             add(depsMap.get(key)); // 新增类型的相当于add(undefined)
//         }
//         switch(type) {
//             case TriggerOpTypes.ADD:
//                 if (isArray(target) && isIntegerKey(key)) {
//                     // 上面的判断条件 足够说明当前的key大于数组长度
//                     add(depsMap.get('length'));
//                 }
//                 break;
//             default:
//                 break;
//         }
//         effects.forEach((effect: any) => {
//             if(effect.options.scheduler){ // 使用调度策略优化effect的执行
//                 return effect.options.scheduler(effect); // 如果有自己提供的scheduler，则执行scheduler逻辑
//             }
//             effect();
//         })


const trigger = (target: object, type: TriggerOpTypes, key: string | undefined, value: undefined, oldval: undefined) => {
    const depsMap = targetMap.get(target);
    if (depsMap) {
        const effects = new Set();
        const add = (effectsToAdd: any[]) => {
            if (effectsToAdd) {
                effectsToAdd.forEach((effect: any) => {
                    effects.add(effect);
                })
            }
        }

        if (key === 'length' && isArray(target)) {
            depsMap.forEach((dep:any, key:any) => {
                if (key >= newval || key === 'length') {
                    add(dep);
                }
            });
        } else if (key !== undefined) {
            add(depsMap.get(key)); // 新增类型的相当于add(undefined)
        }

        switch(type) {
            case TriggerOpTypes.ADD:
                if (isArray(target) && isIntegerKey(key)) {
                    // 上面的判断条件 足够说明当前的key大于数组长度
                    add(depsMap.get('length'));
                }
                break;
            default:
                break;
        }

        effects.forEach((effect: any) => {
            if(effect.options.scheduler){ // 使用调度策略优化effect的执行
                return effect.options.scheduler(effect); // 如果有自己提供的scheduler，则执行scheduler逻辑
            }
            effect();
        })
    }
}

const  createSetter = (isReadonly = false, isShallow = false) => {
    return function set (target: string | object, key: PropertyKey, value: any, receiver: any) {
        // const oldval = target[key];
        // const hasKey = isArray(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key);
        // if (!hasKey) {
        //     trigger(target, TriggerOpTypes.ADD, key, value);
        // } else if (isChanged(oldval, value)) {
        //     trigger(target, TriggerOpTypes.SET, key, value, oldval);
        // }
        // return Reflect.set(target, key, value, receiver);
        const oldval = target[key];
        const hasKey = isArray(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key);
        if (!hasKey) {
            trigger(target, TriggerOpTypes.ADD, key, value);
        } else if (isChanged(oldval, value)) {
            trigger(target, TriggerOpTypes.SET, key, value, oldval);
        }
        return Reflect.set(target, key, value, receiver);
    }
};

const get = () => {
    return createGetter();
}

const set = () => {
    return createSetter();
}

const shallowReactiveGet = () => {
    return createGetter(false, true);
}

const shallowReactiveSet = () => {
    return createSetter(false, true);
}

const readonlyGet = () => {
    return createGetter(true, false);
}


const shallowReadonlyGet = () => {
    return createGetter(true, true);
}

const mutableHandler = {
    get,
    set,
}

const shallowReactiveHandler = {
    get: shallowReactiveGet,
    set: shallowReactiveSet,
};

const readonlyHandler = {
    get: readonlyGet,
    set: () => {
        console.warn();
    },
};

const shallowReadonlyHandler = {
    get: shallowReadonlyGet,
    set: () => {},
};

const reactiveMap = new WeakMap;
const readonlyMap = new WeakMap;
const createReactiveObject = (target: object, baseHandler: ProxyHandler<any>, isReadonly = false, isShallow = false) => {
    if (!isObject(target)) {
        return target;
    }
    const Map = isReadonly ? readonlyMap : reactiveMap;
    const existingProxy = Map.get(target);
    if (existingProxy) {
        return existingProxy;
    }
    const proxy = new Proxy(target, baseHandler);
    Map.set(target, proxy);
    return proxy;
}


const reactive = (obj: any) => {
    return createReactiveObject(obj, mutableHandler);
}

const shallowReactive = (obj: any) => {
    return createReactiveObject(obj, shallowReactiveHandler, false, true);
}

const readonly = (obj: any) => {
    return createReactiveObject(obj, readonlyHandler, true, false);
}

const shallowReadonly = (obj: any) => {
    return createReactiveObject(obj, shallowReadonlyHandler, true, true);
}




export function ref(value: any) {
    return createRef(value);
}

export function shallowRef(value: any) {
    return createRef(value, true);
}

const createRef = (value: any, shallow = false) => {
    return new refImpl(value, shallow);
}

const convert = (value: any) => isObject(value) ? reactive(value) : value;

class refImpl {
    private _value: any;
    public readonly __v_isRef = true;
    constructor(private _rawValue: any, private readonly _shallow: boolean) {
        this._value = _shallow ? _rawValue : convert(_rawValue);
    }

    get value() {
        track(this, TrackOpTypes.GET, 'value');
        return this._value;
    }

    set value(newValue) {
        if (isChanged(this._rawValue, newValue)) {
            this._rawValue = newValue;
            this._value = this._shallow ? this._rawValue : convert(this._rawValue);
            trigger(this, TriggerOpTypes.SET, 'value', newValue, undefined);
        }
    }
}



export function toRef(object: any, key: any) {
    return new ObjectRefImpl(object, key);
}

class ObjectRefImpl {
    public readonly __v_isRef = true;
    constructor(private readonly _object: any, private readonly _key: any) {

    }

    get value() {
        return this._object[this._key];
    }

    set value(newValue) {
        this._object[this._key] = newValue;
    }
}



export function computed(getterOrOptions: { get: any; set: any; }) {
    let getter;
    let setter;
    if (isFunction(getterOrOptions)) {
        getter = getterOrOptions;
        setter = () => {
            console.log("computed is readonly!");
        }
    } else {
        getter = getterOrOptions.get;
        setter = getterOrOptions.set;
    }
    return new ComputedRefImpl(getter, setter);
}

class ComputedRefImpl {
    private _value: any;
    private _dirty = true;
    public readonly effect;
    public readonly __v_isRef = true;
    constructor(getter: any, _setter: any) {
        this.effect = effect(getter, {
            lazy: true,
            scheduler: (effect: any) => {
                if (!this._dirty) {
                    this._dirty = true;
                    trigger(this, TriggerOpTypes.SET, 'value')
                }
            }
        });
    }

    get value() {
        if (this._dirty) {
            this._value = this.effect();
            this._dirty = false;
        }
        track(this, TrackOpTypes.GET, 'value');
        return this._value;
    }

    set value(newval) {
        this._setter(newval);
    }
}
