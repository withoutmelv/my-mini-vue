export const isObject = (res:any) => {
    return typeof res === 'object' && res !== null
}

export const extend = Object.assign;