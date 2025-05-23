# FlowMark - Markdown Editor

## TODO
<!-- 历史版本清理 -->
1. 懒加载文件树
2. i18n全部适配
3. 打包后输入框 在输入左右箭头按键时会出现未知字符
4. 在菜单中清空最近文件没有立刻刷新
5. 网络pdf打开乱码
6. 解决milkdown自动插入转译字符导致文件打开就自动保存两次和粘贴的markdown语法无法识别渲染。

## 项目概述

FlowMark 是一款基于 Vue 3、Tauri 2 和 Milkdown 开发的跨平台 Markdown 编辑器应用。它提供了现代化的用户界面和丰富的 Markdown 编辑功能，支持文件管理、版本控制、大纲视图等功能。

## 目录结构

```
FlowMark/
├── src/                       # Vue 前端源代码
│   ├── assets/                # 静态资源
│   ├── components/            # Vue 组件
│   │   └── layout/            # 布局组件
│   │       ├── HeaderBar/     # 顶部导航栏
│   │       ├── SidePanel/     # 侧边面板
│   │       ├── EditorArea/    # 编辑区域
│   │       └── SettingsModal/ # 设置弹窗
│   ├── composable/            # Vue 组合式函数
│   ├── i18n/                  # 国际化配置
│   ├── services/              # 服务层
│   │   ├── files/             # 文件相关服务
│   │   ├── fileService.ts     # 文件服务
│   │   ├── deviceService.ts   # 设备服务
│   │   └── routerService.ts   # 路由服务
│   ├── stores/                # Pinia 状态管理
│   │   ├── editorStore.ts     # 编辑器状态
│   │   ├── fileStore.ts       # 文件状态
│   │   ├── settingsStore.ts   # 设置状态
│   │   ├── uiStore.ts         # UI 状态
│   │   └── versionStore.ts    # 版本控制状态
│   ├── types/                 # 类型定义
│   ├── utils/                 # 工具函数
│   ├── App.vue                # 主应用组件
│   └── main.ts                # 入口文件
├── src-tauri/                 # Tauri 桌面应用源码
│   ├── capabilities/          # Tauri 权限配置
│   ├── icons/                 # 应用图标
│   ├── src/                   # Rust 源码
│   ├── Cargo.toml             # Rust 依赖配置
│   └── tauri.conf.json        # Tauri 配置
├── public/                    # 公共静态资源
├── vite.config.ts             # Vite 配置
├── tailwind.config.js         # TailwindCSS 配置
└── package.json               # 项目依赖
```

## 功能特性

### 1. 文件管理

- **文件树浏览**：直观的文件树视图，支持管理 Markdown 文件
- **文件操作**：创建、打开、保存、重命名和删除文件
- **最近文件**：快速访问最近编辑的文件
- **多文件标签页**：支持同时打开多个文件并在标签页中切换

### 2. Markdown 编辑

- **基于 Milkdown 的编辑器**：现代化的 Markdown WYSIWYG 编辑体验
- **代码语法高亮**：支持多种编程语言的代码块语法高亮
- **数学公式**：支持 KaTeX 数学公式渲染
- **表情符号**：支持在文档中插入表情符号
- **剪贴板功能**：支持复制、粘贴文本和图片
- **历史记录**：撤销/重做编辑操作

### 3. 版本控制

- **文件历史版本**：自动保存文件的历史版本
- **版本比较**：查看不同版本之间的差异
- **版本回滚**：恢复到历史版本

### 4. 用户界面

- **响应式布局**：适应不同屏幕尺寸
- **自定义侧边栏**：可调整侧边栏宽度或隐藏
- **大纲视图**：文档标题结构的树状视图，支持导航
- **自定义主题**：支持明暗主题切换

### 5. 其他功能

- **设置系统**：个性化编辑器行为和外观
- **国际化支持**：多语言界面
- **WebDAV 同步**：支持与 WebDAV 服务器同步文件

## 界面设计

### 主界面布局

FlowMark 采用三栏式布局设计：

1. **顶部导航栏**：
   - 文件操作按钮（新建、打开、保存）
   - 编辑功能按钮
   - 设置按钮
   - 应用菜单

2. **左侧侧边栏**：
   - 可折叠设计，支持调整宽度
   - 三个主要标签页：
     - **文件管理**：显示文件树，支持文件操作
     - **大纲视图**：显示当前文档的标题结构
     - **版本历史**：显示当前文件的历史版本列表

3. **主编辑区**：
   - 多标签页文件编辑
   - 所见即所得的 Markdown 编辑器
   - 上方显示文件标签栏，支持切换文件

### 弹窗和对话框

- **设置弹窗**：分类别管理应用设置
- **文件操作对话框**：文件保存、重命名等操作的确认对话框
- **版本比较视图**：对比文件版本差异

### 响应式设计

- 窗口大小变化时自动调整布局
- 支持隐藏侧边栏以最大化编辑区域
- 移动端适配设计

## 技术栈

- **前端**：Vue 3, TypeScript, TailwindCSS, Element Plus
- **编辑器**：Milkdown Markdown 编辑器
- **状态管理**：Pinia
- **构建工具**：Vite
- **桌面应用**：Tauri (Rust)
- **版本控制**：Isomorphic Git
- **国际化**：Vue I18n

"build": "vue-tsc --noEmit && vite build",
