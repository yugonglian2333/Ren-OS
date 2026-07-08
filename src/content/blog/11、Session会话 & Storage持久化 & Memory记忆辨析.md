---
title: "Session、Storage 与 Memory 辨析"
description: "Session、Storage 和 Memory 分别是什么？它们在 Agent 系统里如何分工，为什么不能混为一谈？"
pubDate: 2026-07-07
category: "学习笔记"
draft: false
pinned: false
priority: 0
---

# Session、Storage 与 Memory 辨析

[返回 Agent 开发笔记合集](./0、agent-dev-notes.md)

## 1、定义

Session 是一次连续交互的会话上下文，通常包含当前用户、当前任务、历史消息和临时状态。

Storage 是持久化存储，负责把数据长期保存到数据库、文件、对象存储或本地缓存中。

Memory 是 Agent 为了未来任务而保留、总结和取用的信息。它可以来自 Session，也可以落到 Storage，但它不是所有存储数据的总和。

简单说：

```text
Session = 当前这次交互正在发生什么
Storage = 数据保存在哪里
Memory = 未来执行任务时应该记住什么
```

## 2、为什么它重要

这三个概念很容易混在一起。混在一起后，系统会出现两类问题：该记的不记，不该记的乱记。

比如用户在一次对话里临时说“这次用中文回答”，这属于 Session 偏好，不一定应该长期记住。

但用户长期偏好“技术文章要用中文，并保留英文术语”，这可能适合进入 Memory。

Storage 只是保存机制。并不是所有保存下来的聊天记录，都应该成为 Agent 主动使用的记忆。

## 3、三者的分工

| 概念 | 生命周期 | 典型内容 | 主要问题 |
| --- | --- | --- | --- |
| Session | 一次会话或任务 | 当前消息、临时变量、上下文摘要 | 这次任务做到哪了 |
| Storage | 长期保存 | 数据库记录、文件、对象、日志 | 数据如何可靠保存 |
| Memory | 可被 Agent 取用的长期信息 | 用户偏好、项目规则、历史决策 | 以后哪些信息值得记住 |

Memory 通常需要筛选、总结、过期和权限控制。不能把所有历史消息原封不动塞进上下文。

## 4、和 Context、State 的区别

| 概念 | 重点 |
| --- | --- |
| Context | 模型本轮生成能看到什么 |
| State | 任务当前执行到哪里 |
| Session | 一次交互或任务的会话范围 |
| Storage | 数据保存机制 |
| Memory | 未来任务可复用的长期信息 |

Context 是“当前可见”，State 是“当前进度”，Memory 是“长期可取用”。

## 5、一个 Agent 开发例子

比如一个旅行规划 Agent：

```text
Session：
- 用户这次要去云南 3 天
- 当前正在比较大理和丽江
- 已经确认预算 3000 元

Storage：
- 用户账号信息
- 历史旅行计划
- 收藏的酒店和航班

Memory：
- 用户偏好慢节奏旅行
- 不喜欢红眼航班
- 喜欢自然景观多于购物
```

规划这次行程时，Agent 应该把相关 Memory 取出来放进 Context，但不应该把所有历史旅行记录都塞进去。

## 6、常见误区

### 误区一：聊天记录就是 Memory

不是。聊天记录只是原始材料。Memory 应该是经过筛选、总结、授权和可检索的信息。

### 误区二：存进数据库就等于 Agent 记住了

不等于。Storage 只是保存。Agent 还需要检索、排序、过滤，并在合适时机放入 Context。

### 误区三：Memory 越多越好

不是。过期、错误或无关记忆会污染上下文。Memory 需要更新、删除和置信度管理。

### 误区四：Session 结束后状态都应该丢弃

不一定。某些任务需要从 Session 中提炼长期 Memory，比如用户明确确认的偏好或项目决策。

## 7、一句话总结

Session 记录这次会话，Storage 负责长期保存，Memory 是 Agent 未来真正会用到的长期信息。三者分清，Agent 才不会乱忘或乱记。

## 参考资料

- [LangGraph: Memory](https://langchain-ai.github.io/langgraph/concepts/memory/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
