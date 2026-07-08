---
title: "Human-in-the-loop 与 Approval Gate"
description: "什么是 Human-in-the-loop 和 Approval Gate？它们如何控制 Agent 的高风险动作？"
pubDate: 2026-07-07
category: "学习笔记"
draft: false
pinned: false
priority: 0
---

# Human-in-the-loop 与 Approval Gate

[返回 Agent 开发笔记合集](./0、agent-dev-notes.md)

## 1、定义

Human-in-the-loop 指在人机协作流程中保留人工参与，让人类在关键节点检查、纠正或确认。

Approval Gate 是具体的审批门机制，用来在 Agent 执行高风险动作前暂停，并等待用户或管理员确认。

简单说：Human-in-the-loop 是人参与系统的设计思想，Approval Gate 是其中一种常见落地方式。

## 2、为什么它重要

Agent 可以生成计划和提案，但涉及写入数据库、删除文件、付款、发消息、发布内容等动作时，通常需要人工确认。

这不是降低智能化，而是把真实世界后果纳入系统设计。

模型负责建议，人类负责授权，系统负责执行和记录。

## 3、常见审批点

| 动作 | 为什么需要审批 |
| --- | --- |
| 删除或覆盖文件 | 可能造成数据丢失 |
| 写入数据库 | 可能污染业务数据 |
| 发送消息或邮件 | 会影响外部人员 |
| 付款、下单、退款 | 有经济后果 |
| 发布内容 | 会影响品牌和合规 |
| 权限变更 | 可能造成安全风险 |
| 安装依赖或联网 | 可能引入供应链风险 |

审批点应该根据风险设计，而不是所有操作都弹确认。

## 4、Approval Gate 应该展示什么

一个好的审批门不应该只问“是否继续”。它应该让人能判断风险：

```text
要执行什么动作？
为什么要执行？
会影响哪些资源？
具体 diff 或预览是什么？
是否可以撤销？
失败后会怎样？
```

没有足够上下文的审批，其实是在让人盲签。

## 5、一个 Agent 开发例子

比如 Agent 想发送一封客户邮件，Approval Gate 可以展示：

```text
动作：发送邮件
收件人：customer@example.com
主题：关于合同变更的说明
正文预览：...
依据：用户要求生成并发送变更说明
风险：外部发送，不可直接撤回
选项：批准发送 / 修改草稿 / 取消
```

用户批准后，Executor 才真正调用邮件发送工具，并把结果写入 Trace。

## 6、常见误区

### 误区一：所有操作都要人工确认

不需要。低风险、可逆、只读操作可以自动执行。过多审批会让系统不可用。

### 误区二：有审批就不需要沙盒

不对。Sandbox 是默认边界，Approval Gate 是高风险动作前的确认。两者解决不同问题。

### 误区三：人点了确认，系统就不用负责

不对。系统仍然要记录、执行校验、处理失败，并提供尽量可恢复的路径。

### 误区四：审批只适合企业场景

个人 Agent 也需要审批。比如删除文件、发消息、提交代码、安装依赖都可能影响真实世界。

## 7、一句话总结

Human-in-the-loop 让人类参与关键决策，Approval Gate 在高风险动作前按下暂停键。它们让 Agent 能做事，但不越权。

## 参考资料

- [Anthropic: Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
- [OpenAI API Documentation](https://platform.openai.com/docs)
