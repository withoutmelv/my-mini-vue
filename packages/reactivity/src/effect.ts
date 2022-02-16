import { TrackOpTypes } from "./operators";

export const effect = (fn: any, options: { lazy: any; }) => {
    const effect = createReactiveEffect(fn, options);
    if (!options.lazy) {
        effect();
    }
    return effect;
};

let uid = 0;
let activeEffect: { (): void; id: number; _isEffect: boolean; raw: any; options: any; deps: any[]; };
const effectStack: any[] = [];
const createReactiveEffect = (fn: () => void, options: any) => {
    const effect = () => {
        if (!effectStack.includes(effect)) {
            try {
                effectStack.push(effect);
                activeEffect = effect;
                fn();
            }finally {
                effectStack.pop();
                activeEffect = effectStack[effectStack.length - 1];
            }
        }
    };
    effect.id = uid++;
    effect._isEffect = true;
    effect.raw = fn;
    effect.options = options;
    effect.deps = new Array();
    return effect;
};

const targetMap = new WeakMap();
export const track = (target: object, type: TrackOpTypes, key: any) => {
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
        activeEffect.deps.push(dep);
    }
};

export const trigger = (target: any, type: any, key?: any, newval?: any, oldval?: any) => {
    
}


// tips: 数组直接放在html模板里面会自动调用toString方法，在调用toString方法时会使用数组的length属性，
// 从而触发数组length属性的依赖收集。


// 函数直接放在html里面也会自动toString方法