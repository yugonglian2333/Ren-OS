---
title: "Router 路由"
description: "什么是 Agent Router？它如何选择模型、工具、Skill、Workflow 或人工处理路径？"
pubDate: 2026-07-07
category: "学习笔记"
draft: false
pinned: false
priority: 0
---

# Router 路由

[返回 Agent 开发笔记合集](./0、agent-dev-notes.md)

## 1、定义

Router 是 Agent 系统里的任务分发器。它根据用户意图、上下文、任务类型、权限或规则，把请求交给合适的模型、工具、Skill、Workflow 或子 Agent。

路由不一定必须由 LLM 完成。它可以是规则、分类器、关键词匹配、嵌入相似度、权限策略，也可以是多种方式组合。

如果把 Agent 系统比作客服中心，Router 就是分诊台：先判断这个请求应该去哪个窗口，而不是让同一个人处理所有问题。

## 2、为什么它重要

没有 Router，复杂 Agent 往往会把所有工具、所有规则、所有技能都塞进一个大 Prompt。结果是上下文变长、成本变高、模型更容易选错工具。

Router 可以降低复杂度，也可以控制成本。简单问题用小模型，复杂规划用强模型，高风险动作进入审批流程，不确定请求转给人。

Router 也是安全边界的一部分。比如“查询数据”和“删除数据”应该进入完全不同的路径。

## 3、常见路由目标

| 路由目标 | 例子 |
| --- | --- |
| 选择模型 | 简单分类走小模型，复杂代码走强模型 |
| 选择工具 | 天气问题走天气 API，仓库问题走代码搜索 |
| 选择 Skill | 文档任务加载 documents skill，PPT 任务加载 presentations skill |
| 选择 Workflow | 报销走固定审批流，闲聊走普通对话 |
| 选择子 Agent | Planner、Researcher、Coder、Reviewer 分工 |
| 选择人工处理 | 高风险、低置信度、权限不足时升级 |

Router 的输出最好结构化，至少要包含目标路径和选择原因。

## 4、几种常见路由方式

| 方式 | 优点 | 风险 |
| --- | --- | --- |
| 规则路由 | 稳定、便宜、可解释 | 覆盖不了模糊意图 |
| 关键词路由 | 实现简单 | 容易误判同义表达 |
| 分类模型 | 适合固定类别 | 需要训练或评估 |
| LLM Router | 理解力强，适合复杂意图 | 成本更高，输出要校验 |
| 混合路由 | 可控性和理解力兼顾 | 系统复杂度更高 |

实际项目里常用混合路由：先用规则处理明确情况，再用 LLM 处理模糊意图，最后用置信度决定是否升级给人。

## 5、一个 Agent 开发例子

一个个人效率 Agent 可以这样路由：

```text
用户输入：帮我整理一下这周的会议，生成一份周报。

Router 判断：
- 涉及日历读取 -> 需要 calendar tool
- 涉及周报生成 -> 加载 weekly-report skill
- 涉及外发邮件吗？没有 -> 不进入 approval gate
- 输出类型是文档 -> 进入 document workflow
```

如果用户进一步说“直接发给老板”，Router 应该把流程切到高风险路径，要求预览和人工确认。

## 6、常见误区

### 误区一：Router 一定要用 LLM

不是。很多路由用规则更稳，比如文件类型、用户权限、命令白名单、URL 域名和固定业务状态。

### 误区二：路由错了让 Agent 自己修就行

不可靠。路由错误会让 Agent 拿到错误工具和错误上下文，后面再聪明也可能越走越偏。

### 误区三：所有请求都应该路由到最强模型

没有必要。Router 的一个重要价值就是把成本和能力匹配起来，让简单任务走低成本路径。

### 误区四：Router 只负责分发，不负责安全

Router 经常是第一道安全边界。高风险意图、权限不足和不确定请求，都应该在路由层被识别出来。

## 7、一句话总结

Router 是 Agent 系统的分诊台。它把请求送到合适的模型、工具、Skill、Workflow 或人工路径，避免所有复杂度都压到一个 Agent 身上。

## 参考资料

- [Anthropic: Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
- [LangChain: Routing](https://python.langchain.com/docs/how_to/routing/)
