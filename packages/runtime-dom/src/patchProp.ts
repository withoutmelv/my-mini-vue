import { isOn } from "@vue/shared"
import { patchAttr } from "./modules/attrs"
import { patchClass } from "./modules/class"
import { patchEvent } from "./modules/events"
import { patchStyle } from "./modules/style"

export const patchProp = (el, key, prevValue, nextValue) => {
    switch (key) {
        // 先处理特殊逻辑
        case 'class':
            patchClass(el, nextValue);
            break;
        case 'style':
            patchStyle(el, prevValue, nextValue);
            break;
        default:
            if (isOn(key)) {
                patchEvent(el, key, nextValue);
            } else {
                patchAttr(el, key, nextValue);
            }
            break;
    }
}