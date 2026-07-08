---
title: "API、SDK、Skill、MCP 与插件"
description: "API、SDK、Skill、MCP 和插件分别处在 Agent 系统的哪一层？它们如何配合，把模型能力变成可开发、可连接、可复用的产品能力？"
pubDate: 2026-07-07
category: "学习笔记"
draft: false
pinned: false
priority: 0
---

# API、SDK、Skill、MCP 与插件

[返回 Agent 开发笔记合集](./0、agent-dev-notes.md)

## 1、先看总关系

这几个词经常一起出现，但它们不是同一个层级。

API 是服务接口，SDK 是调用接口的代码库，Skill 是可复用的工作说明，MCP 是连接外部工具和上下文的协议，插件是把能力打包安装的分发单元。

```text
你的产品 / 脚本 / CI
    |
    | 通过 SDK 或 HTTP 请求
    v
OpenAI API / 模型 API
    |
    | function calling / built-in tools / remote MCP / skills
    v
模型可调用的能力层

Codex / Agent 侧
    |
    | 加载说明、工具和集成
    v
Skill = 怎么做
MCP = 连到哪里、能调什么
Plugin = 怎么打包、安装、分发
```



一句话记忆：

```text
API 提供能力入口
SDK 让代码更容易调用 API
Skill 教 Agent 怎么做一类事
MCP 让 Agent 连接外部工具和资源
Plugin 把一组能力打包成可安装扩展
```

## 2、API：能力入口

API 是系统对外暴露的服务接口。

在 AI 应用里，API 通常负责接收输入、调用模型、处理工具调用、返回自然语言或结构化结果。

如果你在自己的产品里接入模型，例如聊天助手、代码分析器、文档问答、自动化脚本，最底层通常是在调用模型 API。

API 关注的是“能请求什么能力、传什么参数、返回什么结果”。

它不是工作流本身，也不替你决定业务逻辑。业务流程、状态管理、权限控制和 UI，仍然由你的系统负责。

## 3、SDK：调用 API 的代码库

SDK 是 Software Development Kit，可以理解为官方或第三方提供的代码工具包。

它把 HTTP 请求、鉴权、流式输出、类型定义、错误处理等细节封装起来，让开发者用更自然的语言调用 API。

比如不用手写 `fetch`、请求头和 JSON 解析，而是直接调用类似 `client.responses.create(...)` 的方法。

SDK 关注的是“怎么在某种编程语言里更方便、更安全地调用能力”。

所以 SDK 不是新能力本身。它更像 API 的开发者友好外壳。

## 4、Agents SDK 与 Codex SDK

OpenAI SDK 面向通用 API 调用。

Agents SDK 更高一层，面向 agent 应用编排。它适合处理工具循环、handoff、guardrails、session、tracing 等问题。

如果你要做一个客服 agent、研究 agent、订单处理 agent，Agents SDK 更接近应用框架。

Codex SDK 则面向 Codex 线程。它让你可以在 CI、内部工具或工程自动化里，用代码启动和控制 Codex coding agent。

可以这样区分：

| 类型 | 主要用途 | 典型场景 |
| --- | --- | --- |
| OpenAI SDK | 调用模型 API | 产品后端、脚本、原型 |
| Agents SDK | 构建 agent 应用 | 工具循环、handoff、追踪 |
| Codex SDK | 控制 Codex 线程 | 代码修改、CI 修复、工程任务 |

## 5、Skill：可复用的工作说明

Skill 是给 Agent 使用的专项 SOP。

它通常包含触发条件、操作步骤、约束、示例、参考资料和可选脚本。Codex 会先看到 skill 的名称和描述，真的需要时再读取完整说明。

Skill 解决的是“Agent 应该怎样完成某类任务”。

比如代码评审 skill 可以规定：先读 diff，再找 bug 和回归风险，最后输出按严重程度排序的 findings。

Skill 可能包含 prompt，但它不只是 prompt。

一条 prompt 是一次性指令；Skill 更像可维护、可复用、可分发的工作流说明书。

![img](https://www.runoob.com/wp-content/uploads/2026/04/80cee499-1881-49b9-a5ea-e637c139a490.webp)

![img](https://www.runoob.com/wp-content/uploads/2026/04/markdown_body_structure.svg)

## 6、MCP：连接工具和上下文的协议

MCP 是 Model Context Protocol。

它解决的是“模型或 Agent 如何统一连接外部工具、资源和上下文”。

例如 Figma、GitHub、浏览器、Sentry、Google Drive、内部文档系统，都可以通过 MCP server 暴露工具或资源。

MCP 更接近“活的连接层”。它通常涉及鉴权、网络、工具 schema、审批策略和外部副作用。

Skill 可以告诉 Agent 什么时候用 Figma、按什么步骤检查设计；MCP server 则负责真的读取或修改 Figma。

## 7、Plugin：可安装的能力包

插件是 Codex 里的安装和分发单位。

一个插件可以包含 Skill、App 集成、MCP server、hook、资源文件、模板和配置。

如果 Skill 是工作流作者格式，那么 Plugin 就是产品化分发格式。

本地试验一个流程时，先写 Skill 更轻。要给团队安装、共享、配置 MCP 或绑定外部应用时，再做成 Plugin。

插件关注的是“怎样把一组能力交付给别人使用”。

## 8、五者分工对照

| 概念 | 本质 | 谁使用 | 解决什么问题 |
| --- | --- | --- | --- |
| API | 远程服务接口 | 产品、脚本、后端 | 调用模型和平台能力 |
| SDK | API 的代码封装 | 开发者代码 | 更方便地调用 API |
| Skill | 工作流说明包 | Agent / Codex | 让 Agent 稳定完成某类任务 |
| MCP | 工具和上下文协议 | Agent 运行环境 | 连接外部系统和资源 |
| Plugin | 安装分发包 | Codex 用户和团队 | 打包、安装、共享一组能力 |

它们可以组合，但不要混成一团。

API 和 SDK 偏开发接入；Skill 偏工作流知识；MCP 偏工具连接；Plugin 偏产品化分发。

## 9、和 Tool 的关系

Tool 是模型可以请求调用的具体能力。

例如“读取文件”“查询天气”“创建 GitHub issue”“搜索文档”“截图浏览器”都可以是 Tool。

API 可以让你声明 tool，SDK 可以帮你写 tool 调用代码，MCP 可以把外部 tool 暴露出来，Skill 可以指导什么时候使用 tool，Plugin 可以把一组 tool 和 skill 打包起来。

所以 Tool 是动作能力，Skill 是使用方法，MCP 是连接协议，Plugin 是分发容器。

## 10、一个完整例子

假设要做一个“自动生成周报”的 Agent。

可以这样拆：

```text
API：
- 调用模型生成总结
- 接收结构化输出

SDK：
- 在 Node.js 或 Python 服务里调用 API
- 处理流式输出和错误

Skill：
- 定义周报收集步骤
- 规定完成、阻塞、下周计划的分类方式
- 约束语气、格式和检查清单

MCP：
- 连接 GitHub issue
- 连接 Linear / Jira
- 连接日历和文档

Plugin：
- 打包周报 Skill
- 附带 MCP server 配置
- 提供模板、示例和安装入口
```

这样拆的好处是：模型能力可以替换，业务代码可以维护，工具连接可以扩展，工作流程可以复用，整套能力可以分发给团队。

## 11、常见误区

### 误区一：SDK 就是 API

不是。

API 是服务接口，SDK 是调用接口的代码库。没有 SDK 也能直接调 API，只是会更麻烦。

### 误区二：Skill 就是 Prompt

不是。

Skill 可能包含 prompt，但它通常还包含触发条件、步骤、约束、脚本、模板、参考资料和验证方式。

### 误区三：MCP 等于插件

不是。

MCP 是协议，插件是打包形式。一个插件可以包含 MCP server，也可以只包含 Skill 或静态资源。

### 误区四：有工具就不需要 Skill

不是。

工具只说明“能做什么”，Skill 说明“什么时候做、按什么顺序做、怎样判断做完”。

### 误区五：能力越多越好

不是。

能力越多，路由成本、上下文成本和误用风险越高。好的系统应该按场景加载最相关的 Skill 和工具。

## 12、一句话总结

API 是入口，SDK 是调用方式，Skill 是工作方法，MCP 是连接协议，Plugin 是分发容器。

把这五层分清楚，Agent 系统就不会变成一锅乱炖：代码负责调用，协议负责连接，Skill 负责流程，插件负责交付。

## 参考资料

- [OpenAI API Documentation](https://developers.openai.com/api/docs/)
- [OpenAI: API libraries](https://developers.openai.com/api/docs/libraries)
- [OpenAI: Agents](https://developers.openai.com/api/docs/guides/agents)
- [OpenAI Codex: Agent Skills](https://developers.openai.com/codex/skills)
- [OpenAI Codex: Model Context Protocol](https://developers.openai.com/codex/mcp)
- [OpenAI Codex: Plugins](https://developers.openai.com/codex/plugins)
- [OpenAI Codex: SDK](https://developers.openai.com/codex/sdk)
- [Model Context Protocol Documentation](https://modelcontextprotocol.io/docs)
