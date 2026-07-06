---
title: "从vibe coding产品反向学习 TypeScript：Agent 方向代码阅读路线"
description: "基于 WayLog 项目的真实代码，梳理 TypeScript 类型、函数、对象、异步编程、React Hooks 与 AgentProposal 安全链路。"
pubDate: 2026-07-06
category: "学习笔记"
draft: false

---



这篇文章不是一份完整的 TypeScript 语法手册，而是一份“反向读项目”的学习路线。

我现在更关心的问题不是“TypeScript 有多少语法”，而是：当我打开一个真实项目时，能不能看懂这些代码为什么这么写、数据怎么流动、哪里是页面、哪里是业务逻辑、哪里是真正写入数据的地方。

WayLog 这个项目很适合做这件事。它是一个 React Native + Expo + TypeScript 项目，里面有旅行行程、Agent 对话、Supabase、AsyncStorage、本地优先同步等真实业务代码。尤其是 Agent 这一块，刚好能把 TypeScript、异步编程、React Hooks 和安全写入协议串起来。

## 先看结论

WayLog 当前的代码风格很典型：

| 观察点 | 项目里的情况 | 学习时该怎么理解 |
| :-- | :-- | :-- |
| 类型声明 | 大量使用 `type` | 主要用来描述数据形状，编译后消失 |
| 运行时代码 | 大量使用 `const`，少量 `let` | 真正运行时存在的变量、函数、对象 |
| 类 | 很少用 `class` | 主要用于自定义错误类，不是 OOP 风格项目 |
| 业务组织方式 | 函数 + 普通对象 + React Hooks | 现代 React / React Native 常见写法 |
| 异步编程 | 非常多 | Agent、存储、同步、Supabase、外部 API 都靠异步 |
| Agent 写入 | 先生成提案，再确认写入 | LLM 不能直接改 Trip，这是核心安全边界 |

最关键的一条学习链路是：

```text
TypeScript 类型
  -> JavaScript 对象和函数
  -> async/await
  -> React Hooks 状态流
  -> AgentProposal 安全协议
  -> Trip 本地优先写入链路
```

如果目标是读懂 WayLog 的 Agent，不需要一开始就把 Expo、React Native 原生模块、构建发布、地图 SDK 都学完。应该先把这条链路打通。

## 推荐阅读路径

我会优先按真实调用链读，而不是从最大的页面文件硬啃。

```text
app/agent.tsx
  -> domains/agent/screens/conversation/agent-conversation-screen.tsx
  -> features/agent/*
  -> supabase/functions/agent-turn/*
  -> features/trips/commands.ts
  -> features/trips/storage.ts
```

这条路径对应的是：

1. `app/agent.tsx`：Agent 页面入口。
2. `domains/agent/screens/conversation/agent-conversation-screen.tsx`：页面状态和用户交互。
3. `features/agent/agent-turn-client.ts`：客户端怎么请求 Agent。
4. `supabase/functions/agent-turn/index.ts`：服务端怎么生成结构化结果。
5. `features/agent/types.ts`：Agent 提案的数据结构。
6. `features/trips/commands.ts`：提案如何变成 Trip 修改。
7. `features/trips/storage.ts`：最终如何写入本地存储并触发同步。

## 一眼判断某段代码该重点看什么

读 TypeScript 项目时，不要看到所有语法都平均用力。可以先建立一张“识别表”：

| 你看到的语法 | 说明 | 阅读重点 |
| :-- | :-- | :-- |
| `type Xxx = { ... }` | 类型别名 | 它描述什么数据形状 |
| `const xxx = ...` | 运行时常量 | 它保存什么值或函数 |
| `async function` | 异步函数 | 它等待什么 IO，错误怎么处理 |
| `await xxx()` | 等 Promise 完成 | 后续代码依赖这个结果 |
| `useState(...)` | React 页面状态 | 哪些用户操作会改变它 |
| `useEffect(...)` | 副作用 | 加载、监听、清理逻辑在哪里 |
| `{ ...trip }` | 对象复制 | 是否避免原地修改 |
| `value is Xxx` | 类型守卫 | 是否在运行时校验未知数据 |
| `Promise.all(...)` | 并发任务 | 任意失败是否会让整体失败 |
| `try/catch/finally` | 错误和清理 | 失败时页面或数据是否回滚 |

## Agent 数据流

WayLog 的 Agent 不是“模型说什么就做什么”。它更像是一条受控流水线：

```text
用户输入消息
  -> AgentConversationScreen 处理页面状态和事件
  -> features/agent/agent-turn-client.ts 请求 Agent Turn
  -> Supabase Edge Function: agent-turn
  -> LLM / Skill 生成结构化结果
  -> AgentProposal，只是一份提案
  -> 客户端运行时校验 proposalId / operationId / expectedUpdatedAt
  -> UI 预览影响范围
  -> 用户确认
  -> features/trips/commands.ts 应用领域命令
  -> features/trips/storage.ts 写入 AsyncStorage
  -> dirty 标记
  -> 后台同步 Supabase
```

核心记忆点：

> LLM 只能生成 `AgentProposal`，不能直接修改 Trip。真正写入发生在用户确认之后。

## TypeScript 类型系统

WayLog 大量使用 `type` 来描述数据形状，很少用传统 OOP 的 `class`。这很符合 React Native + TypeScript 的常见写法。

优先需要理解这些语法：

- `type Xxx = { ... }`：声明对象的形状。
- 联合类型：`"success" | "error" | "loading"`。
- 可选属性：`title?: string`。
- 数组类型：`Trip[]`。
- 泛型：`Promise<T>`、`requestSupabase<T>()`。
- `Record<string, unknown>`：任意 key 的对象。
- `Partial<T>`：某个类型的部分字段。
- `ReturnType<typeof fn>`：从函数推导返回类型。
- `import type { Xxx }`：只导入类型，运行时不存在。

比如 Agent 操作类型可能长这样：

```ts
export type AgentTurnProposalKind =
  | "add_place_to_day"
  | "move_day_item"
  | "remove_day_item"
  | "update_day_item";
```

这表示 `AgentTurnProposalKind` 只能是这 4 个字符串之一。好处是：

- 写错字符串时 TypeScript 会报错。
- 代码阅读者马上知道 Agent 当前支持哪些操作。
- 后续 `if` / `switch` 可以按这几个分支处理。

再看一个输入类型：

```ts
export type RequestAgentTurnInput = {
  accessToken?: string;
  dayId?: string;
  itemId?: string;
  kind: AgentTurnProposalKind;
  trip: Trip;
  userMessage?: string;
};
```

读这个类型时，不要只翻译字段名，而要问：

- 哪些字段必填？`kind` 和 `trip` 必填。
- 哪些字段可选？带 `?` 的字段可选。
- 哪个字段决定行为？`kind`。
- 哪个字段是业务主体？`trip`。

### `type`、`const`、`let` 的区别

我之前容易把“声明”这个词混在一起看。其实 `type`、`const`、`let` 根本不在同一层。

| 语法 | 属于哪一层 | 编译后还在吗 | 用途 |
| :-- | :-- | :-- | :-- |
| `type` | TypeScript 类型层 | 不在 | 描述数据形状 |
| `interface` | TypeScript 类型层 | 不在 | 描述对象或类契约 |
| `const` | JavaScript 运行时 | 在 | 声明不可重新赋值的变量 |
| `let` | JavaScript 运行时 | 在 | 声明可重新赋值的变量 |
| `class` | JavaScript 运行时 | 在 | 创建类、继承、实例 |

例子：

```ts
type TripSummary = {
  id: string;
  title: string;
};

const trip: TripSummary = {
  id: "trip-1",
  title: "东京五日游",
};
```

这里：

- `TripSummary` 是类型，运行时不存在。
- `trip` 是真实对象，运行时存在。
- `: TripSummary` 是给 `trip` 加类型约束。

如果编译成 JavaScript，大致只剩：

```js
const trip = {
  id: "trip-1",
  title: "东京五日游",
};
```

所以不能说“项目里都是 `type`，没有 `const`”。更准确的说法是：项目在类型层大量用 `type`，在运行时大量用 `const`。

## JavaScript 对象语法

WayLog 的核心业务数据几乎都是普通对象：

- `Trip`
- `TripDay`
- `TripDayItem`
- `AgentProposal`
- `PendingAgentProposal`
- `AgentConversationMessage`

这说明项目不是“class 实例满天飞”的写法，而是“数据对象 + 函数处理”的写法。

需要掌握的对象语法：

| 语法 | 示例 | 含义 |
| :-- | :-- | :-- |
| 对象字面量 | `{ id, title }` | 创建对象 |
| 属性访问 | `trip.id` | 读取字段 |
| 解构 | `const { id } = trip` | 从对象取字段 |
| 对象展开 | `{ ...trip, title: next }` | 复制并覆盖字段 |
| 数组展开 | `[...items, nextItem]` | 创建新数组 |
| 可选链 | `trip.owner?.name` | 中间为空时不报错 |
| 空值合并 | `title ?? "未命名"` | 只在 `null` / `undefined` 时兜底 |
| 模板字符串 | `` `trip-${id}` `` | 拼接字符串 |

项目中常见的更新模式是：

```ts
const updatedTrip = {
  ...trip,
  updatedAt: new Date().toISOString(),
};
```

这不是修改原对象，而是基于旧对象创建一个新对象。

这在 React 里很重要，因为 React 通常靠“引用变化”判断状态是否更新。对 WayLog 来说也很重要，因为 Trip 写入链路要尽量避免函数偷偷原地修改传入对象。

常见易错点：

| 易错写法 | 问题 |
| :-- | :-- |
| `trip.title = "新标题"` | 可能原地修改，影响不可预测 |
| `items.push(nextItem)` | 原地改数组，React 状态里容易出问题 |
| `{ trip, title: next }` | 这不是展开，会生成 `{ trip: ..., title: ... }` |
| `value || fallback` | 空字符串、0 也会被 fallback 覆盖 |

更推荐：

```ts
const nextTrip = {
  ...trip,
  title: "新标题",
};

const nextItems = [...items, nextItem];
```

## 函数语法

WayLog 的业务逻辑主要靠函数组织，而不是靠类。你会看到：

- 纯函数：输入数据，返回新数据。
- 异步函数：请求网络、读写存储。
- React 事件函数：响应用户点击。
- 回调函数：传给 `map`、`filter`、`useEffect`、`setState`。
- 高阶函数：接收另一个函数作为参数。

普通函数：

```ts
function normalizeTrip(trip: Trip): Trip {
  return trip;
}
```

箭头函数 + 异步：

```ts
const submitMessage = async () => {
  const result = await requestAgentTurn(input);
  return result;
};
```

回调函数：

```ts
const titles = trip.days.map((day) => day.title);
```

高阶函数：

```ts
async function withAgentConversationMutationQueue<T>(
  conversationId: string,
  task: () => Promise<T>,
): Promise<T> {
  await previousTail.catch(() => undefined);
  return await task();
}
```

这里最关键的是 `task: () => Promise<T>`。它的意思是：参数 `task` 本身是一个函数，调用后返回 `Promise<T>`。

### 函数签名怎么读

看到这个类型：

```ts
type PersistTripUpdate = (
  nextTrip: Trip,
  fallbackTrip: Trip,
  errorMessage?: string,
) => Promise<boolean>;
```

可以逐段读：

- `PersistTripUpdate` 是一个函数类型。
- 它接收 3 个参数。
- `nextTrip` 和 `fallbackTrip` 必填。
- `errorMessage` 可选。
- 返回 `Promise<boolean>`，说明这是异步函数，最终结果是布尔值。

## 异步编程

如果要搞 Agent，异步编程是核心能力。Agent 涉及：

- 模型请求
- Supabase Edge Function
- AsyncStorage 本地存储
- 云同步
- POI 搜索
- 天气请求
- 超时取消
- 错误处理

这些都不是立即返回结果的计算，而是 IO。IO 在 TypeScript / JavaScript 里通常用 `Promise` 表达。

必须掌握的异步语法：

| 语法 | 含义 |
| :-- | :-- |
| `async function` | 声明异步函数 |
| `await promise` | 等 Promise 完成 |
| `Promise<T>` | 未来会得到一个 `T` |
| `try/catch` | 捕获失败 |
| `finally` | 无论成功失败都执行清理 |
| `Promise.all()` | 并发执行，任意失败则整体失败 |
| `Promise.allSettled()` | 并发执行，保留每个任务成功/失败 |
| `AbortController` | 取消请求 |
| `setTimeout()` | 延迟或超时 |
| `fetch()` | 发 HTTP 请求 |

典型请求流程：

```ts
export async function requestSupabase<T>(
  options: SupabaseRequestOptions,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
    });

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeoutId);
  }
}
```

重点：

- `requestSupabase<T>` 是泛型异步函数。
- `fetch` 返回 `Promise<Response>`。
- `await response.json()` 也返回 Promise。
- `finally` 里清理 timeout，避免残留。
- `as T` 是类型断言，不等于运行时校验。

异步错误处理也很重要：

```ts
try {
  const result = await requestAgentTurn(input);
  setMessages((current) => [...current, result.message]);
} catch (error) {
  const message =
    error instanceof Error ? error.message : "Agent 请求失败";
  setActionError(message);
}
```

读这种代码时问 4 件事：

1. 哪一步可能失败？
2. 失败时 UI 怎么显示？
3. 是否会留下半个状态？
4. 是否需要回滚或重试？

常见易错点：

| 易错点 | 正确理解 |
| :-- | :-- |
| 忘记 `await` | 得到的是 Promise，不是真实结果 |
| 在 `map` 里写 async 但不 `await Promise.all` | 任务可能没等完 |
| 以为 `try/catch` 能捕获没 await 的 Promise | 不能稳定捕获 |
| `Promise.all` 用在可容忍失败的场景 | 一个失败会导致整体失败 |
| 超时后不清理 timer | 会造成多余回调 |

## React 和 Hooks

只想搞 Agent，也需要懂 React 的页面状态流。否则会看不懂：

- 用户点发送后，消息怎么进入页面。
- 请求中状态怎么显示。
- Agent 提案为什么会先进入“待确认”状态。
- 用户确认后为什么要更新 Trip。
- 错误为什么会显示在弹窗或提示区。

必须先懂这些 Hooks：

| Hook | 用途 | 在 Agent 页面里的意义 |
| :-- | :-- | :-- |
| `useState` | 页面状态 | 消息、错误、待确认提案、加载状态 |
| `useEffect` | 副作用 | 加载会话、监听数据变化、清理状态 |
| `useMemo` | 缓存计算 | 避免每次渲染都重复算派生数据 |
| `useCallback` | 缓存函数 | 事件函数稳定传给子组件 |
| `useRef` | 保存可变值 | 防重复提交、记录正在执行的状态 |

典型代码：

```tsx
const [messages, setMessages] = useState<AgentConversationMessage[]>([]);

useEffect(() => {
  void loadConversation();
}, []);

const submitMessage = async () => {
  const result = await requestAgentTurn(input);
  setMessages((current) => [...current, result.message]);
};
```

要点：

- `messages` 是当前状态。
- `setMessages` 用来更新状态。
- `useEffect(..., [])` 通常表示组件挂载时执行一次。
- `void loadConversation()` 表示故意不等待这个 Promise，但要明确知道错误在哪里处理。
- `setMessages((current) => ...)` 用当前最新状态计算下一状态。

React 页面不是普通脚本。普通脚本像这样：

```text
第一行 -> 第二行 -> 第三行 -> 结束
```

React 页面更像这样：

```text
初次渲染
  -> 用户点击
  -> 事件函数执行
  -> setState
  -> 重新渲染
  -> useEffect 可能执行
  -> 再等待下一次用户事件
```

所以读 React 文件时，不要只从上到下一行行读。要找：

- 状态在哪里声明？
- 状态在哪里被修改？
- 用户事件在哪里触发？
- 异步结果回来后改了什么状态？
- 子组件接收了哪些 props？

## Expo 和 React Native 够用知识

如果重点是 Agent，不需要一开始深学 Expo。先知道这些就够了：

| 知识点 | 够用理解 |
| :-- | :-- |
| `app/` 文件路由 | 文件路径决定页面路由 |
| `app/agent.tsx` | Agent 页面入口 |
| `useLocalSearchParams` | 读取路由参数 |
| `View` | 容器 |
| `Text` | 文本 |
| `Pressable` | 可点击区域 |
| `ScrollView` | 滚动区域 |
| AsyncStorage | 手机本地 key-value 存储 |
| `EXPO_PUBLIC_*` | 会暴露给客户端的环境变量 |

暂时不用优先深学：

- Android / iOS 原生模块。
- Expo 构建发布。
- 推送通知。
- 动画系统。
- 地图 SDK 深入。
- 应用签名和商店发布流程。

## Agent 业务概念

这是我最终要重点掌握的部分。

WayLog 的 Agent 不是“模型说什么就做什么”。它有一个安全协议：

```text
模型输出
  -> AgentProposal
  -> 客户端校验
  -> 用户预览
  -> 用户确认
  -> Trip 命令
  -> 本地写入
  -> 云同步
```

核心概念：

| 概念 | 作用 |
| :-- | :-- |
| `AgentProposal` | Agent 生成的提案 |
| `proposalId` | 提案唯一 ID |
| `operationId` | 单个操作唯一 ID |
| `expectedUpdatedAt` | 防止基于旧 Trip 修改 |
| runtime validation | 运行时校验模型返回 |
| idempotency | 防止重复应用同一操作 |
| confirm before write | 默认用户确认后才写入 |
| local-first | 先写本地，再同步云端 |

为什么不能让 LLM 直接写 Trip？

因为模型输出是不可信的。它可能：

- 指向错误的 `tripId`。
- 基于旧版本 Trip 生成修改。
- 删除用户不想删的内容。
- 生成重复操作。
- 漏掉必填字段。
- 把外部资料里的提示词当成系统指令。

所以 WayLog 的策略是：

1. LLM 只生成结构化提案。
2. 客户端校验提案。
3. UI 展示影响范围。
4. 用户确认。
5. 客户端用受控命令修改 Trip。

重点文件索引：

| 文件 | 阅读重点 |
| :-- | :-- |
| `features/agent/types.ts` | `AgentProposal` 数据结构 |
| `features/agent/agent-turn-client.ts` | 客户端请求 Agent Turn |
| `features/agent/applied-proposals.ts` | 已应用操作记录，防重复 |
| `features/agent/runtime-tool-router.ts` | 工具路由和运行时边界 |
| `domains/agent/screens/conversation/agent-conversation-screen.tsx` | 页面状态和交互 |
| `supabase/functions/agent-turn/index.ts` | Edge Function 入口 |
| `supabase/functions/agent-turn/llm-client.ts` | LLM 请求 |
| `supabase/functions/agent-turn/skills/add-place.ts` | 添加地点 skill |
| `features/trips/commands.ts` | Trip 领域命令 |
| `features/trips/storage.ts` | 本地优先写入 |

## Supabase 和 Edge Function

Agent 服务端运行在 Supabase Edge Function 中。不需要一开始成为 Supabase 专家，但需要懂 HTTP 和服务端函数基本结构。

需要掌握：

- `Deno.serve(...)`
- `Request` / `Response`
- `await request.json()`
- HTTP status：`200`、`400`、`401`、`405`、`500`
- Authorization header
- JWT 用户身份
- Edge Function 调 LLM
- JSON 响应结构

典型结构：

```ts
Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = await request.json();
  const result = await requestAgentLLMJson(body);

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
});
```

读 Edge Function 时重点问：

- 它允许哪些 HTTP 方法？
- 它从哪里拿用户身份？
- 它有没有信任客户端传来的 `userId`？
- 它有没有直接写用户 Trip？
- 它返回的是自由文本还是结构化 JSON？

## 错误处理和运行时校验

Agent 场景里，错误处理不是附属内容，而是安全边界的一部分。

TypeScript 类型只能约束自己写的代码，不能天然保证：

- 网络响应一定符合类型。
- LLM 返回一定符合类型。
- AsyncStorage 里的历史数据一定没坏。
- 外部 API 一定正常。

所以项目需要运行时校验。

项目里的 TypeScript `class` 很少，典型用途是自定义错误：

```ts
export class AgentTurnClientError extends Error {
  code: AgentTurnClientErrorCode;
}
```

这类 class 的作用不是组织业务对象，而是让错误更有结构：

- `error.message` 给人看。
- `error.code` 给程序判断。
- `error instanceof AgentTurnClientError` 可以识别错误类型。

另一个重要语法是类型守卫：

```ts
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
```

这类函数的价值是：

1. 运行时真的检查了一次。
2. TypeScript 在 `if (isRecord(value))` 之后会把 `value` 缩窄成对象类型。

这比直接写 `value as Record<string, unknown>` 更安全。

常见风险：

| 写法 | 风险 |
| :-- | :-- |
| `const data = await response.json() as AgentProposal` | 只是告诉 TypeScript 相信你，没有真正校验 |
| 不检查 `response.ok` | 失败响应也可能被当成功数据处理 |
| catch 后只 `console.log` | UI 和调用方可能不知道失败了 |
| 忽略 `finally` | 加载状态、锁、timer 可能不清理 |

## 从测试反向学习

测试能告诉我一个函数“应该怎么用”。当我读不懂某个 Agent 函数时，去看测试通常比硬读实现更快。

重点目录：

- `tests/features/agent/`
- `tests/features/trips/`
- `tests/hooks/`

常用命令：

```bash
pnpm test
pnpm typecheck
pnpm lint
```

Agent 操作测试应该覆盖：

| 场景 | 为什么要测 |
| :-- | :-- |
| 正常应用 | 确认 happy path |
| 无效参数 | 防止模型返回坏数据 |
| 目标不存在 | Trip 已变化时不误写 |
| 重复确认 | 防止重复执行 |
| 版本冲突 | 防止基于旧数据修改 |
| 中途失败 | 防止留下半个 Trip |

## 读代码时的检查问题

每读一个函数，都可以问自己：

- 这个函数是同步还是异步？
- 它接收什么类型的输入？
- 它返回什么类型的结果？
- 它有没有修改外部状态？
- 它有没有写 AsyncStorage？
- 它有没有调用 Supabase？
- 它处理错误了吗？
- 它是不是只生成提案，还是会真正写入 Trip？
- 它依赖用户确认吗？
- 它有没有防止重复执行？
- 它有没有校验外部输入？
- 它有没有可能基于旧 Trip 修改？

每读一个 React 页面，问：

- 这个页面有哪些 `useState`？
- 哪些状态是加载态？
- 哪些状态是错误态？
- 哪些状态代表“待确认”？
- 哪些函数由按钮触发？
- 哪些函数会发请求？
- 哪些函数会写入本地数据？
- 哪些 props 传给了子组件？
- 哪些逻辑应该抽到 `features/`？

每读一个 Agent 文件，问：

- 这里是在生成提案，还是在应用提案？
- 这里有没有校验 `proposalId`？
- 这里有没有校验 `operationId`？
- 这里有没有校验 `expectedUpdatedAt`？
- 这里有没有处理重复操作？
- 这里有没有绕过用户确认？
- 这里有没有直接写云端 Trip？
- 这里有没有信任外部内容？

## 学习优先级

### P0：必须先懂

- `type` 和对象类型。
- `const` / `let` 和运行时代码。
- 函数参数和返回值类型。
- `async` / `await` / `Promise`。
- `try/catch/finally`。
- 对象展开和数组展开。
- React `useState` / `useEffect`。
- `AgentProposal` 的安全边界。

### P1：读 Agent 时很快会用到

- 泛型：`<T>`。
- 类型守卫：`value is Xxx`。
- `unknown` 和运行时校验。
- `useCallback` / `useMemo` / `useRef`。
- HTTP 请求和响应。
- Supabase Edge Function。
- AsyncStorage。
- 测试中的 mock。

### P2：暂时不用急

- class/OOP 深度设计。
- `interface` vs `type` 的所有细节争论。
- 高级 TypeScript 类型体操。
- React Native 原生模块。
- Expo 发布和签名。
- 动画系统。
- 地图 SDK 深入。
- iOS / Android 原生开发。

## 后续扩写计划

这篇文章只是总览。后续可以继续按章节展开：

| 顺序 | 章节 | 目标 |
| :-- | :-- | :-- |
| 1 | TypeScript 类型系统详解 | 看懂 `features/agent/types.ts` |
| 2 | 函数语法详解 | 看懂业务函数和 React 事件函数 |
| 3 | 对象与不可变更新 | 看懂 Trip 如何被复制和修改 |
| 4 | 异步编程详解 | 看懂请求、存储、同步 |
| 5 | React Hooks 详解 | 看懂 Agent 页面状态流 |
| 6 | AgentProposal 协议详解 | 看懂模型输出和安全校验 |
| 7 | Trip 写入链路详解 | 看懂本地优先和云同步 |
| 8 | 测试反向阅读 | 从测试倒推业务规则 |

每章可以固定成这个结构：

```text
概念解释
  -> 项目中的真实例子
  -> 易错点
  -> 自测题
  -> 建议阅读文件
```

## 术语小抄

| 术语 | 简明解释 |
| :-- | :-- |
| 类型层 | TypeScript 编译期存在的东西，比如 `type` |
| 运行时 | App 真正执行时存在的东西，比如 `const` 对象 |
| Promise | 未来才会完成的异步结果 |
| Hook | React 函数组件里管理状态和副作用的函数 |
| Proposal | Agent 给出的修改提案 |
| Operation | Proposal 里的一个具体操作 |
| Runtime validation | 运行时校验外部数据 |
| Idempotency | 同一个操作重复执行也不会造成重复写入 |
| Local-first | 先写本地，再同步云端 |
| Edge Function | Supabase 上运行的服务端函数 |

## 最短总结

如果目标是搞 WayLog 的 Agent，不需要一开始成为 Expo 或 React Native 专家。

最应该先打通的是：

```text
TypeScript 类型
  -> 函数和对象
  -> 异步请求和存储
  -> React 页面状态
  -> AgentProposal
  -> Trip 本地优先写入
```

读代码时始终抓住一句话：

> Agent 不是直接执行者，它先提出结构化修改；真正写入必须经过校验、预览和确认。
