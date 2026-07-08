---
title: "ReAct Loop 循环"
description: "什么是 ReAct Loop？它如何让模型在推理、行动和观察之间循环完成多步任务？"
pubDate: 2026-07-07
category: "学习笔记"
draft: false
pinned: false
priority: 0
---

# ReAct Loop 循环

[返回 Agent 开发笔记合集](./0、agent-dev-notes.md)

## 1、定义

ReAct 是 Reasoning and Acting 的缩写，指模型在“推理”和“行动”之间循环：先根据当前状态分析下一步，再选择动作，拿到结果后继续判断。

在 Agent 系统里，这种循环通常表现为：模型读上下文，决定是否调用工具，系统执行工具，把观察结果放回上下文，模型再继续生成。

一个简化结构是：

```text
Thought -> Action -> Observation -> Thought -> Action -> Observation -> ...
```

也就是边想、边做、边看反馈。

## 2、为什么它重要

单次回答适合简单问题，但很多任务需要多步反馈：搜索资料、调试代码、分析日志、生成计划、调用工具、检查结果。

ReAct Loop 让 Agent 能根据工具返回结果调整下一步，而不是一开始就把所有答案猜完。

它也是很多 coding agent 的基础模式。比如修 bug 时，Agent 会先读错误，再查代码，再修改，再跑测试，再根据新错误继续修。

## 3、一个典型流程

```text
1. 观察当前任务和上下文
2. 推理下一步应该做什么
3. 选择工具或生成动作
4. 系统执行动作
5. 读取 observation
6. 判断是否完成
7. 未完成则继续循环
```

在真实系统里，Thought 不一定会暴露给用户。系统更关心的是 action、observation、状态变化和最终结果。

## 4、和 Chain-of-Thought 的区别

| 概念 | 重点 |
| --- | --- |
| Chain-of-Thought | 模型内部或文本中的逐步推理 |
| ReAct | 推理和外部动作交替进行 |
| Tool Calling | 模型请求调用工具的机制 |
| Agent Loop | 由 Runtime 控制的完整执行循环 |

Chain-of-Thought 更偏“怎么想”，ReAct 更偏“想完以后怎么行动，并根据行动结果继续想”。

ReAct 不等于把思考过程全部展示出来。工程上更重要的是让每一步动作可执行、可验证、可停止。

## 5、一个 Agent 开发例子

修复测试失败时，ReAct 可能长这样：

```text
Observation：测试 user-profile.test.ts 失败，提示 expected name to equal "Alice"。
Action：读取测试文件和相关实现。
Observation：实现里把 displayName 回退成 email。
Action：修改 fallback 逻辑。
Observation：重新跑测试，当前测试通过，但 lint 报类型错误。
Action：修复类型错误。
Observation：测试和 lint 都通过。
Final：总结修改和验证结果。
```

这个过程不是一次性猜答案，而是根据每次反馈逐步逼近正确结果。

## 6、常见误区

### 误区一：ReAct 可以无限循环直到成功

不能。必须有最大步数、超时、成本预算和失败升级策略。否则会无限调用工具或反复修同一个错误。

### 误区二：Observation 只要给自然语言就够了

不一定。工具返回最好尽量结构化，比如退出码、错误类型、文件路径、行号和关键日志。

### 误区三：ReAct 本身能保证正确

不能。ReAct 只是执行模式，正确性仍然依赖工具质量、上下文、验证器、权限和停止条件。

### 误区四：所有任务都需要 ReAct

简单分类、固定格式转换、短文本改写不一定需要复杂循环。循环适合需要外部反馈的多步任务。

## 7、一句话总结

ReAct Loop 让 Agent 在推理、行动和观察之间循环前进。它解决的是“下一步怎么根据反馈行动”，不是整个系统如何触发、验证和治理。

## 参考资料

- [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629)
- [Anthropic: Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
