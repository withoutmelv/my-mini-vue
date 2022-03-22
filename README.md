### Vue项目结构
                            +---------------------+
                            |                     |
                            |  @vue/compiler-sfc  |
                            |                     |
                            +-----+--------+------+
                                  |        |
                                  v        v
               +---------------------+    +----------------------+
               |                     |    |                      |
     +-------->|  @vue/compiler-dom  +--->|  @vue/compiler-core  |
     |         |                     |    |                      |
+----+----+    +---------------------+    +----------------------+
|         |
|   vue   |
|         |
+----+----+   +---------------------+    +----------------------+    +-------------------+
    |         |                     |    |                      |    |                   |
    +-------->|  @vue/runtime-dom   +--->|  @vue/runtime-core   +--->|  @vue/reactivity  |
              |                     |    |                      |    |                   |
              +---------------------+    +----------------------+    +-------------------+

// render函数是一个effect

### window环境中使用npm安装全局yarn
- npm install yarn -g (require node >= 16.0.0)

### 安装依赖
- package.json中有依赖，直接 yarn install即可

### build
- yarn run build

### dev
- yarn run dev

### 创建软连接（在node_modules里出现@vue/reactivity等）
- yarn install

### 生成tsconfig.json文件
npx tsc --init









- yarn add typescript rollup rollup-plugin-typescript2 @rollup/plugin-node-resolve @rollup/plugin-json execa --ignore-workspace-root-check