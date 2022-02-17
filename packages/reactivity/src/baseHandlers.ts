import { hasOwn, isArray, isChanged, isIntegerKey, isObject } from "@vue/shared";
import { track, trigger } from "./effect";
import { TrackOpTypes, TriggerOpTypes } from "./operators";
import { reactive, readonly } from "./reactive";

const get = createGetter();
const shallowGet = createGetter(false, true);
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);

const set = createSetter();
const shallowSet = createSetter(true);

/**
 * @param isReadonly 是不是仅读
 * @param shallow 是不是浅响应
 */
function createGetter(isReadonly = false, shallow = false) {
    return function get(target: object, key: PropertyKey, receiver: any) {
        const res = Reflect.get(target, key, receiver);
        if (!isReadonly) {
            // 依赖收集
            track(target, TrackOpTypes.GET, key);
        }
        if (!shallow) { 
            // Vue3是懒代理，当深度取值时并且值为兑现时，才会进行深度代理
            // Vue2的defineProperty是一上来就进行深层的数据劫持，所以Vue2有性能缺陷
            if (isObject(res)) {
                return isReadonly ? readonly(res) : reactive(res);
            }
        }
        return res;
    }
}

function createSetter(shallow = false) {
    return function set(target: any, key: any, value: any, receiver: any) {
        const oldval = target[key];
        const hasKey = isArray(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key);
        if (!hasKey) {
            trigger(target, TriggerOpTypes.ADD, key, value);
        } else if (isChanged(oldval, value)) {
            trigger(target, TriggerOpTypes.SET, key, value, oldval);
        }
        return Reflect.set(target, key, value, receiver);
    }
}

export const mutableHandlers = {
    get,
    set
};
export const readonlyHandlers = {
    get: readonlyGet,
    set(target: any, key: any) {
        console.warn(`Set operation on key "${String(key)}" failed: target is readonly.`)
        return true;
    }
};
export const shallowReactiveHandlers = {
    get: shallowGet,
    set: shallowSet
};
export const shallowReadonlyHandlers = {
    get: shallowReadonlyGet,
    set(target: any, key: any) {
        console.warn(`Set operation on key "${String(key)}" failed: target is readonly.`)
        return true;
    }
};