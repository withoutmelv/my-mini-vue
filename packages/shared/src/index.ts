export const isObject = (res:any) => {
    return typeof res === 'object' && res !== null
}

export const extend = Object.assign;


export const isArray = (target:any) => Array.isArray(target);

export const isIntegerKey = (num: any) => parseInt(num) + '' === num;

export const hasOwn = (target: any, key: any) => Object.prototype.hasOwnProperty.call(target, key);

export const isChanged = (oldval:any, newval:any) => oldval !== newval;