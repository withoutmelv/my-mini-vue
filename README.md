### window环境中使用npm安装全局yarn
- npm install yarn -g (require node >= 16.0.0)

### 安装依赖
- yarn add typescript rollup rollup-plugin-typescript2 @rollup/plugin-node-resolve @rollup/plugin-json execa --ignore-workspace-root-check


### build
- yarn run build

### dev
- yarn run dev

### 创建软连接（在node_modules里出现@vue/reactivity等）
- yarn install

### 生成tsconfig.json文件
npx tsc --init