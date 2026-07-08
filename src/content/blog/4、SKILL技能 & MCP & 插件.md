---
title: "Skill 技能、MCP 与插件"
description: "Skill、MCP 和插件分别解决什么问题？它们如何扩展 Agent 的知识、工具和产品能力？"
pubDate: 2026-07-07
category: "学习笔记"
draft: false
pinned: false
priority: 0
---

# Skill 技能、MCP 与插件

[返回 Agent 开发笔记合集](./0、agent-dev-notes.md)

## 1、定义

Skill 是一套可复用的能力说明，通常包含触发条件、操作步骤、约束、示例、脚本和参考资料。它更像给 Agent 使用的专项 SOP。

MCP 是 Model Context Protocol，用来把外部工具、资源和上下文以统一协议暴露给模型或 Agent 客户端。

Plugin 插件通常是更大的能力包。它可以包含 Skill、MCP 工具、应用集成、模板、资源和配置，用来把一组能力打包分发。

简单说：

```text
Skill 教 Agent 怎么做一类事
MCP 让 Agent 能连接外部工具和资源
Plugin 把一组能力打包成可安装的扩展
```

## 2、为什么它重要

Agent 不可能把所有知识、流程和工具都写进一个 Prompt。那样会越来越长、越来越难维护，也很难按场景选择能力。

Skill、MCP 和插件的价值，是把能力拆成可发现、可复用、可组合的模块。

当用户说“帮我改一份 PPT”时，Agent 可以加载文档技能；当它需要读取数据库时，可以通过 MCP 调工具；当一组能力需要安装和分发时，可以做成插件。

## 3、三者的分工

| 概念 | 关注点 | 更像什么 |
| --- | --- | --- |
| Skill | 任务流程、操作规范、领域知识 | 专项 SOP / 菜谱 |
| MCP | 工具、资源、上下文连接协议 | USB-C / 标准接口 |
| Plugin | 能力集合的打包、安装、分发 | 应用扩展包 |

Skill 更偏“知识和流程”，MCP 更偏“协议和连接”，Plugin 更偏“产品化封装”。

它们经常一起出现，但不是同一个层级。

## 4、和 Tool 的区别

Tool 是可执行能力，比如“读取文件”“查询数据库”“创建 GitHub issue”。

Skill 不一定执行动作，它更多是在告诉 Agent：什么时候该用什么工具，步骤是什么，有什么限制，如何验证结果。

MCP 可以暴露 Tool，也可以暴露资源和提示模板。Plugin 则可以把多个 Tool、Skill 和资源组合成一个能力包。

## 5、一个 Agent 开发例子

假设要做一个“生成周报”的 Agent，可以这样拆：

```text
Skill：
- 如何收集本周任务
- 如何归类完成、阻塞、下周计划
- 周报语气和模板

MCP：
- 连接 GitHub issue
- 连接 Linear / Jira
- 连接日历和文档

Plugin：
- 打包周报 Skill
- 配置 MCP 工具
- 提供周报模板和示例
```

这样做的好处是：周报流程可以复用，工具连接可以替换，插件可以安装到不同项目里。

## 6、常见误区

### 误区一：Skill 就是 Prompt

Skill 可能包含 Prompt，但它通常还包含触发条件、工作流、验证方式、脚本、模板和资料。它比单条 prompt 更像一份可执行手册。

### 误区二：MCP 等于插件

不是。MCP 是协议，插件是打包形式。一个插件可以包含 MCP server，也可以只包含 Skill 或静态资源。

### 误区三：有工具就不需要 Skill

工具只说明“能做什么”，Skill 说明“什么时候做、按什么顺序做、怎么判断做完”。复杂任务需要两者配合。

### 误区四：能力越多越好

不是。能力太多会增加路由成本和误用风险。好的系统应该能按场景加载最相关的 Skill 和工具。

## 7、一句话总结

Skill 让 Agent 学会一类任务，MCP 让 Agent 连接外部能力，Plugin 让这些能力可以被打包、安装和复用。

## 参考资料

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic: Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
