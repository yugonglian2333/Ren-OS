---
title: "Interrupt 与 Resume"
description: "什么是 Interrupt 与 Resume？Agent 任务如何安全暂停、等待、恢复并避免重复副作用？"
pubDate: 2026-07-07
category: "学习笔记"
draft: false
pinned: false
priority: 0
---

# Interrupt 与 Resume

[返回 Agent 开发笔记合集](./0、agent-dev-notes.md)

## 1、定义

Interrupt 是中断或暂停正在执行的 Agent 任务。Resume 是在保留状态的基础上恢复执行。

它们通常依赖 State、Checkpointing 和 Runtime 支持，否则任务一旦暂停就很难安全继续。

简单说：

```text
Interrupt = 暂停在一个可恢复的位置
Resume = 从保存的状态继续，而不是从头再来
```

## 2、为什么它重要

Agent 任务可能因为等待人工审批、网络失败、工具超时、用户修改需求或系统重启而中断。

可靠系统需要知道中断发生在哪里，以及恢复后应该继续哪一步。

Interrupt 与 Resume 让 Agent 更适合长任务和真实业务流程，而不是只适合短对话。

## 3、常见场景

| 场景 | 说明 |
| --- | --- |
| 等待用户确认 | 删除文件、发送邮件、付款前暂停 |
| 等待外部系统 | 第三方 API 异步处理 |
| 人工接管 | Agent 低置信度或风险过高 |
| 超时暂停 | 长任务超过时间预算 |
| 系统重启 | 服务部署或崩溃后恢复 |
| 用户改需求 | 暂停当前计划，重新规划 |

这些场景都要求系统能保存状态，而不是只保存最后一句话。

## 4、恢复时要注意什么

| 问题 | 说明 |
| --- | --- |
| 恢复位置 | 从哪个节点继续 |
| 状态版本 | 保存的 State 是否还能被当前代码理解 |
| 幂等性 | 已执行动作是否会被重复执行 |
| 上下文刷新 | 外部世界是否已经变化 |
| 用户意图 | 用户是否修改了目标 |
| 权限 | 恢复时权限是否仍然有效 |

Resume 不是简单地“继续生成”。它需要 Runtime 判断当前状态是否仍然安全。

## 5、一个 Agent 开发例子

比如 Agent 准备发送一封邮件：

```text
1. 生成邮件草稿
2. 保存 checkpoint
3. 进入 Approval Gate
4. 用户暂时离开，任务 interrupt
5. 用户回来后点击批准
6. Runtime 读取 checkpoint
7. 检查草稿、收件人、权限是否仍有效
8. 调用邮件工具发送
9. 保存发送结果
```

如果用户回来后修改了收件人，系统应该重新检查风险，而不是直接沿用旧审批。

## 6、常见误区

### 误区一：Resume 就是把历史消息再喂给模型

不够。恢复需要结构化 State、Checkpoint、执行位置和幂等判断。

### 误区二：中断只会发生在人工审批时

不是。网络超时、系统重启、任务超预算、工具失败都可能造成中断。

### 误区三：恢复后可以直接重跑上一步

不一定。上一步可能已经产生副作用。必须先检查是否已完成。

### 误区四：用户修改需求后还能无缝继续

不总是。需求变化可能导致原计划失效，需要重新规划或回到更早检查点。

## 7、一句话总结

Interrupt 与 Resume 让 Agent 能安全暂停和继续。它们依赖 State、Checkpoint 和幂等性，是长任务和高风险任务的基础能力。

## 参考资料

- [LangGraph: Persistence](https://langchain-ai.github.io/langgraph/concepts/persistence/)
- [Temporal Documentation](https://docs.temporal.io/)
