// 只针对具体的某个包
const execa = require('execa')
const target = 'runtime-core'
execa('rollup', [
        '-wc',
        '--environment',
        `TARGET:${target}`
    ], {
        stdio: 'inherit'
    }
)