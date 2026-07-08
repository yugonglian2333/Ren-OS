---
title: "Structured Output 与 Schema"
description: "什么是结构化输出和 Schema？它们如何让模型结果可解析、可校验、可执行？"
pubDate: 2026-07-07
category: "学习笔记"
draft: false
pinned: false
priority: 0
---

# Structured Output 与 Schema

[返回 Agent 开发笔记合集](./0、agent-dev-notes.md)

## 1、定义

Structured Output 是让模型输出符合固定结构的数据，而不是自由文本。

Schema 是对这种结构的定义，比如字段名、类型、必填项、枚举值和约束。

常见形式包括 JSON Schema、Zod Schema、TypeScript 类型和数据库模型。

## 2、为什么它重要

Agent 如果要调用工具、生成提案或写入系统，就不能只输出一段自然语言。系统需要可解析、可校验的数据结构。

Structured Output 能把模型输出变成程序可以处理的对象，Schema 则负责约束结果是否合格。

它是从“AI 回答”走向“软件系统执行”的关键桥梁。

## 3、常见用途

| 用途 | 例子 |
| --- | --- |
| 工具调用参数 | `{ "location": "昆明" }` |
| 分类结果 | `{ "intent": "refund_request" }` |
| 数据抽取 | 从合同中抽取甲方、金额、日期 |
| Agent 提案 | 生成可审批的 action plan |
| 表单生成 | 动态生成字段和校验规则 |
| 工作流节点输出 | 每一步返回标准状态 |

结构化输出让后续系统可以继续处理，而不是再去猜自然语言含义。

## 4、JSON Schema、Zod、TypeScript 的关系

| 概念 | 重点 |
| --- | --- |
| JSON Schema | 通用数据结构描述标准 |
| Zod | TypeScript 生态里的运行时校验库 |
| TypeScript Type | 编译期类型检查 |
| Structured Output | 模型按指定结构输出 |

TypeScript 类型只在编译期有效，运行时仍然需要 Schema 或 Zod 这类校验。

对 Agent 来说，模型输出来自外部不可信输入，必须运行时校验。

## 5、一个 Agent 开发例子

比如让模型输出任务分类：

```json
{
  "type": "object",
  "properties": {
    "intent": {
      "type": "string",
      "enum": ["question", "bug_report", "feature_request", "unsafe_action"]
    },
    "confidence": {
      "type": "number",
      "minimum": 0,
      "maximum": 1
    },
    "reason": {
      "type": "string"
    }
  },
  "required": ["intent", "confidence", "reason"],
  "additionalProperties": false
}
```

Router 拿到这个结构后，就可以根据 `intent` 和 `confidence` 决定下一步路径。

## 6、常见误区

### 误区一：让模型“请输出 JSON”就够了

不够。最好使用严格 Schema，并在系统侧做运行时校验。

### 误区二：结构化输出不会出错

会。模型可能缺字段、类型错、枚举错，或者输出语义不合理。失败后要有重试和 fallback。

### 误区三：Schema 越复杂越好

不是。Schema 太复杂会降低模型稳定性。应该只约束真正需要程序处理的字段。

### 误区四：Schema 只能约束格式

Schema 主要约束格式和类型，但业务语义还需要额外校验。比如日期不能早于今天，金额不能超过预算。

## 7、一句话总结

Structured Output 让模型输出变成程序可处理的数据，Schema 让这些数据可校验。它们是 Agent 从“会说”到“能执行”的基础设施。

## 参考资料

- [OpenAI: Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)
- [JSON Schema Documentation](https://json-schema.org/learn)
- [Zod Documentation](https://zod.dev/)
