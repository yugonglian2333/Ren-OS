---
title: "Workflow"
description: "什么是 Workflow？它如何用确定性步骤组织 Agent 任务，并和 Agent Loop、LangGraph 配合？"
pubDate: 2026-07-07
category: "学习笔记"
draft: false
pinned: false
priority: 0
---

# Workflow

[返回 Agent 开发笔记合集](./0、agent-dev-notes.md)

## 1、定义

Workflow 是一组预先设计好的步骤、分支和规则，用来稳定地完成某类任务。它强调流程可控，而不是让模型完全自由决定下一步。

在 LLM 应用里，Workflow 通常把模型调用、工具调用、人工确认、数据校验和结果写入组织成固定路径。

它更像业务流程图，而不是一次自由对话。

## 2、为什么它重要

很多真实业务不适合完全交给 Agent 自由探索。比如创建订单、审核内容、生成合同、处理报销、发送邮件，这些任务都有明确步骤、权限和验收标准。

Workflow 可以把高风险任务拆成可控节点，让模型只在合适的节点发挥能力。

一个好的 Workflow 会明确：

```text
每一步做什么 -> 输入输出是什么 -> 失败怎么办 -> 谁来确认 -> 什么时候结束
```

## 3、Workflow 的常见组成

| 组成 | 作用 |
| --- | --- |
| Trigger | 流程何时启动 |
| Step | 每个具体步骤 |
| Input / Output | 每步需要什么、产出什么 |
| Condition | 分支条件 |
| Tool Call | 调用外部工具或系统 |
| Approval | 高风险节点等待人工确认 |
| Validation | 校验输入、输出和业务规则 |
| Retry / Fallback | 失败后的重试或备用路径 |
| End State | 成功、失败、取消或升级 |

Workflow 越靠近真实业务，越应该明确状态和异常路径。

## 4、和 Agent Loop 的区别

| 概念 | 重点 |
| --- | --- |
| Workflow | 预先设计好的流程路径 |
| Agent Loop | Agent 根据反馈持续思考和行动 |
| ReAct Loop | 推理、行动、观察的内循环 |
| Loop Engineering | 设计可重复、可验证、可停止的工作循环 |

Workflow 更确定，Agent Loop 更开放。

真实系统常常把二者混合：外层是固定 Workflow，某些节点内部允许 Agent 用 ReAct Loop 自主完成任务。

## 5、一个 Agent 开发例子

比如“生成并发送周报”可以设计成：

```text
1. 读取本周 issue、PR、日历和笔记
2. 用模型归类完成事项、阻塞事项和下周计划
3. 生成周报草稿
4. 让用户预览和编辑
5. 用户确认后发送邮件
6. 记录发送结果和周报归档地址
```

其中第 2、3 步适合模型发挥，第 5 步必须经过 Approval Gate。

## 6、常见误区

### 误区一：Workflow 会限制 Agent 智能

Workflow 限制的是风险和混乱，不是能力。它让 Agent 在确定边界内做更可靠的事情。

### 误区二：有 Workflow 就不需要 Agent

不一定。Workflow 可以负责流程，Agent 可以负责理解、生成、检索、判断和异常处理。

### 误区三：Workflow 一定很复杂

简单流程也可以是 Workflow。只要有固定步骤、输入输出和结束条件，就已经有 Workflow 的雏形。

### 误区四：流程写完就不用验证

不对。Workflow 的每个节点都应该有校验和可观测性，尤其是写入、发送、发布这类副作用节点。

## 7、一句话总结

Workflow 是把 Agent 能力放进确定性业务流程里的方法。它让模型在该发挥的地方发挥，让系统在该控制的地方控制。

## 参考资料

- [Anthropic: Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [Temporal: Workflow basics](https://docs.temporal.io/workflows)
