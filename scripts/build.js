// 把package目录下的所有包都进行打包

const fs = require('fs');
const execa = require('execa'); // 开启子进程 进行打包
console.log(execa);
const targets = fs.readdirSync('packages').filter(f => {
    if (!fs.statSync(`packages/${f}`).isDirectory()) {
        return false;
    }
    return true;
})

// target = ['reactivity', 'shared']

async function build(target) {
    console.log(target, 'xxxxxxxxxxxxxxxxxxxx');
    await execa('rollup', ['-c', '--environment', `TARGET:${target}`], {stdio: 'inherit'})
}

function runParallel(targets, iteratorFn) {
    const res = [];
    for (const item of targets) {
        const p = iteratorFn(item);
        res.push(p);
    }
    return Promise.all(res);
}

runParallel(targets, build);