---
title: "A2A、MCP 与 Plugin 插件"
description: "A2A、MCP 和 Plugin 分别连接什么？它们如何支持 Agent 协作、工具接入和能力分发？"
pubDate: 2026-07-07
category: "学习笔记"
draft: false
pinned: false
priority: 0
---

# A2A、MCP 与 Plugin 插件

[返回 Agent 开发笔记合集](./0、agent-dev-notes.md)

## 1、定义

A2A 是 Agent-to-Agent 的缩写，关注 Agent 与 Agent 之间如何通信、委托任务、交换结果和协作。

MCP 是 Model Context Protocol，关注模型或 Agent 如何连接外部工具、资源和上下文。

Plugin 插件关注如何把一组能力打包、安装、配置和复用。

简单说：

```text
A2A 连接 Agent
MCP 连接工具和资源
Plugin 打包能力集合
```

## 2、为什么它重要

随着 Agent 能力变复杂，一个 Agent 很难独自承担所有角色。系统可能需要 researcher、planner、coder、reviewer、designer 等多个角色协作。

同时，Agent 还需要访问外部能力：GitHub、数据库、浏览器、文件系统、设计工具、办公软件等。

A2A、MCP 和 Plugin 分别解决协作、连接和分发问题。

## 3、三者的分工

| 概念 | 连接对象 | 解决问题 |
| --- | --- | --- |
| A2A | Agent 与 Agent | 委托任务、交换能力、协作完成目标 |
| MCP | Agent 与工具/资源 | 统一暴露外部工具和上下文 |
| Plugin | 用户/产品与能力包 | 安装、配置、复用一组能力 |

它们不是互斥关系。一个插件里可以包含 MCP server，一个多 Agent 系统可以通过 A2A 协调多个使用 MCP 工具的 Agent。

## 4、A2A 中需要注意什么

| 问题 | 说明 |
| --- | --- |
| 能力描述 | 每个 Agent 能做什么、不能做什么 |
| 身份 | 谁在请求、谁在执行 |
| 权限 | 被委托 Agent 能访问哪些工具和数据 |
| 上下文传递 | 给对方哪些信息，避免泄露或噪声 |
| 结果格式 | 返回自然语言、结构化结果还是工件 |
| 失败处理 | 拒绝、超时、部分完成时怎么办 |

A2A 的关键不是“多几个 Agent 聊天”，而是让协作可控、可验证。

## 5、一个 Agent 开发例子

一个代码任务可以这样协作：

```text
Main Agent：
- 接收用户目标
- 选择需要哪些子 Agent

Research Agent：
- 阅读文档和相关代码
- 输出上下文摘要

Coder Agent：
- 根据摘要修改代码
- 运行测试

Reviewer Agent：
- 独立检查 diff
- 找 bug、风险和测试缺口

Main Agent：
- 汇总结果
- 决定是否提交或升级给人
```

其中 GitHub、文件系统、测试命令可能通过 MCP 或本地工具暴露；整套能力可以打包成插件。

## 6、常见误区

### 误区一：A2A 就是让多个模型互相聊天

不是。真正有用的 A2A 需要角色、权限、上下文、任务边界和结果格式。

### 误区二：MCP 会替代插件

不会。MCP 是协议，插件是打包和分发方式。两者可以配合。

### 误区三：多 Agent 一定提高质量

不一定。多 Agent 会增加延迟、成本和协调复杂度。只有当分工带来独立检查或专业能力时才值得。

### 误区四：Agent 之间可以共享全部上下文

不应该。上下文要按任务最小化传递，避免泄露敏感信息和传播错误假设。

## 7、一句话总结

A2A 负责 Agent 协作，MCP 负责连接工具和资源，Plugin 负责打包能力。三者合起来，让 Agent 系统从单体助手走向可扩展生态。

## 参考资料

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic: Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
