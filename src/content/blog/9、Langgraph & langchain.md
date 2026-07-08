---
title: "LangGraph 与 LangChain"
description: "LangChain 和 LangGraph 分别是什么？它们在 LLM 应用、Agent 编排和状态管理中如何分工？"
pubDate: 2026-07-07
category: "学习笔记"
draft: false
pinned: false
priority: 0
---

# LangGraph 与 LangChain

[返回 Agent 开发笔记合集](./0、agent-dev-notes.md)

## 1、定义

LangChain 是一个面向 LLM 应用开发的框架，提供模型调用、Prompt、工具、检索、输出解析、链式流程等抽象。

LangGraph 是 LangChain 生态中更偏 Agent 编排和状态机的框架。它适合把多步骤、多节点、有状态、可循环的 Agent 流程组织成图。

简单说：

```text
LangChain 更像 LLM 应用工具箱
LangGraph 更像 Agent 状态图和流程编排器
```

## 2、为什么它重要

当 LLM 应用只是“一问一答”时，直接调用模型 API 就够了。

但当任务变成多步骤、多工具、多角色、多轮状态时，手写流程会越来越难维护。你需要清楚地表达节点、边、状态、循环、分支、暂停和恢复。

LangGraph 的价值就在这里：它用图结构描述 Agent 工作流，让复杂流程更容易测试、恢复和观察。

## 3、核心概念

| 概念 | 说明 |
| --- | --- |
| Chain | 一段顺序执行的模型或工具流程 |
| Agent | 能根据上下文选择动作的执行体 |
| Graph | 由节点和边组成的流程结构 |
| Node | 一个执行单元，比如模型调用、工具调用、人工审批 |
| Edge | 节点之间的流转规则 |
| State | 图运行过程中共享和更新的状态 |
| Checkpointer | 保存状态快照，支持中断和恢复 |

LangChain 更常见于组件拼装，LangGraph 更常见于有状态 Agent 编排。

## 4、和 Workflow、Orchestrator 的关系

| 概念 | 重点 |
| --- | --- |
| Workflow | 预先设计好的流程路径 |
| Orchestrator | 负责协调模型、工具、状态和子流程 |
| LangGraph | 一种实现 Workflow / Orchestrator 的图框架 |
| LangChain | 更通用的 LLM 应用组件集合 |

LangGraph 不是唯一选择。你也可以用手写代码、Temporal、自研 Runtime 或其他工作流引擎实现类似编排。

是否需要引入框架，取决于流程复杂度、团队熟悉度和未来维护成本。

## 5、一个 Agent 开发例子

一个“代码修复 Agent”可以设计成图：

```text
入口节点：读取任务
-> 分析节点：读取日志和相关文件
-> 计划节点：生成修复计划
-> 执行节点：修改代码
-> 验证节点：运行测试
-> 分支：
   - 测试通过 -> 总结并结束
   - 测试失败 -> 回到分析节点
   - 风险过高 -> 人工审批节点
```

这个结构比一长串 if/else 更容易看出任务如何流转，也更容易加检查点。

## 6、常见误区

### 误区一：用了 LangChain 就等于有 Agent

不是。LangChain 提供组件，但 Agent 还需要目标、工具、状态、权限、验证和停止条件。

### 误区二：所有 LLM 应用都需要 LangGraph

不需要。简单问答、单次分类、格式转换，直接调用模型 API 可能更清晰。

### 误区三：Graph 越复杂越高级

不是。图应该表达真实流程复杂度。过度拆节点会增加理解和调试成本。

### 误区四：框架可以替代系统设计

不能。框架帮你组织流程，但不会自动决定安全边界、业务规则和验收标准。

## 7、一句话总结

LangChain 是 LLM 应用工具箱，LangGraph 是有状态 Agent 流程图。复杂 Agent 需要的不只是模型调用，而是清晰的状态、节点、分支和恢复机制。

## 参考资料

- [LangChain Documentation](https://python.langchain.com/docs/introduction/)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [Anthropic: Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
