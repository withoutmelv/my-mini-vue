import { isArray, isIntegerKey } from "@vue/shared";
import { TrackOpTypes, TriggerOpTypes } from "./operators";

export const effect = (fn: any, options: any) => {
    const effect = createReactiveEffect(fn, options);
    if (!options.lazy) {
        effect();
    }
    return effect;
};

let uid = 0;
let activeEffect: { (): void; id: number; _isEffect: boolean; raw: any; options: any; deps: any[]; }; 
// effectStack是为了防止，effect函数内部再次调用effect，导致当effect内部的effect执行完之后回到外层effect时，activeEffect指向错误
const effectStack: any[] = [];
const createReactiveEffect = (fn: () => void, options: any) => {
    const effect = () => {
        // effectStack去重是为了防止重复执行相同的effect，即防止无限递归
        // effect(() => obj.foo = ob.foo + 1)，首先读取obj.foo，会触发track收集当前的effect；然后赋值obj.foo，会执行当前正在执行的effect。相当于没有结束条件的死递归
        // 相当于避免递归函数的调用
        if (!effectStack.includes(effect)) {
            try {
                // 调用cleanup函数，清除遗留的副作用函数
                cleanup(effect);
                effectStack.push(effect);
                activeEffect = effect;
                return fn();
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

const cleanup = (effectFn: any) => {
    // 遍历effectFn.deps数组
    for (let i = 0; i < effectFn.deps.length; i++) {
        // deps是依赖集合
        const deps = effectFn.deps[i];
        // 将effectFn从依赖合集中移除
        deps.delete(effectFn);
    }
    // 最后需要重置effectFn.deps数组
    effectFn.deps.length = 0;
}

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
    const depsMap = targetMap.get(target);
    if (depsMap) {
        // 新建一个Set来代替deps（依赖集合）遍历执行副作用函数，防止cleanup和track一删一增导致无限循环
        const effects = new Set();
        // 构建一个add函数来添加多个依赖集合（在数组长度改变以及索引超过长度时，会有多个依赖集合需要执行）
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
            // 注意这里的effect指的是effectFn（副作用函数），而不是真正的effect（注册副作用函数的函数）
            // computed里面的scheduler之所以不执行effect，是因为computed的特性，只有在get(即.value调用)的时候才会去执行effect计算返回值
            // watch里面的scheduler之所以不执行effect，是因为watch的effect仅仅完成了get的作用，执行不执行都一样，watch更关心callback的执行结果
            // 但是为了拿到newValue，watch必须在scheduler中执行effect
            // 不用担心上述两种情况中的effect会不会被cleanup掉，因为effect甚至都没执行
            if(effect.options.scheduler){ // 使用调度策略优化effect的执行
                return effect.options.scheduler(effect); // 如果有自己提供的scheduler，则执行scheduler逻辑
            }
            effect();
        })
    }
}


// tips: 数组直接放在html模板里面会自动调用toString方法，在调用toString方法时会使用数组的length属性，
// 从而触发数组length属性的依赖收集。


// 函数直接放在html里面也会自动toString方法