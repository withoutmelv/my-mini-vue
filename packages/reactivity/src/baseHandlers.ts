import { isObject } from "@vue/shared";
import { track } from "./effect";
import { TrackOpTypes } from "./operators";
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
    return function get(target, key, receiver) {
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
    return function set(target, key, value, receiver) {

    }
}

export const mutableHandlers = {
    get,
    set
};
export const readonlyHandlers = {
    get: readonlyGet,
    set(target, key) {
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
    set(target, key) {
        console.warn(`Set operation on key "${String(key)}" failed: target is readonly.`)
        return true;
    }
};