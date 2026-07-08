---
title: "Orchestrator 编排器"
description: "什么是 Orchestrator？它如何协调模型、工具、状态、子流程和错误处理来完成 Agent 任务？"
pubDate: 2026-07-07
category: "学习笔记"
draft: false
pinned: false
priority: 0
---

# Orchestrator 编排器

[返回 Agent 开发笔记合集](./0、agent-dev-notes.md)

## 1、定义

Orchestrator 是 Agent 系统中的编排层，负责协调模型调用、工具调用、状态流转、错误处理和子流程执行。

它不一定负责具体业务逻辑，而是负责让各个组件按正确顺序协作。

如果把 Agent 系统比作乐队，Orchestrator 就是指挥：它不一定亲自演奏每个乐器，但决定谁什么时候进场、结果交给谁、失败时怎么继续。

## 2、为什么它重要

当任务只有一次模型调用时，不需要复杂编排。

但当任务涉及多个步骤、多个工具、多个条件分支、人工审批和失败恢复时，就需要 Orchestrator 管住流程。

没有编排层，系统容易变成一堆散落的工具调用。每个工具都能做事，但整体任务不可控、不可恢复、不可审计。

## 3、常见职责

| 职责 | 说明 |
| --- | --- |
| 调度节点 | 决定下一步执行 Planner、Executor、工具还是人工节点 |
| 管理状态 | 读写 State，确保每步知道当前进展 |
| 组织上下文 | 把合适材料传给模型或工具 |
| 控制循环 | 决定继续、重试、停止或升级 |
| 处理失败 | 超时、异常、权限不足、输出不合法时走 fallback |
| 记录 Trace | 保存执行路径和关键决策 |
| 协调多 Agent | 让不同角色分工协作 |

Orchestrator 的质量决定了 Agent 是否像一个系统，而不是一串临时脚本。

## 4、和 Router、Workflow 的区别

| 概念 | 重点 |
| --- | --- |
| Router | 把请求送到哪条路径 |
| Workflow | 预先设计的步骤和分支 |
| Orchestrator | 运行时协调这些步骤、工具和状态 |
| Runtime | 承载整个执行过程的环境 |

Router 更像入口分诊，Workflow 更像流程图，Orchestrator 更像运行时指挥。

在简单系统里，这些角色可能写在同一段代码里；复杂系统里最好拆清楚。

## 5、一个 Agent 开发例子

一个“自动修复 CI”系统里，Orchestrator 可能这样工作：

```text
1. 接收 CI 失败事件
2. 调用 Router 判断进入 coding-fix workflow
3. 调用 Planner 生成修复计划
4. 调用 Executor 修改代码
5. 调用测试工具验证
6. 如果失败，更新 State 并重试
7. 如果连续失败，升级给人
8. 如果成功，写总结并提交 PR
```

这里每个步骤可能由不同组件完成，但 Orchestrator 负责整体流转。

## 6、常见误区

### 误区一：Orchestrator 就是 Agent

不完全是。Agent 是面向目标的整体系统，Orchestrator 是其中的编排层。

### 误区二：让 LLM 自己决定所有编排就行

风险很高。LLM 可以参与决策，但停止条件、权限、重试和错误处理应该由系统硬编码或严格约束。

### 误区三：Orchestrator 只适合多 Agent

不是。单 Agent 只要有多步骤、多工具和状态，也需要编排。

### 误区四：编排器越通用越好

过度通用会变复杂。好的 Orchestrator 应该围绕业务任务设计清楚的节点和边界。

## 7、一句话总结

Orchestrator 是 Agent 系统的运行指挥层。它把模型、工具、状态、Workflow 和人工节点协调成一条可执行、可恢复、可审计的任务路径。

## 参考资料

- [Anthropic: Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [Temporal Documentation](https://docs.temporal.io/)
