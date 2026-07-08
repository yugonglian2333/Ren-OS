---
title: "Executor 执行器"
description: "什么是 Executor？它如何把计划转化成具体工具调用、系统动作和可验证结果？"
pubDate: 2026-07-07
category: "学习笔记"
draft: false
pinned: false
priority: 0
---

# Executor 执行器

[返回 Agent 开发笔记合集](./0、agent-dev-notes.md)

## 1、定义

Executor 是负责执行具体步骤的组件。它根据计划或当前状态，调用工具、运行函数、请求 API、写入数据或生成最终结果。

如果 Planner 负责“想清楚怎么做”，Executor 就负责“按约束把事情做出来”。

Executor 可以是 LLM 驱动的，也可以是确定性代码。很多安全关键步骤更适合由确定性代码执行。

## 2、为什么它重要

Executor 是 Agent 真正产生副作用的地方。读文件、写数据库、调用 API、发送消息、修改代码，通常都发生在执行层。

因此 Executor 的设计直接影响系统安全。它应该验证输入、处理失败、尊重权限，并把执行结果清楚地返回给上层流程。

在高风险场景里，Executor 不应该直接执行模型给出的任意动作，而应该通过 Schema、白名单、沙盒和审批流程限制动作范围。

## 3、Executor 常见职责

| 职责 | 说明 |
| --- | --- |
| 解析步骤 | 理解当前要执行哪个动作 |
| 校验参数 | 检查工具名、参数类型、权限和状态 |
| 调用工具 | 执行函数、API、命令或文件操作 |
| 处理错误 | 超时、异常、无权限、返回不合法时处理 |
| 返回结果 | 输出结构化执行结果 |
| 记录痕迹 | 写入 Trace、日志和审计记录 |
| 保证幂等 | 避免重试造成重复副作用 |

Executor 的输出最好结构化，方便 Orchestrator 判断下一步。

## 4、和 Tool 的区别

| 概念 | 重点 |
| --- | --- |
| Tool | 一个可调用的外部能力 |
| Executor | 决定如何安全调用工具并处理结果 |
| Runtime | 承载 Executor 运行的环境 |
| Planner | 决定哪些步骤需要执行 |

Tool 是“刀”，Executor 是“按流程拿刀切菜的人”。同一个 Executor 可以调用多个 Tool。

## 5、一个 Agent 开发例子

比如执行“创建 GitHub issue”：

```text
Planner 输出：
- 创建一个 bug issue，标题和正文如下

Executor 应该做：
1. 校验用户是否有创建权限
2. 校验标题、正文、标签符合 Schema
3. 检查是否已有重复 issue
4. 如果是外部发布动作，进入 Approval Gate
5. 调用 GitHub API 创建 issue
6. 返回 issue URL 和操作结果
7. 记录 Trace
```

模型可以生成 issue 内容，但真正创建前应该由 Executor 做硬校验。

## 6、常见误区

### 误区一：Executor 只是调用工具的薄封装

不只是。可靠 Executor 还要负责校验、权限、错误处理、幂等和审计。

### 误区二：模型返回什么就执行什么

风险很高。模型输出必须经过 Schema、白名单和权限检查。

### 误区三：执行失败直接重试就好

不一定。外部副作用操作必须先判断是否已经执行成功，否则可能重复创建、重复发送或重复扣款。

### 误区四：Executor 不需要业务知识

很多执行器需要理解业务状态。比如订单已支付后不能重复支付，任务已关闭后不能重复关闭。

## 7、一句话总结

Executor 是 Agent 的执行层。它把计划变成真实动作，并通过校验、权限、错误处理和审计控制副作用。

## 参考资料

- [OpenAI: Function calling](https://platform.openai.com/docs/guides/function-calling)
- [Anthropic: Tool use](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview)
