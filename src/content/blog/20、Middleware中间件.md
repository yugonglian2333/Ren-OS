---
title: "Middleware 中间件"
description: "什么是 Middleware？它如何在 Agent 请求、模型调用、工具调用和输出之间插入通用处理逻辑？"
pubDate: 2026-07-07
category: "学习笔记"
draft: false
pinned: false
priority: 0
---

# Middleware 中间件

[返回 Agent 开发笔记合集](./0、agent-dev-notes.md)

## 1、定义

Middleware 是插在流程中间的通用处理层。它可以在请求进入、模型调用前后、工具调用前后、结果返回前执行额外逻辑。

中间件的价值是把横切逻辑从业务流程里抽出来，比如日志、鉴权、限流、审计、脱敏、重试和格式校验。

在 Agent 系统里，Middleware 就像流水线上的检查站。

## 2、为什么它重要

Agent 系统里有很多通用约束不能只靠 Prompt。比如工具调用前检查权限，模型输出后做 Schema 校验，返回用户前做敏感信息过滤。

如果这些逻辑散落在每个工具和每个 Workflow 里，系统会很难维护。

Middleware 可以统一处理安全、观测、错误、成本和策略问题。

## 3、常见用途

| 用途 | 例子 |
| --- | --- |
| 鉴权 | 调用工具前检查用户权限 |
| 脱敏 | 把密钥、手机号、邮箱从上下文或日志中隐藏 |
| 日志 / Trace | 记录模型调用、工具调用和耗时 |
| 限流 | 控制用户、模型、工具调用频率 |
| 重试 | 对可恢复错误自动重试 |
| 超时 | 防止工具或模型调用卡死 |
| Schema 校验 | 检查模型输出结构是否合格 |
| 成本统计 | 统计 token、费用和资源消耗 |

Middleware 的目标是让通用规则只写一次，到处生效。

## 4、和 Guardrails、Hook 的区别

| 概念 | 重点 |
| --- | --- |
| Middleware | 流程中间插入的通用处理层 |
| Guardrails | 安全、合规、格式和策略约束 |
| Hook | 某个生命周期点的回调机制 |
| Policy | 权限和策略规则 |

Middleware 可以承载 Guardrails，也可以通过 Hook 接入 Runtime。

比如 `beforeToolCall` 是 Hook，里面做权限检查的逻辑就是一种 Middleware。

## 5、一个 Agent 开发例子

一个工具调用 Middleware 可以这样设计：

```text
beforeToolCall：
- 检查工具是否在白名单
- 校验参数 Schema
- 检查用户权限
- 判断是否需要 Approval Gate
- 记录 trace 开始时间

afterToolCall：
- 记录返回结果摘要
- 脱敏敏感字段
- 统计耗时和 token
- 把错误转换成统一格式
```

这样每个工具不用重复写同样的安全和观测逻辑。

## 6、常见误区

### 误区一：Middleware 只是后端框架里的概念

不是。Agent Runtime、工具调用链、模型调用链和 Workflow 节点都可以有 Middleware。

### 误区二：所有逻辑都应该塞进 Middleware

不应该。Middleware 适合横切逻辑，不适合承载核心业务流程。

### 误区三：Middleware 顺序不重要

很重要。先脱敏再记录日志，和先记录日志再脱敏，安全结果完全不同。

### 误区四：Middleware 不会产生副作用

会。重试、缓存、审计、审批都可能改变系统行为，所以要设计清楚顺序和幂等性。

## 7、一句话总结

Middleware 是 Agent 流程里的通用检查层。它把权限、脱敏、日志、重试、校验和成本统计从业务逻辑中抽出来统一处理。

## 参考资料

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [LangChain Middleware concepts](https://docs.langchain.com/)
