---
title: "Runtime 运行时"
description: "什么是 Agent Runtime？它如何承载模型调用、工具调用、状态、权限、中断恢复和观测？"
pubDate: 2026-07-07
category: "学习笔记"
draft: false
pinned: false
priority: 0
---

# Runtime 运行时

[返回 Agent 开发笔记合集](./0、agent-dev-notes.md)

## 1、定义

Runtime 是 Agent 真正运行起来的环境和执行框架。它负责承载模型调用、工具调用、状态管理、权限控制、错误处理和生命周期管理。

Runtime 可以是一个 SDK、一个服务端进程、一个工作流引擎，也可以是产品内部自研的一层执行系统。

Prompt 和工具定义只是静态描述，Runtime 才负责把它们组织成实际执行。

## 2、为什么它重要

Agent 不是一条 prompt，它是一段运行中的任务。运行中会有模型请求、工具调用、状态更新、错误、超时、审批、中断和恢复。

这些都需要 Runtime 来管理。

一个成熟的 Agent Runtime 通常会把模型自由输出和真实系统动作隔离开：模型提出意图，Runtime 校验、调度、执行和记录。

## 3、Runtime 常见能力

| 能力 | 说明 |
| --- | --- |
| Model Client | 封装模型请求、重试、超时、token 统计 |
| Tool Registry | 注册工具、暴露 Schema、执行工具 |
| State Store | 保存任务状态、会话和中间结果 |
| Scheduler | 调度节点、子任务和异步任务 |
| Permission | 控制工具、文件、网络和数据访问 |
| Approval | 支持暂停等待人工确认 |
| Checkpoint | 保存快照，支持中断恢复 |
| Observability | Trace、日志、指标和成本统计 |

Runtime 越成熟，Agent 越容易从 demo 变成产品。

## 4、和 Harness、Orchestrator 的区别

| 概念 | 重点 |
| --- | --- |
| Harness | 约束模型能力的整体工程思想 |
| Runtime | 让 Agent 实际运行的环境 |
| Orchestrator | 运行时协调模型、工具和状态的编排层 |
| Executor | 执行具体动作的组件 |

Runtime 是承载层，Orchestrator 是协调层，Harness 是更大的工程外壳。

在小系统里，Runtime 可能就是一段服务端代码；在大系统里，它可能是一整套任务平台。

## 5、一个 Agent 开发例子

一个 coding agent 的 Runtime 可能负责：

```text
1. 创建隔离 workspace
2. 加载项目指令和用户任务
3. 注册文件读写、终端、测试、Git 工具
4. 控制文件权限和网络权限
5. 运行模型循环
6. 每次工具调用写 Trace
7. 测试失败时允许重试
8. 用户中断时保存状态
9. 恢复后从 checkpoint 继续
```

这已经远远超过“调用一次模型 API”的范围。

## 6、常见误区

### 误区一：Runtime 就是模型 API

不是。模型 API 只是 Runtime 使用的一个能力。Runtime 还要管理工具、状态、权限和生命周期。

### 误区二：本地脚本不需要 Runtime

简单脚本可以没有正式 Runtime，但只要任务需要多步、恢复、权限或审计，就已经在隐式构建 Runtime。

### 误区三：Runtime 可以完全交给模型控制

不应该。模型可以参与决策，但权限、停止条件、状态持久化和审批应该由 Runtime 硬控制。

### 误区四：Runtime 越通用越好

不一定。Runtime 需要服务具体产品和风险模型。过度通用会增加维护成本。

## 7、一句话总结

Runtime 是 Agent 真正运行的执行环境。它把模型、工具、状态、权限、审批、恢复和观测组织成一个可长期工作的系统。

## 参考资料

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [Temporal Documentation](https://docs.temporal.io/)
