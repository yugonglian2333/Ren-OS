---
title: "LLM 与 Prompt 提示词工程"
description: "什么是 LLM？Prompt、Instructions 和 Prompt Engineering 在 Agent 开发里分别承担什么角色？"
pubDate: 2026-07-06
category: "学习笔记"
draft: false
pinned: false
priority: 0
---

# LLM 大语言模型与 Prompt 提示词工程

[返回 Agent 开发笔记合集](./0、agent-dev-notes.md)

## 1、定义

LLM 是 Large Language Model 的缩写，也就是大语言模型。它的核心能力是根据上下文理解、预测和生成语言，并在这个过程中表现出总结、翻译、推理、改写、代码生成等能力。

Prompt 是给模型的输入指令。它可以是一句话，也可以包含任务目标、背景材料、角色边界、输出格式、工具说明和失败处理规则。

Prompt Engineering 是围绕提示词进行设计、调试和评估的方法。它不是“写一句神奇咒语”，而是在设计人、模型和系统之间的接口。

在 Agent 系统里，LLM 更像一个会思考和表达的大脑。Prompt 则像给这个大脑的任务说明书，告诉它现在要做什么、依据什么做、结果要长什么样。

## 2、为什么它重要

Agent 的很多行为都从模型输出开始。如果 Prompt 没有说清目标、边界和输出格式，模型就更容易猜测、跑偏或生成无法被程序处理的结果。

但 Prompt 也不是万能的。真实系统不能只靠一句“不要犯错”来保证安全，而要把 Prompt 和 Schema、工具权限、审批、日志、测试一起设计。

所以更准确的理解是：

> Prompt 负责表达意图，Harness 负责约束、验证和落地。

Prompt Engineering 是 Agent 开发的入口，但不是 Agent 工程的全部。

## 3、Prompt 的常见组成

| 组成 | 作用 |
| --- | --- |
| System Prompt | 定义模型的长期角色、行为边界和安全规则 |
| Developer Instructions | 定义应用开发者要求的流程、风格和工具使用规则 |
| User Prompt | 用户当前提出的任务和问题 |
| Context | 当前任务需要的背景、历史、工具结果和资料 |
| Output Format | 要求输出 Markdown、JSON、表格、代码或结构化对象 |
| Tool Instructions | 告诉模型有哪些工具、什么时候该用、参数是什么 |
| Guardrails | 明确禁止行为、风险升级条件和失败处理方式 |

一个常见的 Agent prompt 不是只有用户问题，而是多层信息叠加后的结果：

```text
系统规则 + 开发者规则 + 用户请求 + 当前上下文 + 可用工具 + 输出格式
```

## 4、和相邻概念的区别

| 概念 | 重点 |
| --- | --- |
| Prompt | 这一次给模型看的输入 |
| Instructions | 更稳定的行为规则，通常来自系统或开发者 |
| Context | 模型本轮生成能看到的全部信息 |
| System Prompt | 优先级较高的系统层指令 |
| User Prompt | 用户当前输入 |
| Prompt Template | 可复用的提示词模板 |
| Prompt Engineering | 设计、测试和改进 prompt 的方法 |

Prompt 更像一次任务输入，Instructions 更像长期规则，Context 则是模型实际能看到的工作台。

## 5、一个 Agent 开发例子

比如要做一个“读 PR 并写 review”的 Agent，不要只写：

```text
帮我 review 这个 PR。
```

更可靠的 prompt 会说明：

```text
目标：找出这个 PR 中的 bug、行为回归和缺失测试。
范围：只评论本次 diff，不评价无关历史代码。
上下文：PR diff、相关文件、项目规范、测试结果。
输出：按严重程度列出问题，每个问题包含文件、行号、原因和建议。
升级：如果缺少关键上下文，先说明不能判断，不要猜。
```

这类 prompt 更容易被 Agent Runtime 复用，也更容易和测试、review、日志系统配合。

## 6、常见误区

### 误区一：Prompt 越长越好

不是。Prompt 应该足够完整，但也要有信息优先级。把所有材料都塞进去，会增加成本，也会让模型抓不住重点。

### 误区二：Prompt 能替代权限控制

不能。模型可能误解或忽略约束。删除文件、付款、发消息、写数据库这类动作必须靠系统权限、审批和沙盒控制。

### 误区三：Prompt Engineering 就是话术技巧

不是。好的 Prompt Engineering 要能被评估和复用，应该关注输入结构、输出结构、失败处理和验证方式。

### 误区四：模型越强，Prompt 越不重要

模型越强，能做的事越多，Prompt 反而更需要清晰地定义边界。否则系统会把模糊需求放大成不可控行为。

## 7、一句话总结

LLM 是 Agent 的认知核心，Prompt 是给这个核心的任务接口。Prompt Engineering 的价值不是写漂亮话，而是把目标、上下文、边界和输出格式设计清楚。

## 参考资料

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic: Prompt engineering overview](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)
- [Google Machine Learning: Prompt engineering](https://developers.google.com/machine-learning/resources/prompt-eng)
