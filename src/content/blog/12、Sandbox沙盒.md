---
title: "Sandbox 沙盒"
description: "什么是 Sandbox？它如何限制 Agent 执行权限、隔离副作用并保护真实系统？"
pubDate: 2026-07-07
category: "学习笔记"
draft: false
pinned: false
priority: 0
---

# Sandbox 沙盒

[返回 Agent 开发笔记合集](./0、agent-dev-notes.md)

## 1、定义

Sandbox 是一个受限制的执行环境，用来隔离代码、命令、文件访问、网络访问或外部系统调用。

在 Agent 场景中，沙盒的核心价值是限制模型生成动作的影响范围。即使模型、工具或脚本出错，也不应该让错误直接伤害真实系统。

可以把 Sandbox 理解成给 Agent 准备的实验场：允许它尝试，但不允许它随便碰生产环境。

## 2、为什么它重要

Agent 可能会读写文件、运行命令、调用 API、修改数据库。没有沙盒时，一条错误指令可能造成数据丢失、越权访问、密钥泄露或生产事故。

沙盒让系统可以先在受控范围内执行和验证，再决定是否把结果应用到真实环境。

对 coding agent 来说，沙盒尤其关键。模型生成的命令可能是错的，依赖安装可能有风险，测试脚本也可能带副作用。

## 3、常见限制

| 限制类型 | 例子 |
| --- | --- |
| 文件系统 | 只能读写当前 workspace，禁止访问用户私密目录 |
| 网络 | 默认禁止联网，或只允许访问白名单域名 |
| 命令 | 禁止危险命令，限制可执行程序 |
| 环境变量 | 隐藏密钥和生产凭证 |
| 资源 | 限制 CPU、内存、磁盘和运行时间 |
| 权限 | 写操作、删除操作、发布操作需要审批 |
| 容器隔离 | 用 Docker、VM 或独立进程隔离执行 |

沙盒不是单一技术，而是一组边界控制。

## 4、和 Approval Gate 的区别

| 概念 | 重点 |
| --- | --- |
| Sandbox | 限制 Agent 可以做什么、影响哪里 |
| Approval Gate | 高风险动作前让人确认 |
| Permission | 定义工具和资源访问权限 |
| Audit | 记录发生过什么 |

Sandbox 是默认边界，Approval Gate 是关键动作前的人工闸门。

比如 Agent 可以在沙盒里修改代码并跑测试，但要删除文件、安装依赖、推送代码时，需要审批。

## 5、一个 Agent 开发例子

一个代码修改 Agent 的沙盒策略可以是：

```text
允许：
- 读取当前仓库文件
- 修改当前任务相关文件
- 运行测试、lint、typecheck
- 写入临时目录

禁止：
- 访问用户 home 目录
- 读取 .env 中的生产密钥
- 删除仓库外文件
- 直接 push 到远程仓库
- 未审批安装新依赖
```

这样即使 Agent 做错，也能把损害控制在可恢复范围内。

## 6、常见误区

### 误区一：Prompt 写了“不要做危险操作”就够了

不够。Prompt 是软约束，Sandbox 是硬边界。安全不能只靠模型自觉。

### 误区二：只要不联网就安全

不一定。文件删除、密钥读取、CPU 打满、磁盘写爆都可能在离线环境里发生。

### 误区三：沙盒越严格越好

沙盒需要和任务匹配。过严会让 Agent 无法完成任务，过松会放大风险。

### 误区四：沙盒可以替代审计

不能。沙盒限制影响范围，审计记录发生过什么。两者都需要。

## 7、一句话总结

Sandbox 是 Agent 的安全实验场。它通过文件、网络、命令、资源和权限边界，把模型动作的风险限制在可控范围内。

## 参考资料

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic: Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
- [Docker: Containers overview](https://docs.docker.com/get-started/docker-overview/)
