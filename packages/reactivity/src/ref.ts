import { isArray, isChanged, isObject } from "@vue/shared";
import { reactive } from ".";
import { track, trigger } from "./effect";
import { TrackOpTypes, TriggerOpTypes } from "./operators";

export function ref(value: any) {
    return createRef(value);
}

export function shallowRef(value: any) {
    return createRef(value, true);
}

export function toRef(object: any, key: any) {
    return new ObjectRefImpl(object, key)
}

export function toRefs(object: any) {
    const ret: any = isArray(object) ? new Array(object.length) : {};
    for (const key in object) {
        ret[key] = toRef(object, key);
    }
    return ret;
}


const convert = (value: any) => isObject(value) ? reactive(value) : value;
class refImpl {
    private _value: any;
    public readonly __v_isRef = true;
    constructor(private _rawValue: any, private readonly _shallow: boolean) {
        // 这里说明了数组即使使用ref,也会变为reactive返回的proxy对象
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
            trigger(this, TriggerOpTypes.SET, 'value', newValue);
        }
    }
    // object accessor 对象的属性访问器
}



const createRef = (value: any, shallow = false) => {
    return new refImpl(value, shallow);
}


class ObjectRefImpl {
    public readonly __v_isRef = true;
    constructor(private readonly _object: any, private readonly _key: any) {
        
    }

    // toRef本身并不实现响应式（即依赖收集和触发依赖等），它是调用源对象自身的set和get来实现toRef自己的set和get
    get value() {
        return this._object[this._key];
    }

    set value(newValue) {
        // 这里不用判断oldValue与newValue是否相同，因为这里是调用proxy对象本身的set进行操作的,proxy里面已经做判断了
        this._object[this._key] = newValue;
    }
}