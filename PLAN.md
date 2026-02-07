# CodeMoss 看板模式 (Kanban Mode) 实现计划

## 一、需求总结

1. **模式切换入口**: 在 SidebarHeader 版本号旁添加 "对话模式 | 看板模式" 切换控件
2. **看板模式全屏**: 切换到看板模式时隐藏侧边栏，主内容区全屏展示看板（切换入口保留）
3. **项目管理**: 进入看板模式后先展示项目列表，支持创建/编辑/删除项目
4. **看板视图**: 点击项目进入看板，5 个列：待办、进行中、测试、完成、取消
5. **任务管理**: 看板中创建任务，数据完全独立于历史对话
6. **任务创建弹窗**: 标题、描述、引擎选择、模型选择、分支选择、图片上传、"开始"开关、创建按钮
7. **"开始"开关行为**: 开 = 创建任务(进行中) + 自动启动 AI 对话；关 = 仅创建任务(待办)

## 二、设计决策

| 决策点 | 选择 | 原因 |
|--------|------|------|
| 侧边栏行为 | 看板模式下隐藏侧边栏，全屏展示看板 | 用户明确要求，参考图二 |
| 切换入口 | SidebarHeader 版本号旁保留切换按钮 | 即使侧边栏隐藏，也能通过顶部小入口切回 |
| 状态管理 | 遵循现有 custom hooks 模式，不引入新库 | 项目架构一致性 |
| 数据持久化 | localStorage (第一阶段) | 零 Rust 改动，快速实现 |
| 拖拽库 | `@hello-pangea/dnd` | 与参考项目一致，API 稳定 |
| 视图切换 | 纯状态驱动 (不引入路由库) | 遵循现有模式 |
| 数据隔离 | 看板任务独立存储，不混入对话数据 | 需求明确要求 |

## 三、新增文件结构

```
src/features/kanban/                     # 新增 feature 模块
  types.ts                              # 看板数据模型定义
  constants.ts                          # 列配置、存储键、颜色
  hooks/
    useKanbanStore.ts                   # 核心数据 hook (CRUD + 持久化)
    useKanbanNavigation.ts              # 看板内部视图导航 (项目列表 ↔ 看板)
  components/
    KanbanView.tsx                      # 看板模式入口容器 (条件渲染项目列表 or 看板)
    KanbanModeToggle.tsx                # 模式切换控件 (对话 | 看板)
    ProjectList.tsx                     # 项目列表页 (网格卡片 + 创建按钮)
    ProjectCard.tsx                     # 项目卡片
    ProjectFormModal.tsx                # 项目创建/编辑弹窗
    KanbanBoard.tsx                     # 看板视图 (DragDropContext + 5 列)
    KanbanBoardHeader.tsx               # 看板顶部 (返回按钮 + 项目名 + 模式切换)
    KanbanColumn.tsx                    # 看板单列 (Droppable + 卡片列表)
    KanbanCard.tsx                      # 任务卡片 (Draggable)
    TaskCreateModal.tsx                 # 任务创建弹窗
  utils/
    kanbanStorage.ts                    # localStorage 读写工具
    kanbanId.ts                         # nanoid 或 timestamp ID 生成

src/styles/kanban.css                   # 看板全部样式
```

## 四、需要修改的现有文件

| 文件 | 修改内容 | 改动量 |
|------|---------|--------|
| `src/App.tsx` (2354行) | 新增 `appMode` state + `useKanbanStore` hook + `kanbanNode` 组装 + 传递给 AppLayout | ~25 行 |
| `src/types.ts` | 新增 `AppMode = "chat" \| "kanban"` | 1 行 |
| `src/features/app/components/SidebarHeader.tsx` | 添加 `appMode` + `onAppModeChange` props，渲染 KanbanModeToggle | ~10 行 |
| `src/features/app/components/Sidebar.tsx` | 透传 `appMode` + `onAppModeChange` 到 SidebarHeader | ~5 行 |
| `src/features/app/components/AppLayout.tsx` | 新增 `showKanban` + `kanbanNode` props，看板模式条件渲染 | ~15 行 |
| `src/features/layout/components/DesktopLayout.tsx` | 新增 `showKanban` + `kanbanNode` props，看板全屏渲染（隐藏 sidebar + resizer） | ~15 行 |
| `src/features/layout/hooks/useLayoutNodes.tsx` | 透传 `appMode` + `onAppModeChange` 到 Sidebar | ~5 行 |
| `package.json` | 新增 `@hello-pangea/dnd` 依赖 | 1 行 |

## 五、数据模型

```typescript
// src/features/kanban/types.ts

export type KanbanTaskStatus = "todo" | "inprogress" | "testing" | "done" | "cancelled";

export type KanbanColumnDef = {
  id: KanbanTaskStatus;
  labelKey: string;       // i18n key
  color: string;
};

export type KanbanProject = {
  id: string;
  name: string;
  createdAt: number;      // timestamp
  updatedAt: number;
};

export type KanbanTask = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: KanbanTaskStatus;
  engineType: string;     // "claude" | "codex" | "gemini" | "opencode"
  modelId: string | null;
  branchName: string;
  images: string[];       // 图片文件路径
  autoStart: boolean;     // 创建时是否自动开始
  sortOrder: number;      // 列内排序权重
  threadId: string | null; // 关联的对话 thread ID (autoStart=true 时填充)
  createdAt: number;
  updatedAt: number;
};

// 看板视图导航状态
export type KanbanViewState =
  | { view: "projects" }
  | { view: "board"; projectId: string };

// localStorage 持久化结构
export type KanbanStoreData = {
  projects: KanbanProject[];
  tasks: KanbanTask[];
};
```

## 六、组件设计概要

### 6.1 KanbanModeToggle (模式切换控件)
- 位置: SidebarHeader 版本号右侧
- 外观: 两个小图标按钮（MessageSquare / LayoutDashboard），当前激活项高亮
- 看板模式全屏时: 在 KanbanBoardHeader 左上角也显示此控件（用于切回对话模式）

### 6.2 KanbanView (入口容器)
```
KanbanView
  ├── viewState === "projects" → <ProjectList>
  └── viewState === "board"    → <KanbanBoard>
```

### 6.3 ProjectList (项目列表)
```
<div class="kanban-projects">
  <div class="kanban-projects-header">
    <h1>项目</h1>
    <p>管理您的项目并跟踪其进度</p>
    <button>+ 创建项目</button>
  </div>
  <div class="kanban-projects-grid">     <!-- 参考图二: 3 列网格 -->
    {projects.map(p => <ProjectCard>)}
  </div>
</div>
```

### 6.4 ProjectCard (项目卡片)
- 显示: 项目名称 + 创建日期 + "..." 菜单(编辑/删除)
- 点击进入看板视图

### 6.5 KanbanBoard (看板视图)
```
<div class="kanban-board">
  <KanbanBoardHeader>               <!-- 返回箭头 + 项目名 + 模式切换 -->
  <DragDropContext onDragEnd={...}>
    <div class="kanban-columns">    <!-- 水平滚动的 5 列 -->
      {KANBAN_COLUMNS.map(col => <KanbanColumn>)}
    </div>
  </DragDropContext>
</div>
```

### 6.6 KanbanColumn (单列)
```
<div class="kanban-column">
  <div class="kanban-column-header">
    <span class="kanban-column-dot" style={color} />
    <span>{columnName}</span>
    <span class="kanban-column-count">{tasks.length}</span>
    <button class="kanban-column-add">+</button>
  </div>
  <Droppable droppableId={columnId}>
    {tasks.map((task, i) => <KanbanCard index={i}>)}
  </Droppable>
</div>
```

### 6.7 KanbanCard (任务卡片)
- 显示: 任务标题 + 引擎/模型标签 + "..." 菜单(编辑/删除/移动)
- `Draggable` 包裹，支持跨列拖拽

### 6.8 TaskCreateModal (任务创建弹窗)
```
<dialog class="kanban-task-modal">
  <input placeholder="任务标题" />
  <textarea placeholder="添加更多详情（可选）。输入 @ 搜索文件。" />
  <div class="kanban-task-modal-selectors">
    <EngineSelector />          <!-- 复用现有组件 -->
    <ModelSelector />           <!-- 下拉选择模型 -->
    <BranchSelector />          <!-- 下拉选择分支 -->
  </div>
  <div class="kanban-task-modal-footer">
    <button class="image-upload">📎</button>
    <div class="kanban-task-modal-actions">
      <Toggle label="开始" />   <!-- 开 = 创建后自动启动对话 -->
      <button>创建</button>
    </div>
  </div>
</dialog>
```

## 七、状态管理和数据流

### 7.1 App.tsx 新增状态 (~25 行)

```typescript
// 在 MainApp 函数中新增：
const [appMode, setAppMode] = useState<AppMode>("chat");

const {
  projects, tasks,
  kanbanViewState, setKanbanViewState,
  createProject, updateProject, deleteProject,
  createTask, updateTask, deleteTask,
  reorderTask,
} = useKanbanStore();

// 看板节点组装
const kanbanNode = appMode === "kanban" ? (
  <KanbanView
    viewState={kanbanViewState}
    onViewStateChange={setKanbanViewState}
    projects={projects}
    tasks={tasks}
    onCreateProject={createProject}
    onUpdateProject={updateProject}
    onDeleteProject={deleteProject}
    onCreateTask={createTask}
    onUpdateTask={updateTask}
    onDeleteTask={deleteTask}
    onReorderTask={reorderTask}
    onAppModeChange={setAppMode}
    // 引擎/模型/分支 props 复用现有数据
    engines={engineStatuses}
    models={effectiveModels}
    branches={branches}
    // 启动对话需要的 callbacks
    connectWorkspace={connectWorkspace}
    startThreadForWorkspace={startThreadForWorkspace}
    sendUserMessageToThread={sendUserMessageToThread}
  />
) : null;

// 修改视图条件
const showHome = !activeWorkspace && appMode === "chat";
const showKanban = appMode === "kanban";
```

### 7.2 布局集成 (DesktopLayout 修改)

```
看板模式时:
  ├── 隐藏 sidebar + sidebar-resizer
  └── <section class="main"> 渲染 kanbanNode (全屏)

对话模式时:
  └── 保持原有布局不变
```

### 7.3 useKanbanStore hook 核心逻辑

```typescript
// 1. 初始化: 从 localStorage 加载数据
// 2. CRUD: 不可变更新 (spread + filter/map)
// 3. 持久化: useEffect 监听 store 变化，防抖写入 localStorage
// 4. 拖拽排序: reorderTask(taskId, newStatus, newSortOrder) 更新状态和排序
```

## 八、看板模式全屏行为详细说明

当用户点击"看板模式"时:
1. `appMode` 设为 `"kanban"`
2. `DesktopLayout` 检测到 `showKanban=true`，隐藏 `sidebarNode` + `sidebar-resizer`
3. `<section class="main">` 占满全宽，只渲染 `kanbanNode`
4. 看板头部 `KanbanBoardHeader` 左侧显示 `KanbanModeToggle`，可以切回对话模式

当用户点击"对话模式"时:
1. `appMode` 设为 `"chat"`
2. 恢复正常的侧边栏 + 主内容区布局
3. 侧边栏中的 `KanbanModeToggle` 再次可见

## 九、任务创建 + "开始"开关的完整行为

### 开关关闭 (默认):
1. 创建 `KanbanTask`，`status = "todo"`, `threadId = null`
2. 任务出现在"待办"列

### 开关打开:
1. 创建 `KanbanTask`，`status = "inprogress"`, `autoStart = true`
2. 根据任务的 `engineType` 和 `modelId`，调用现有的对话启动流程:
   - `connectWorkspace(workspaceId)` 连接工作区
   - `startThreadForWorkspace(workspaceId)` 创建新 thread
   - `sendUserMessageToThread(threadId, taskDescription)` 发送任务描述
3. 将返回的 `threadId` 保存到 `KanbanTask.threadId`
4. 任务出现在"进行中"列

> 注: 第一阶段"开始"功能可以先实现基本流程，后续迭代优化对话关联体验。

## 十、分阶段实现步骤

### 阶段 1: 基础设施 (预计 4 步)

| 步骤 | 任务 | 文件 |
|------|------|------|
| 1.1 | 安装 `@hello-pangea/dnd` | `package.json` |
| 1.2 | 在 `src/types.ts` 新增 `AppMode` 类型 | `src/types.ts` |
| 1.3 | 创建看板类型定义 | `src/features/kanban/types.ts` |
| 1.4 | 创建看板常量 + ID 工具 + 存储工具 | `constants.ts`, `kanbanId.ts`, `kanbanStorage.ts` |

### 阶段 2: 数据层 (预计 2 步)

| 步骤 | 任务 | 文件 |
|------|------|------|
| 2.1 | 实现 `useKanbanStore` hook | `hooks/useKanbanStore.ts` |
| 2.2 | 实现 `useKanbanNavigation` hook | `hooks/useKanbanNavigation.ts` |

### 阶段 3: 模式切换 UI (预计 4 步)

| 步骤 | 任务 | 文件 |
|------|------|------|
| 3.1 | 创建 `KanbanModeToggle` 组件 | `components/KanbanModeToggle.tsx` |
| 3.2 | 修改 `SidebarHeader` 添加切换控件 | `SidebarHeader.tsx` |
| 3.3 | 透传 `appMode` 通过 Sidebar → useLayoutNodes → App | `Sidebar.tsx`, `useLayoutNodes.tsx` |
| 3.4 | 添加切换控件样式 | `kanban.css` |

### 阶段 4: 布局集成 (预计 3 步)

| 步骤 | 任务 | 文件 |
|------|------|------|
| 4.1 | 修改 `DesktopLayout` 支持看板全屏模式 | `DesktopLayout.tsx` |
| 4.2 | 修改 `AppLayout` 透传看板 props | `AppLayout.tsx` |
| 4.3 | 修改 `App.tsx` 添加 `appMode` 状态和 kanbanNode 组装 | `App.tsx` |

### 阶段 5: 项目管理页 (预计 4 步)

| 步骤 | 任务 | 文件 |
|------|------|------|
| 5.1 | 创建 `KanbanView` 入口容器 | `components/KanbanView.tsx` |
| 5.2 | 创建 `ProjectList` + `ProjectCard` | `ProjectList.tsx`, `ProjectCard.tsx` |
| 5.3 | 创建 `ProjectFormModal` | `ProjectFormModal.tsx` |
| 5.4 | 添加项目列表样式 | `kanban.css` |

### 阶段 6: 看板视图 (预计 5 步)

| 步骤 | 任务 | 文件 |
|------|------|------|
| 6.1 | 创建 `KanbanBoardHeader` | `KanbanBoardHeader.tsx` |
| 6.2 | 创建 `KanbanColumn` (Droppable) | `KanbanColumn.tsx` |
| 6.3 | 创建 `KanbanCard` (Draggable) | `KanbanCard.tsx` |
| 6.4 | 创建 `KanbanBoard` (DragDropContext) | `KanbanBoard.tsx` |
| 6.5 | 添加看板视图样式 | `kanban.css` |

### 阶段 7: 任务创建弹窗 (预计 2 步)

| 步骤 | 任务 | 文件 |
|------|------|------|
| 7.1 | 创建 `TaskCreateModal` | `TaskCreateModal.tsx` |
| 7.2 | 添加弹窗样式 | `kanban.css` |

### 阶段 8: "开始"功能集成 (预计 2 步)

| 步骤 | 任务 | 文件 |
|------|------|------|
| 8.1 | 实现 autoStart 逻辑: 创建对话 + 发送消息 | `KanbanView.tsx` or `useKanbanStore.ts` |
| 8.2 | 任务与 thread 关联 (threadId 写回) | `useKanbanStore.ts` |

### 阶段 9: 样式打磨 + i18n (预计 2 步)

| 步骤 | 任务 | 文件 |
|------|------|------|
| 9.1 | 完善所有看板组件的样式细节 | `kanban.css` |
| 9.2 | 添加中英文翻译 | `i18n/locales/en.ts`, `zh.ts` |

## 十一、风险和注意事项

1. **App.tsx 复杂度**: 文件已 2354 行，新增约 25 行可控。看板逻辑主要在 `useKanbanStore` hook 中。
2. **props drilling 链**: useLayoutNodes 已接收 ~400 个属性，新增 `appMode` + `onAppModeChange` 约 2 个。
3. **@hello-pangea/dnd + React 19**: 需验证兼容性。备选方案: `@dnd-kit/core`。
4. **localStorage 5MB 限制**: 只存文件路径，不存图片数据，足够数千个任务。
5. **"开始"功能**: 需要复用现有的 workspace → thread → sendMessage 流程，可能需要处理"当前没有 workspace"的场景。

## 十二、不在本阶段实现的功能

- 对话视图内展示看板任务状态
- 任务详情页（点击卡片展开右侧面板）
- 看板过滤/搜索
- 任务评论/附件
- 多人协作
- 后端 Rust JSON 文件持久化 (后续从 localStorage 迁移)
