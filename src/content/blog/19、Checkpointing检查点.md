---
title: "Checkpointing 检查点"
description: "什么是 Checkpointing？它如何保存 Agent 中间状态，并支持失败恢复、人工审批和长任务续跑？"
pubDate: 2026-07-07
category: "学习笔记"
draft: false
pinned: false
priority: 0
---

# Checkpointing 检查点

[返回 Agent 开发笔记合集](./0、agent-dev-notes.md)

## 1、定义

Checkpointing 是在任务执行过程中保存关键状态快照的机制。它让 Agent 可以在失败、中断或人工审批后，从某个已知状态继续执行。

检查点通常包含 State、上下文摘要、工具结果、执行位置和必要的元数据。

如果 State 是任务当前状态，Checkpoint 就是某个时间点的状态存档。

## 2、为什么它重要

长任务、多轮任务和高风险任务都需要检查点。没有检查点，系统一旦失败就只能重头开始，或者无法解释之前发生了什么。

在 Human-in-the-loop 场景里，检查点也能让任务暂停等待人工确认，确认后再继续。

Checkpointing 让 Agent 更像可靠任务系统，而不是一次性脚本。

## 3、检查点通常保存什么

| 内容 | 例子 |
| --- | --- |
| State | 当前阶段、任务目标、重试次数 |
| Messages | 对话历史或摘要 |
| Tool Results | 搜索结果、测试输出、API 返回 |
| Artifacts | 草稿、diff、生成文件路径 |
| Position | 当前执行到哪个节点 |
| Approvals | 等待确认或已确认的动作 |
| Metadata | 时间、版本、用户、traceId |

保存内容要足够恢复任务，但也要注意隐私、体积和过期策略。

## 4、和 Snapshot、Memory 的区别

| 概念 | 重点 |
| --- | --- |
| Checkpoint | 为恢复执行保存的状态点 |
| Snapshot | 某个对象或系统状态的完整快照 |
| Memory | 未来任务可复用的长期信息 |
| Trace | 执行路径的时间线 |

Checkpoint 更偏“从这里继续跑”，Trace 更偏“发生过什么”，Memory 更偏“以后记住什么”。

## 5、一个 Agent 开发例子

一个代码修复 Agent 可以在这些节点保存检查点：

```text
1. 读取任务后：保存用户目标和初始上下文
2. 制定计划后：保存计划和风险点
3. 修改代码前：保存当前 git diff
4. 跑测试后：保存测试结果
5. 等待审批前：保存待确认动作
6. 完成后：保存最终总结和验证命令
```

如果测试阶段失败，Agent 可以从“修改代码后”的检查点继续分析，而不用重新读完整任务。

## 6、常见误区

### 误区一：只要有日志就能恢复

不一定。日志能说明发生过什么，但不一定包含恢复执行需要的结构化状态。

### 误区二：每一步都完整保存最好

不是。检查点需要平衡可靠性和成本。关键节点保存，普通中间过程可以只记 Trace。

### 误区三：恢复就是从上一步重跑

恢复要考虑幂等性。某些动作已经产生副作用，不能简单重复执行。

### 误区四：检查点只用于失败恢复

不只是。它还支持人工审批、暂停续跑、调试回放和长任务分段执行。

## 7、一句话总结

Checkpointing 是 Agent 的存档点。它让任务失败、暂停或等待审批后，可以从清楚的状态继续，而不是从头再来。

## 参考资料

- [LangGraph: Persistence](https://langchain-ai.github.io/langgraph/concepts/persistence/)
- [Temporal: Workflow state and replay](https://docs.temporal.io/workflows)
