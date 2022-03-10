import { isFunction } from "@vue/shared";
import { effect, track, trigger } from "./effect";
import { TrackOpTypes, TriggerOpTypes } from "./operators";

// computed 里面的函数不会立即执行，是懒执行的
// computed 只有在get(即.value)的时候才去执行内部函数并拿到返回值
// computed 有缓存特性，并不是每一次调用get(即.value)时都会执行内部函数
// computed 本身也是响应式的，也需要有依赖的收集和更新

class ComputedRefImpl {
    private _value: any;
    private _dirty = true; // 脏值，为true时不缓存，用于实现computed的缓存特性
    public readonly effect;
    public readonly __v_isRef = true;
    constructor(getter: any, private readonly _setter: (arg0: any) => void) {
        this.effect = effect(getter, {
            lazy: true,
            scheduler: (effect: any) => {
                // 当getter内部的响应式数据trigger触发执行收集的依赖时，scheduler调用，并且将脏值设为true
                // 由于computed只在get的时候才去执行effect,所以这里不执行effect
                if (!this._dirty) {
                    this._dirty = true;
                    // computed本身也是响应式的，也需要有依赖的收集以及触发依赖
                    trigger(this, TriggerOpTypes.SET, 'value');
                }
            },
        });
    }

    get value() {
        if (this._dirty) {
            this._value = this.effect();
            this._dirty = false; // 改为false,使得后续get时直接拿取缓存的值，并不执行内部effect函数
        }
        // computed本身也是响应式的，也需要有依赖的收集以及触发依赖
        track(this, TrackOpTypes.GET, 'value');
        return this._value;
    }

    set value(newvalue) {
        this._setter(newvalue);
    }
}

export function computed(getterOrOptions: { get: any; set: any; }) {
    let getter;
    let setter;
    if (isFunction(getterOrOptions)) {
        getter = getterOrOptions;
        setter = () => {
            console.log("computed is readonly!");
        };
    } else {
        getter = getterOrOptions.get;
        setter = getterOrOptions.set;
    }
    return new ComputedRefImpl(getter, setter);
}
