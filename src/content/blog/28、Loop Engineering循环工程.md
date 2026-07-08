---
title: "Loop Engineering 循环工程"
description: "什么是 Loop Engineering？它和 Prompt Engineering、ReAct Loop、Workflow 有什么区别？"
pubDate: 2026-07-08
category: "学习笔记"
draft: false
pinned: false
priority: 0
---

# Loop Engineering 循环工程

[返回 Agent 开发笔记合集](./0、agent-dev-notes.md)

## 1、定义

Loop Engineering 可以翻译成“循环工程”或“工作循环设计”。它不是单纯让提示词写得更漂亮，而是把一次性的 prompt 变成一套可以重复运行、可以验证结果、可以停止、可以审计、可以升级给人的 Agent 工作系统。

传统 Prompt Engineering 关心的是：

> 我该怎么问 AI，才能得到一个更好的回答？

Loop Engineering 关心的是：

> 我该怎么设计一个循环，让 AI Agent 能持续工作、验证结果、修复问题，并在合适的时候停止或交给人类？

所以它的关注点从“单次对话”转向了“持续运行的工作流”。

一个最小的 Loop Engineering 结构通常长这样：

```text
触发条件 -> 目标/范围 -> Agent 执行 -> 验证反馈 -> 继续修复或停止 -> 记录经验
```

如果用更工程化的话说，Loop Engineering 设计的是一份 loop specification，也就是一份“循环规格说明”：什么时候开始、要完成什么、用什么验证、失败怎么重试、什么时候停止、状态记在哪里。

## 2、为什么这个概念最近变火

AI coding 工具从“回答问题”进化到了“持续干活”。过去我们更像是在一轮一轮地手动指挥模型：

```text
帮我看这个 bug
-> 现在跑测试
-> 这个报错是什么意思
-> 再修一下
-> 重新跑 lint
```

但当 Codex、Claude Code 这类 coding agent 拥有文件读写、终端、测试、Git、子代理、自动化任务、MCP 连接器之后，很多步骤就不应该再由人反复敲 prompt。人更应该设计一个稳定循环，让系统自己发现任务、分发任务、检查结果，并在失败时把问题带回给人。

比如一个维护代码仓库的循环可以是：

```text
每天早上触发
-> 读取昨天的 CI 失败、issue、PR review
-> 挑出值得处理的问题
-> 在独立 worktree 中让 Agent 尝试修复
-> 跑测试、lint、typecheck
-> 让另一个 Agent 做 review
-> 成功则提交 PR
-> 失败超过次数则写入 triage 队列
```

这已经不是“写一个好 prompt”能概括的事情，而是在设计一套小型生产系统。

## 3、Loop Engineering 的核心部件

一个可靠的 loop 至少要设计这些东西：

| 部件 | 作用 |
| --- | --- |
| Trigger 触发条件 | 手动触发、定时触发、CI 失败触发、issue 变化触发等 |
| Goal 目标 | 明确这轮循环要完成什么，范围边界在哪里 |
| Context 上下文 | 代码、日志、issue、设计文档、历史决策、项目规范 |
| Tools 工具 | 文件系统、终端、测试命令、浏览器、数据库、GitHub、Linear、Slack 等 |
| Verification 验证 | 测试、lint、typecheck、schema 校验、人工 review、线上指标 |
| Retry 重试策略 | 失败后重试几次，是否换模型，是否缩小范围 |
| Stop 停止条件 | 验收通过、达到最大步数、超时、成本超限、风险升级 |
| Memory / State 状态 | 把做过什么、失败原因、下一步写到文件、issue、数据库或任务系统里 |
| Audit 审计 | 记录操作轨迹、命令输出、决策原因和最终结果 |

其中最关键的是验证和停止条件。没有验证，Agent 只是“看起来做了事”；没有停止条件，loop 就可能变成无限重试、无限烧 token、无限制造新问题。

## 4、和 Prompt Engineering 的区别

Prompt Engineering 是单次交互层面的技术，Loop Engineering 是系统层面的技术。

| 对比项 | Prompt Engineering | Loop Engineering |
| --- | --- | --- |
| 关注点 | 怎么问得更好 | 怎么让 Agent 稳定地循环工作 |
| 典型对象 | 一段 prompt | 一套可重复执行的任务系统 |
| 成功标准 | 输出质量更好 | 任务被验证完成，失败可追踪 |
| 反馈方式 | 用户继续追问 | 测试、CI、review、指标、人工审批 |
| 复用方式 | 复用 prompt 模板 | 复用触发器、工具、验证器、状态和升级路径 |
| 风险控制 | 靠 prompt 约束 | 靠权限、沙盒、审批、终止条件、审计日志 |

这并不表示 Prompt Engineering 没用了。Loop 里面仍然有 prompt，只是 prompt 不再是全部。Prompt 更像 loop 中的一个零件，Loop Engineering 负责把它放进可运行、可验证、可恢复的系统里。

## 5、和 ReAct Loop 的区别

ReAct 是 Reasoning and Acting 的缩写，它描述的是 Agent 内部如何一边推理、一边行动、一边观察结果。

典型结构是：

```text
Thought -> Action -> Observation -> Thought -> Action -> Observation -> ...
```

也就是模型先根据当前上下文推理，决定调用什么工具，工具返回结果后，模型再继续判断下一步。

Loop Engineering 比 ReAct 更外层。

| 对比项 | ReAct Loop | Loop Engineering |
| --- | --- | --- |
| 层级 | Agent 内部执行模式 | Agent 外部工作系统设计 |
| 核心问题 | 下一步怎么想、怎么调用工具 | 整个任务如何触发、验证、停止、升级 |
| 典型结构 | Thought / Action / Observation | Trigger / Goal / Execute / Verify / Retry / Stop |
| 反馈来源 | 工具返回的 observation | 测试、CI、review、指标、人工反馈、成本预算 |
| 停止方式 | 模型判断可以 final | 明确验收条件、失败阈值、最大轮数、人类接管 |
| 审计要求 | 通常是一段执行轨迹 | 要能沉淀状态、结果、失败原因和后续动作 |

一句话总结：

> ReAct 是 Agent 怎么“想和做”；Loop Engineering 是工程师怎么设计一个让 Agent 持续、安全、可验证地工作的系统。

所以二者不是竞争关系。ReAct 可以是 Loop Engineering 里面的一个内循环。外层 loop 负责目标、边界、验证和治理；内层 ReAct 负责每一步根据观察结果继续行动。

## 6、和 Workflow 的区别

Workflow 更强调预先定义好的确定性步骤，比如：

```text
提交表单 -> 校验参数 -> 调模型生成 -> 人工确认 -> 写入数据库 -> 发送通知
```

Loop Engineering 则更强调“持续反馈”和“直到达成目标”。它可以包含 workflow，也可以包含更开放的 Agent 探索。

可以粗略这样理解：

```text
Workflow = 预先设计好的流程路径
ReAct = Agent 单次任务里的推理-行动内循环
Loop Engineering = 围绕 Agent 工作的外层反馈系统
```

在真实项目里三者经常混合使用。比如一个“自动修复 CI”的系统，外层是 Loop Engineering，中间有固定的 Workflow，内部执行修复时可能使用 ReAct。

## 7、一个 Coding Loop 模板

下面是一个比较实用的代码修复 loop：

```text
名称：自动修复 CI 失败

Trigger：
- PR 的 CI 失败
- 或者每天固定时间扫描失败任务

Goal：
- 找到失败原因
- 修改最小必要代码
- 让指定测试、lint、typecheck 通过

Context：
- PR diff
- CI 日志
- 相关测试文件
- 项目 AGENTS.md / README / coding standards

Tools：
- 文件读写
- 终端
- 测试命令
- GitHub PR / issue

Verification：
- 复现失败
- 跑相关测试
- 跑 lint / typecheck
- 让 reviewer agent 检查 diff

Retry：
- 同一问题最多修复 3 轮
- 每轮必须记录失败原因
- 超过次数不继续扩大修改范围

Stop：
- 验证通过，写总结
- 或达到最大轮数，交给人类
- 或发现权限/产品决策/安全风险，立即升级

Memory：
- 在 PR 评论或任务记录里写清楚尝试过什么
- 记录最终修复点和剩余风险
```

这个模板的重点不是“让 Agent 更自由”，而是让 Agent 在清晰边界内自由工作。

## 8、常见误区

### 误区一：Loop Engineering 等于无限自动化

不是。好的 loop 一定有停止条件、预算限制和升级路径。没有终止条件的自动化只是失控风险。

### 误区二：让同一个 Agent 自己写、自己验就够了

风险很高。写代码的 Agent 容易相信自己的修复。更稳的做法是把 maker 和 checker 分开：一个负责实现，另一个根据测试、规范和 diff 做独立检查。

### 误区三：有 loop 就不需要理解代码了

恰好相反。Loop 越强，人越需要理解系统边界。否则很容易积累 comprehension debt，也就是代码变多了，但人对系统的理解变少了。

### 误区四：Loop Engineering 会取代 Prompt Engineering

不会。Prompt 仍然是 loop 的重要零件，只是工程重心从“写一句更好的 prompt”转向“设计一个更可靠的反馈系统”。

## 9、一句话总结

Loop Engineering 是 Agent 时代的工作流工程。它把一次性的 prompt 变成一套可重复运行、可验证、可停止、可审计、可升级给人的工作循环。

如果说 Prompt Engineering 是“会下指令”，ReAct Loop 是“Agent 会边想边做”，那么 Loop Engineering 就是“工程师会设计一个让 Agent 长期稳定干活的系统”。

## 参考资料

- [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629)
- [Addy Osmani: Loop Engineering](https://addyosmani.com/blog/loop-engineering/)
- [Business Insider: Forget prompt engineering: 'Loop engineering' is all the rage now](https://www.businessinsider.com/what-are-loops-ai-engineering-tips-2026-6)
- [Stop Hand-Holding Your Coding Agent: Engineering the Loops that Replace Step-by-Step Prompting](https://arxiv.org/abs/2607.00038)
