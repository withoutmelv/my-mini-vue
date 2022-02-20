export function ref(value: any) {
    return createRef(value);
}

export function shallowRef(value: any) {
    return createRef(value, true);
}


class refImpl {
    public _value: any;
    public __v_isRef = true;
    constructor(public rawValue: any, public shallow: boolean) {

    }
}



const createRef = (value: any, shallow = false) => {
    return new refImpl(value, shallow);
}