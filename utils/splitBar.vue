<template>
    <div class="splitbar" :class="[type === 'column' ? 'column' : 'row']" ref="splitbar"></div>
</template>

<script>
import {ref, reactive, onMounted, onBeforeUnmount} from 'vue';
export default {
    props: {
        type: {
            type: String,
            default: 'column',
        },
        offset: {
            type: String,
            default: 'start',
        },
        modelValue: {
            type: Number,
            required: true,
        },
        max: {
            type: Number,
        },
        min: {
            type: Number,
        }
    },
    emits: ['update:model-value'],
    setup(props, context) {
        let {type, offset} = reactive(props);

        let startX = 0;
        let startY = 0;
        let endX = 0;
        let endY = 0;

        let limitValue = [parseFloat(props.min), parseFloat(props.max)];
        let limitFlag = [!isNaN(limitValue[0]), !isNaN(limitValue[1])];

        const splitbar = ref(null);

        const getChange = () => {
            if (type === 'column') {
                if (offset === 'start') {
                    return endX - startX;
                } else {
                    return startX - endX;
                }
            } else {
                if (offset === 'start') {
                    return endY - startY;
                } else {
                    return startY - endY;
                }
            }
        };

        let isMouseDown = false;
        let cacheValue = 0;
        const startDrag = (e) => {
            isMouseDown = true;
            startX = e.clientX;
            startY = e.clientY;
            cacheValue = props.modelValue;
            document.body.className += ' is-move-splitbar';
        };
        const moveDrag = (e) => {
            if (isMouseDown) {
                endX = e.clientX;
                endY = e.clientY;
                let distValue = cacheValue + getChange();
                if (limitFlag[0]) {
                    distValue = Math.max(limitValue[0], distValue);
                } 
                if (limitFlag[1]) {
                    distValue = Math.min(limitValue[1], distValue);
                }
                context.emit('update:model-value', distValue);
            }
        };
        const endDrag = () => {
            isMouseDown = false;
            document.body.className = document.body.className.replaceAll(' is-move-splitbar', '');
        }

        const initWidth = () => {
            if (splitbar.value) {
                splitbar.value.addEventListener('mousedown', startDrag);
                document.addEventListener('mousemove', moveDrag);
                document.addEventListener('mouseup', endDrag);
            }
        }

        onMounted(() => {
            initWidth();
        });

        onBeforeUnmount(() => {
            splitbar.value.removeEventListener('mouseup', startDrag);
            document.removeEventListener('mousemove', moveDrag);
            document.removeEventListener('mouseup', endDrag);
        })

        return {
            splitbar,
        };
    },
}
</script>

<style lang="less" scoped>
.splitbar {
    z-index: 5;
    display: block;
    height: 100%;
    position: absolute;
    &:hover {
        background-color: #cccccc;
    }
}
.column {
    width: 3px;
    height: 100%;
    cursor: w-resize;
    &:hover {
        width: 5px;
    }
}
.row {
    width: 100%;
    height: 3px;
    cursor: n-resize;
    &:hover {
        height: 5px;
    }
}

:global(.is-move-splitbar) {
    pointer-events: none;
    user-select: none;
}

:global(.is-move-splitbar .splitbar) {
    pointer-events: all;
}
</style>