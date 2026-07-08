---
title: "State 状态"
description: "什么是 State？它如何记录 Agent 当前任务进展、工具结果、错误、审批和下一步动作？"
pubDate: 2026-07-07
category: "学习笔记"
draft: false
pinned: false
priority: 0
---

# State 状态

[返回 Agent 开发笔记合集](./0、agent-dev-notes.md)

## 1、定义

State 是 Agent 在执行过程中保存的当前任务信息。它可以包括用户目标、当前步骤、历史消息、工具结果、错误、待确认动作和最终输出。

State 不是简单的聊天记录，而是系统继续执行任务所需的结构化上下文。

如果 Context 是模型本轮能看到什么，State 就是系统知道任务现在走到哪里。

## 2、为什么它重要

有状态的 Agent 才能处理多步骤任务。没有 State，系统很难知道上一轮做到了哪里、哪些工具已经调用、哪些结果已经确认。

State 设计越清晰，Agent 越容易测试、恢复和调试。

长任务、多人协作、多 Agent 编排、人工审批、中断恢复，都离不开 State。

## 3、State 常见字段

| 字段 | 例子 |
| --- | --- |
| goal | 修复当前 PR 的 CI 失败 |
| phase | analyzing、editing、verifying、waiting_approval |
| messages | 用户消息、模型消息、摘要 |
| tool_results | 测试输出、搜索结果、API 返回值 |
| artifacts | 生成的文件、草稿、报告、diff |
| approvals | 等待确认或已确认的动作 |
| errors | 最近错误、失败原因、重试次数 |
| final_result | 最终输出、验证结果、剩余风险 |

State 最好结构化保存，而不是只存在自然语言对话里。

## 4、State 与 Context 的区别

| 概念 | 重点 |
| --- | --- |
| State | 系统保存的任务状态 |
| Context | 本轮传给模型看的信息 |
| Memory | 长期可复用的信息 |
| Checkpoint | 某一时刻的 State 快照 |

State 不一定全部进入 Context。Runtime 可以从 State 中选择当前模型需要看到的部分。

比如 State 里保存了完整日志，但 Context 里只放最相关的错误摘要。

## 5、一个 Agent 开发例子

一个“生成报告”的 State 可以长这样：

```json
{
  "goal": "生成 7 月项目进展报告",
  "phase": "drafting",
  "sources": ["github", "calendar", "notes"],
  "collectedItems": 42,
  "draftPath": "output/july-report.md",
  "waitingApproval": false,
  "retryCount": 1,
  "lastError": null
}
```

有了这个状态，任务暂停后可以继续，失败后可以定位，用户也能知道当前进度。

## 6、常见误区

### 误区一：State 就是聊天历史

不是。聊天历史只是 State 的一部分。State 应该包含任务阶段、工具结果、错误和业务对象。

### 误区二：State 越自由越灵活

自由文本状态短期方便，长期难验证、难恢复。关键状态应该结构化。

### 误区三：State 全部给模型看

不需要。模型只应该看到当前任务相关的状态片段。

### 误区四：State 不需要版本管理

复杂系统需要考虑状态版本。Schema 变化后，旧任务如何恢复，是很现实的问题。

## 7、一句话总结

State 是 Agent 的任务进度表。它让系统知道已经做了什么、现在在哪里、下一步该怎么继续。

## 参考资料

- [LangGraph: Low-level concepts](https://langchain-ai.github.io/langgraph/concepts/low_level/)
- [LangGraph: Persistence](https://langchain-ai.github.io/langgraph/concepts/persistence/)
