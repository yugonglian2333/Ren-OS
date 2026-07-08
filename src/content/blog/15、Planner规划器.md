---
title: "Planner 规划器"
description: "什么是 Planner？它如何把用户目标拆成步骤、工具需求、风险点和完成标准？"
pubDate: 2026-07-07
category: "学习笔记"
draft: false
pinned: false
priority: 0
---

# Planner 规划器

[返回 Agent 开发笔记合集](./0、agent-dev-notes.md)

## 1、定义

Planner 是负责制定计划的组件。它把用户目标拆解成更小的步骤，决定需要哪些信息、工具、检查点和完成标准。

Planner 可以由 LLM 扮演，也可以由规则、模板、固定 Workflow 或人类来完成。

如果 Executor 是“动手干活的人”，Planner 就是“先想清楚怎么干的人”。

## 2、为什么它重要

复杂任务往往不能一步完成。没有计划时，Agent 容易想到哪做到哪，遗漏关键验证，或者过早修改代码。

Planner 可以让 Agent 先明确路径，再逐步执行。它能减少无序尝试，也能把风险点提前暴露出来。

不过计划不是越复杂越好。实际系统里，计划需要能被执行、能被检查，并允许根据新信息调整。

## 3、Planner 常见输出

| 输出 | 说明 |
| --- | --- |
| Task Breakdown | 把目标拆成子任务 |
| Execution Order | 决定步骤顺序 |
| Needed Context | 需要读取哪些文件、资料或状态 |
| Tool Plan | 需要调用哪些工具 |
| Risk Points | 哪些步骤需要审批或谨慎处理 |
| Verification | 怎么判断任务完成 |
| Stop Condition | 什么时候停止或升级 |

一个好计划应该帮助执行，而不是变成漂亮但无用的清单。

## 4、和 Executor 的分工

| 角色 | 重点 |
| --- | --- |
| Planner | 决定做什么、先后顺序、验证标准 |
| Executor | 真的调用工具、修改数据、执行步骤 |
| Orchestrator | 在运行时协调 Planner 和 Executor |
| Reviewer | 检查结果是否符合目标和规范 |

在简单任务里，Planner 和 Executor 可以是同一个模型；在复杂或高风险任务里，最好拆开。

Maker-checker 模式里，Planner 制定路径，Executor 执行，Reviewer 独立检查。

## 5、一个 Agent 开发例子

用户说：“帮我把登录页改成支持手机号登录。”

Planner 可以先输出：

```text
1. 查找登录页组件和认证逻辑
2. 查找现有表单校验和 API 类型
3. 判断手机号登录是新增入口还是替换邮箱登录
4. 修改 UI、校验、提交参数和错误提示
5. 补充或更新测试
6. 运行相关测试和 typecheck
7. 总结改动和仍需产品确认的问题
```

这个计划避免 Agent 直接开始改 UI，却忘了 API、测试和产品边界。

## 6、常见误区

### 误区一：计划越详细越好

不是。过细计划容易在新信息出现后失效。好的计划应该有关键步骤和验证点，也允许调整。

### 误区二：Planner 可以替代执行验证

不能。计划只是预测，执行结果必须靠测试、工具返回和 review 验证。

### 误区三：所有任务都要先长篇规划

不需要。小修小改可以直接执行。规划成本应该和任务风险、复杂度匹配。

### 误区四：Planner 一定要用最强模型

不一定。固定业务流程可以用模板或规则规划；开放复杂任务才更需要强模型。

## 7、一句话总结

Planner 把模糊目标拆成可执行、可验证的步骤。它的价值不是写清单，而是降低遗漏、暴露风险、指导执行。

## 参考资料

- [Anthropic: Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
