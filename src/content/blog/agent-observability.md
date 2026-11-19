---
title: "工具查到了，Agent 为什么说没找到？用 Langfuse 追一次回答"
description: "用一条能重跑的调用记录，找出资料在哪一步丢了。从接入 Langfuse 到读懂 trace，再验证一次修复。"
pubDate: 2026-11-19
category: "学习笔记"
draft: false
---

“周日几点闭馆？”资料里明明写着 18:00，Agent 却回答“没有找到现行公告”。打开日志，检索成功，命中两条，整次请求也是成功的。这时候很容易先改提示词，叫模型“务必仔细阅读资料”。可它究竟读到了哪两条？

我把这个问题缩成了一个虚构的公告查询。检索拿回两条，并不表示两条都进了最终上下文。在拿到资料和写出答案之间，还有一小段挑选资料的代码。把这三个位置的输入和输出摆到一起，就能看到那份公告在哪一步消失了。

## 先决定要留下哪三个瞬间

在 Langfuse 里，可以用一条 **trace** 记录一次提问从进入程序到产生答案的过程。里面每个值得单独查看的步骤叫 **observation**。打开这次提问的记录，会看到下面三步。

| 步骤名 | 想从记录里知道什么 |
| --- | --- |
| `find-notices` | 工具实际返回了哪几条公告？ |
| `choose-context` | 限制上下文长度之后，哪几条被留下了？ |
| `write-answer` | 生成答案的步骤收到了什么，又写出了什么？ |

这三个名字会出现在同一棵调用树里。以后把第二步从五行改成五十行，也能用同样的问题比较两次运行。每个函数都记一条，反倒会让这三处交接变得难找。[Langfuse 的数据模型](https://langfuse.com/docs/observability/data-model)

## 接上 Langfuse，跑一份故意答错的样本

准备 Python 3.11 和一个能访问的 Langfuse 项目。在项目设置里创建一对 API keys，把公钥和私钥分别放进运行脚本的环境变量 `LANGFUSE_PUBLIC_KEY` 和 `LANGFUSE_SECRET_KEY`，把项目接入说明中的服务根地址放进 `LANGFUSE_BASE_URL`。地址要与项目所在区域或自托管实例对应。下面的版本用于复现本例，可以在虚拟环境里安装。

```sh
python -m pip install "langfuse==5.2.0"
```

将下面的代码保存为 `notice_trace.py`，运行 `python notice_trace.py`。为方便比较，每次检索都返回相同的两条虚构公告，末尾用一句确定的规则写答案。这样就能单独看清传递资料的过程，也无需模型密钥。

```python
import argparse
import os
from langfuse import Langfuse

parser = argparse.ArgumentParser()
parser.add_argument("--fixed", action="store_true")
args = parser.parse_args()

lf = Langfuse(
    public_key=os.environ["LANGFUSE_PUBLIC_KEY"],
    secret_key=os.environ["LANGFUSE_SECRET_KEY"],
    base_url=os.environ["LANGFUSE_BASE_URL"],
)
question = "周日几点闭馆？"
with lf.start_as_current_observation(
    name="notice-question", as_type="agent", input=question,
    metadata={"variant": "fixed" if args.fixed else "original"},
) as turn:
    with lf.start_as_current_observation(name="find-notices", as_type="tool") as tool:
        hits = [
            {"status": "archived", "sunday_close": "17:00"},
            {"status": "current", "sunday_close": "18:00"},
        ]
        tool.update(output=hits)

    with lf.start_as_current_observation(
        name="choose-context", as_type="span", input=hits,
    ) as step:
        if args.fixed:
            context = [n for n in hits if n["status"] == "current"][:1]
        else:
            context = [n for n in hits[:1] if n["status"] == "current"]
        step.update(output=context)

    with lf.start_as_current_observation(
        name="write-answer", as_type="span", input=context,
    ) as step:
        answer = (f'周日 {context[0]["sunday_close"]} 闭馆。'
                  if context else "没有找到现行公告。")
        step.update(output=answer)

    turn.update(output=answer)
    print(lf.get_current_trace_id(), answer)

lf.flush()
```

这里的 `with` 决定了树的形状。外层 `notice-question` 处于活动状态时开启的三步，会成为它的子节点。末尾的 `flush()` 让这种即将退出的短脚本把缓冲的记录发出去。终端会打印本次的 trace ID，把它留下来，第二次运行会有另一个 ID。[Langfuse Python 接入指南](https://langfuse.com/docs/observability/get-started) · [嵌套记录与更新字段](https://langfuse.com/docs/observability/sdk/instrumentation)

## 打开那条答错的记录

在项目的 Tracing 页面按请求名 `notice-question` 和运行时间找记录，用终端里的 ID 核对。打开之后，先点 `write-answer`。它的输入是 `[]`。看到这里，“写答案时忽略了一条现行公告”这个猜测就可以放下了。交给它的资料确实是空的。

再往前点 `find-notices`。第二条结果里，`status` 是 `current`，时间是 `18:00`。于是只剩中间一步。点开 `choose-context`，输入有两条公告，输出却是一个空数组。回代码看 `hits[:1]`。旧公告恰好排在前面，程序先截一条，再过滤过期公告。唯一留下的旧公告被过滤，后面的新公告连参加筛选的机会都没有。

现在用相同的问题运行 `python notice_trace.py --fixed`。选中刚打印的那条 trace，展开相同的三个节点，可以逐项对照两次结果。

| 观察位置 | 原版 | 修订版 |
| --- | --- | --- |
| 工具输出 | 旧公告、新公告 | 旧公告、新公告 |
| 上下文输出 | 空数组 | 现行公告，18:00 |
| 最终回答 | 没有找到现行公告 | 周日 18:00 闭馆 |

这个对照还点出一个容易漏掉的细节。两次运行都可以没有异常，耗时也可能很接近。要长期检查这个问题，可以给这条样本定一个能判分的条件——回答有没有给出预期闭馆时间。这样以后改检索排序，还可以拿同一道题再跑一遍。

## 换到自己的 Agent，记录什么？

先找真实代码里把工具结果组装成模型输入的那一段。只在工具入口记“调用成功”，就会漏掉上面这样的错误。实际调用模型时，可以把那一步记成 `generation`，记录模型名和供应商实际返回的用量。示例里的回答是 Python 拼出的，所以用了普通 `span`。

本文的输入输出可以完整展开，因为数据都是编的。换成真实资料，通常先记上游和下游的条数、筛选原因、版本，以及能在本次记录内对应起来的匿名标签，就已经能看出“两条进、零条出”。这些字段也让你有机会在数据离开应用前删去提问原文、工具返回的私密正文和凭据。

有了这些记录，排查慢请求和多轮对话也有了起点。

- **用户说慢。** 切到时间轴，沿着整次请求看哪一步挡住了后续工作。例如两个工具并行各用一秒，用户等待的这段可能只有一秒左右。把树上每个节点的时长相加，会把重叠部分算两次。
- **用户说上一轮还答对了。** 把同一段对话的多条 trace 关联到同一个 session，再对照前后两轮究竟带入了哪些资料。会话能把记录排在一起，真正用来判断上下文有没有丢的，仍是交给模型的那份输入。[Langfuse Sessions](https://langfuse.com/docs/observability/features/sessions)

如果后台一条记录都看不到，先用终端的运行时间核对筛选范围和当前项目，再检查上报地址、密钥所属项目，以及程序退出前是否完成发送。我用本地接收端核对了示例实际发出的记录。两次各收到四个节点，三个子步骤都属于同一轮提问。修改前，写答案这一步收到零条公告。修改后，它收到一条，时间正是 18:00。
