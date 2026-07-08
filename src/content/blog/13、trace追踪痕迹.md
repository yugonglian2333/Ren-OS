---
title: "Trace 追踪痕迹"
description: "什么是 Trace？它如何记录 Agent 的模型调用、工具调用、状态变化和最终结果？"
pubDate: 2026-07-07
category: "学习笔记"
draft: false
pinned: false
priority: 0
---

# Trace 追踪痕迹

[返回 Agent 开发笔记合集](./0、agent-dev-notes.md)

## 1、定义

Trace 是对 Agent 执行过程的结构化记录。它通常包括输入、模型调用、工具调用、工具结果、状态变化、错误、重试和最终输出。

Trace 的重点不是普通日志里“写了什么”，而是把一次任务从开始到结束的路径串起来。

如果 Log 是零散日记，Trace 更像一条完整时间线。

## 2、为什么它重要

Agent 系统出错时，很难凭最终回答判断问题来自哪里。可能是 Prompt 不清楚、上下文缺失、检索错了、工具返回异常、权限不足，也可能是模型判断错了。

Trace 可以帮助定位问题、复盘行为、评估质量和做审计。

对于会修改数据或执行外部动作的 Agent，Trace 也是追责、回滚和合规的重要基础。

## 3、Trace 里通常记录什么

| 内容 | 例子 |
| --- | --- |
| Request | 用户请求、任务 ID、会话 ID |
| Model Call | 模型名、输入摘要、输出、token、耗时 |
| Tool Call | 工具名、参数、返回值、错误 |
| Routing | 为什么选择某个 Skill、模型或 Workflow |
| State Change | 当前阶段、状态字段变化 |
| Approval | 谁批准了什么动作 |
| Retry | 失败原因、重试次数、下一步策略 |
| Final Output | 最终交付结果和验证信息 |

Trace 不一定要保存完整敏感内容。很多时候保存摘要、哈希、引用和脱敏结果更合适。

## 4、Trace、Log、Metric 的区别

| 概念 | 重点 |
| --- | --- |
| Trace | 一次任务从开始到结束的链路 |
| Log | 某个时间点发生的事件记录 |
| Metric | 可聚合的指标，比如耗时、成功率、token 消耗 |
| Audit Log | 面向安全和合规的操作记录 |

它们可以互相配合。Trace 用来串起链路，Log 用来记录细节，Metric 用来观察整体趋势。

## 5、一个 Agent 开发例子

一个代码修复 Agent 的 Trace 可以长这样：

```text
Trace ID: fix-ci-20260708-001
Input: 修复 PR #42 的 CI 失败
Route: coding-fix workflow
Step 1: 读取 CI 日志 -> 发现 typecheck 失败
Step 2: 读取相关文件 -> 找到类型不匹配
Step 3: 修改 src/user.ts
Step 4: 运行 pnpm typecheck -> 通过
Step 5: 运行相关测试 -> 通过
Final: 总结修改和验证命令
```

以后如果用户问“为什么改这个文件”，Trace 就能还原当时的依据。

## 6、常见误区

### 误区一：有日志就等于有 Trace

不一定。日志可能很多但串不起来。Trace 必须能把同一次任务里的事件按链路关联起来。

### 误区二：Trace 越详细越好

不是。Trace 需要平衡可调试性、成本和隐私。敏感数据应该脱敏或只保存引用。

### 误区三：Trace 只给开发调试用

不只是。Trace 还可以用于用户解释、质量评估、审计、回放和训练数据筛选。

### 误区四：只记录失败就够了

成功路径也值得记录。成功 Trace 可以帮助建立评测样本和最佳实践。

## 7、一句话总结

Trace 是 Agent 执行过程的结构化时间线。它让系统知道一次任务为什么这样走、调用了什么、哪里失败、最终如何完成。

## 参考资料

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [LangSmith Documentation](https://docs.smith.langchain.com/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
