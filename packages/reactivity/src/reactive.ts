import {
    mutableHandlers,
    readonlyHandlers,
    shallowReactiveHandlers,
    shallowReadonlyHandlers
} from "./baseHandlers"; // 不同的拦截函数

export function reactive(target) {
    return createReactiveObject(target, false, mutableHandlers)
}

export function shallowReactive(target) {
    return createReactiveObject(target, false, shallowReactiveHandlers)
}

export function readonly(target) {
    return createReactiveObject(target, true, readonlyHandlers)
}

export function shallowReadonly(target) {
    return createReactiveObject(target, true, shallowReadonlyHandlers)
}
/**
 * 
 * @param target 拦截的目标
 * @param isReadonly 是不是仅读属性
 * @param baseHandlers 对应的拦截函数
 */
 const reactiveMap = new WeakMap(); 
 const readonlyMap = new WeakMap();
 function createReactiveObject(target, isReadonly, baseHandlers) {
     // 1.如果不是对象直接返回
     if(typeof target !== 'object' || target === null){ 
         return target
     }
     const proxyMap = isReadonly ? readonlyMap : reactiveMap; // 获取缓存对象
     const existingProxy = proxyMap.get(target);
     // 2.代理过直接返回即可
     if(existingProxy){ 
         return existingProxy;
     }
     // 3.代理的核心
     const proxy = new Proxy(target,baseHandlers); 
     proxyMap.set(target,proxy);
     // 4.返回代理对象
     return proxy; 
 }