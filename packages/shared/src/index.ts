export const isObject = (res:any) => {
    typeof res === 'object' && res !== null
}

export const extend = Object.assign;