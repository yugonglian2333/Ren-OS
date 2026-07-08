---
title: "Harness 驾驭工程"
description: "什么是 Harness？它如何把 LLM 的自由生成约束成可执行、可验证、可审计的 Agent 行为？"
pubDate: 2026-07-07
category: "学习笔记"
draft: false
pinned: false
priority: 0
---

# Harness 驾驭工程

[返回 Agent 开发笔记合集](./0、agent-dev-notes.md)

## 1、定义

Harness 可以理解为套在 LLM 外面的工程控制系统。它不是某一个具体框架，而是一组让模型能力可控、可验证、可执行的设计思想和代码结构。

如果说 LLM 是“会思考的大脑”，Harness 就是让这个大脑安全工作的操作系统。它负责上下文组织、工具编排、状态管理、权限控制、结果校验和异常处理。

也可以用一个公式理解：

```text
Agent = LLM + Harness
```

LLM 负责提出可能性，Harness 负责把可能性放进工程约束里。

## 2、为什么它重要

模型本身不天然保证事实正确、动作安全或符合业务规则。它可能误解任务、编造信息、选择错误工具，甚至生成危险动作。

Harness 的作用不是让模型变笨，而是让模型在可控边界内发挥能力。

一个好的 Harness 会让模型负责“提出意图”，让系统负责“检查、执行和记录”。

> LLM 负责生成可能性，Harness 负责约束、验证、编排和落地。

## 3、Harness 常见组成

| 组成 | 作用 |
| --- | --- |
| Prompt / Instructions | 定义任务、角色、规则和输出格式 |
| Context 管理 | 决定模型本轮能看到什么 |
| Tool Calling | 把模型意图连接到真实工具 |
| Schema 校验 | 确认模型输出可解析、可执行 |
| Permission 权限 | 限制工具和数据访问范围 |
| Sandbox 沙盒 | 隔离代码、命令和文件副作用 |
| Approval Gate | 高风险动作前等待人工确认 |
| State / Memory | 保存任务进度和长期信息 |
| Trace / Logs | 记录执行过程，方便调试和审计 |

这些部件共同构成 Agent 的工程外壳。

## 4、和 Runtime、Workflow 的区别

| 概念 | 重点 |
| --- | --- |
| Harness | 约束和驾驭模型能力的一整套工程思想 |
| Runtime | 让 Agent 实际跑起来的执行环境 |
| Workflow | 预先定义好的步骤、分支和规则 |
| Guardrails | 更偏安全、策略和输出限制 |

Runtime 可以是 Harness 的一部分。Workflow 也可以运行在 Harness 内部。Harness 是更宽的概念，它强调“如何把模型自由输出变成可靠产品行为”。

## 5、一个 Agent 开发例子

比如一个能修改代码的 Agent，Harness 至少应该做这些事：

```text
1. 只允许读写当前仓库目录
2. 修改前先读相关文件和项目规范
3. 工具调用必须记录参数和结果
4. 删除文件、安装依赖、联网操作需要审批
5. 修改后必须跑测试或说明无法验证
6. 输出总结必须包含改了什么、验证了什么、风险是什么
```

这些规则不能只靠模型自觉。它们需要在 Runtime、权限系统、工具包装和日志系统里落地。

## 6、常见误区

### 误区一：Harness 是某个框架名

不是。LangGraph、OpenAI Agents SDK、Claude Code、Codex 这类工具都可以实现某些 Harness 能力，但 Harness 本身是一种工程层概念。

### 误区二：模型够强就不需要 Harness

模型越强，能执行的动作越多，越需要 Harness。强模型犯错时影响范围也更大。

### 误区三：Harness 只负责安全

安全只是其中一部分。Harness 还负责上下文、状态、工具、验证、恢复、成本和可观测性。

### 误区四：Prompt 写清楚就等于有 Harness

不够。Prompt 是软约束，Harness 需要硬边界，比如权限、Schema、沙盒、审批和测试。

## 7、一句话总结

Harness 是 Agent 的工程外壳。它把 LLM 的生成能力包进上下文、工具、权限、状态、验证和审计系统里，让 Agent 能真的安全干活。

## 参考资料

- [Anthropic: Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
