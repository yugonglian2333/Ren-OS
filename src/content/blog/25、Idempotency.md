---
title: "Idempotency 幂等性"
description: "什么是 Idempotency？为什么 Agent 重试、恢复和工具调用必须考虑幂等性？"
pubDate: 2026-07-07
category: "学习笔记"
draft: false
pinned: false
priority: 0
---

# Idempotency 幂等性

[返回 Agent 开发笔记合集](./0、agent-dev-notes.md)

## 1、定义

Idempotency 是指同一个操作执行一次和执行多次，最终效果应该一致。中文常叫幂等性。

在 Agent 系统里，幂等性尤其重要，因为模型调用、网络请求、工具执行和工作流节点都可能失败重试。

简单例子：

```text
设置用户名为 Alice：执行多次，最终还是 Alice -> 幂等
给用户余额加 100 元：执行多次，余额会一直增加 -> 不幂等
```

## 2、为什么它重要

如果一个创建订单、发送消息或写入数据库的动作不具备幂等性，重复执行可能造成重复订单、重复通知或数据污染。

Agent 的执行链路越长，越需要为关键动作设计幂等键、状态检查和去重逻辑。

尤其是 Checkpointing、Interrupt / Resume、Retry 这些机制，都会让同一步骤存在“执行不止一次”的可能。

## 3、常见做法

| 做法 | 说明 |
| --- | --- |
| Idempotency Key | 为一次逻辑操作生成唯一键 |
| Operation ID | 每个工具调用携带唯一操作 ID |
| Upsert | 存在则更新，不存在才创建 |
| 状态检查 | 执行前检查目标是否已完成 |
| 唯一约束 | 数据库层防止重复记录 |
| 去重表 | 记录已经执行过的外部动作 |
| 幂等返回 | 重复请求返回同一个结果 |

幂等性最好由系统保障，而不是靠模型记住“不要重复执行”。

## 4、和 Retry、Checkpoint 的关系

| 概念 | 重点 |
| --- | --- |
| Retry | 失败后再次尝试 |
| Checkpoint | 保存状态，方便恢复 |
| Idempotency | 确保重复执行不会造成重复副作用 |
| Transaction | 把多个操作作为一个原子单元处理 |

没有幂等性，Retry 和 Resume 都可能放大副作用。

比如网络超时后，系统不知道消息是否已经发出。再次发送前，必须根据 operationId 或外部状态判断是否已成功。

## 5、一个 Agent 开发例子

假设 Agent 要创建一个 GitHub issue：

```text
operationId: create-issue:user-login-bug:20260708

执行前：
- 搜索是否已有相同 operationId 的记录
- 搜索是否已有相似 issue

执行时：
- 调用 GitHub API 创建 issue
- 保存 operationId -> issue URL

重复执行时：
- 不再创建新 issue
- 直接返回已有 issue URL
```

这样即使 Agent 重试，也不会创建一堆重复 issue。

## 6、常见误区

### 误区一：只读操作才需要幂等

恰好相反。有副作用的写操作最需要幂等设计。

### 误区二：失败了才会重复执行

不一定。用户刷新、系统恢复、任务重放、网络超时、队列重复投递都会导致重复执行。

### 误区三：让模型检查一下就行

不够。幂等性需要数据库约束、唯一键、状态机和工具层逻辑保证。

### 误区四：所有操作都能轻松做成幂等

不是。外部不可撤销动作很难处理，比如真实付款、外发邮件。它们更需要审批、去重和审计。

## 7、一句话总结

幂等性让 Agent 的重试、恢复和重复调用不会制造重复副作用。它是可靠 Agent 执行层的基础安全网。

## 参考资料

- [Stripe: Idempotent requests](https://docs.stripe.com/api/idempotent_requests)
- [AWS: Making retries safe with idempotent APIs](https://aws.amazon.com/cn/builders-library/making-retries-safe-with-idempotent-APIs/)
