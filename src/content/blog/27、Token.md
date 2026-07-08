---
title: "Token"
description: "什么是 Token？它如何影响模型上下文、成本、延迟和 Agent 工程设计？"
pubDate: 2026-07-07
category: "学习笔记"
draft: false
pinned: false
priority: 0
---

# Token

[返回 Agent 开发笔记合集](./0、agent-dev-notes.md)

## 1、定义

Token 是模型处理文本时使用的基本单位，也是很多模型 API 的计费单位。它可以近似理解为“字”“词”或“符号片段”，但不完全等同于自然语言里的字或词。

不同模型使用不同 tokenizer，所以同一段文字在不同模型里可能被切成不同数量的 token。

一般可以粗略理解：

```text
英文：一个单词可能是 1 个或多个 token
中文：一个汉字或词语可能被切成 1 个或多个 token
符号和代码：括号、空格、缩进、标点也可能占 token
```

实际 token 数量应该以模型 API 返回的 `usage` 为准。

## 2、为什么它重要

Token 会影响四件事：上下文容量、调用成本、响应延迟和输出长度。

Agent 系统往往比普通聊天更消耗 token，因为它会包含系统指令、工具定义、历史消息、RAG 材料、代码片段、工具结果和多轮修复过程。

如果不管理 token，Agent 很容易变慢、变贵，甚至因为上下文超限而丢失关键材料。

## 3、Token 消耗来自哪里

| 来源 | 例子 |
| --- | --- |
| System / Developer Instructions | 系统规则、项目规范 |
| User Prompt | 用户当前请求 |
| Conversation History | 多轮对话历史 |
| Tool Definitions | 工具名称、说明、JSON Schema |
| Tool Results | 搜索结果、测试日志、API 返回 |
| RAG Context | 检索到的文档片段 |
| Code Context | 相关源码、diff、错误堆栈 |
| Model Output | 模型最终生成内容 |

输入 token 和输出 token 通常会分别计费，输出 token 往往更贵。

## 4、和 Context Window 的关系

Context Window 是模型一次请求最多能处理的 token 容量。

如果上下文超过窗口，系统必须截断、摘要、检索或分块处理。否则模型无法完整看到任务所需信息。

可以这样理解：

```text
Token = 信息单位
Context Window = 本轮能放多少信息单位的工作台
```

上下文窗口大不代表可以随便塞材料。噪声越多，模型越难抓重点，成本也越高。

## 5、一个 Agent 开发例子

一个代码修复 Agent 的 token 预算可以这样设计：

```text
固定指令：2K token
用户任务和 PR 描述：1K token
错误日志摘要：2K token
相关源码：8K token
工具定义：2K token
历史摘要：1K token
预留输出：2K token
总预算：18K token
```

如果错误日志有 50K token，就不应该整段塞进去，而应该先提取关键失败、文件路径、堆栈和命令。

## 6、常见误区

### 误区一：Token 等于字数

不等于。Token 是 tokenizer 的切分结果，和自然语言字数只是近似相关。

### 误区二：上下文窗口越大越省心

不是。大窗口能放更多内容，但不解决信息选择、优先级和噪声问题。

### 误区三：只要控制输入 token 就够了

输出 token 也会影响成本和延迟。长篇输出、反复修复和多 Agent 协作都会增加输出成本。

### 误区四：工具结果都应该原样放回模型

不应该。长日志、搜索结果和数据库返回应该摘要、筛选或结构化后再放入上下文。

## 7、一句话总结

Token 是模型处理信息和计算成本的基本单位。Agent 工程里，token 管理就是上下文管理、成本管理和延迟管理的一部分。

## 参考资料

- [OpenAI: Tokenizer](https://platform.openai.com/tokenizer)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic: Context windows](https://docs.anthropic.com/en/docs/build-with-claude/context-windows)
