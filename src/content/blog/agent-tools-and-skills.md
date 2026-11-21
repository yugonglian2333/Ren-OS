---
title: "给 Agent 写预约 Skill，哪一步该交给按钮？"
description: "从一句“周六还能去两个人吗”追到最后一个名额。用能重跑的预约例子，拆清工具、Skill 和业务代码各自该做的判断。"
pubDate: 2026-11-21
category: "学习笔记"
draft: false
---

“周六上午还能去两个人吗？我先看看。”

工坊的预约助手查到上午恰好剩 2 位。你希望它回答“现在够两位”，然后等你决定。假如它为了让这个答案一直有效，顺手替你把位置锁了五分钟，隔壁那个已经决定要报名的人就只能看到“余位不足”。对第一个人，这是一次查询。对第二个人，系统已经做了一笔有后果的操作。

我用一个虚构工坊做了个小实验。上午 9 点有 2 位，下午 2 点有 4 位。A 想带一个朋友来，B 只来一个人。让他们先后查询、同时提交，或者重复点击同一张确认单，看看会留下几份预约。这里最值得设计的地方，是**哪一步开始改变别人看到的余位**。

## 把三个看起来都叫“预约”的动作摊开

| 谁在做什么 | 输入和返回 | 实际发生的事 |
| --- | --- | --- |
| Agent 查余位，`find_sessions` | 输入日期、人数，返回容得下这组人的时段和余位 | 读取当下的名额 |
| Agent 准备确认单，`prepare_booking` | 输入选定场次、人数，返回 `proposal_id` 和 `draft` | 保存选择，仍可把这些位置订给别人 |
| 用户在应用里确认，`confirm_booking` | 应用提交 `proposal_id`，返回该单的最终状态 | 校验归属和实时余位，成功才扣名额 |

前两个动作是给模型的工具。第三个是按钮调用的应用接口。比如模型准备了“6 月 8 日 09:00，两位”的草稿，应用就用这份记录画确认单。点击时只提交单号，服务端从登录会话取得操作人，从草稿取日期、场次和人数。这样，用户看到的内容和后端要执行的内容有同一个出处。本例把草稿的这几个字段固定下来，变更人数要生成另一张确认单。

为什么值得拆？试想只有一个 `booking(mode, slot, people, confirmed)` 工具。即使参数类型全对，布尔值 `confirmed: true` 也只说明调用方填了一个合法值。它无法证明用户看过“上午、两位”这两个条件。写好工具说明有助于模型选对动作。在这个工坊里，只有应用接到用户的确认操作才会扣名额。因此我让 Agent 只能调前两个动作，运行时也按这份名单分发。实验里直接从模型的工具入口请求 `confirm_booking`，结果是 `unknown_tool`，上午仍有 2 位。

工具也不必跟数据表一一对应。读者真正想知道的是“两个人能去哪一场”。让模型先列出所有场次，再逐个读取余位、对齐编号、筛掉只容得下一人的场次，任何一步漏掉“我们有两人”都可能给出错误建议。`find_sessions(day, people)` 直接回答这个业务问题。它返回可比较的 `slot` 和 `seats_left`，空列表表示当天没有能容纳这组人的场次。查询细节可以合并，承诺名额那一步值得单独留下。[Anthropic 的工具设计实践](https://www.anthropic.com/research/writing-tools-for-agents)

## Skill 里最值得写的是那句“然后呢”

工具能告诉 Agent 上午还有 2 位。至于“我先看看”应不应该生成确认单，“那就上午吧”是否需要再问一遍人数，这要结合前面的对话判断。我会把这种判断写进 `workshop-booking/SKILL.md`。下面是这个例子需要的全部内容。

```markdown
---
name: workshop-booking
description: 在用户询问工坊场次、查询余位或准备预约时使用，处理人数、时段选择和预约结果。
---

用户只问余位时，用 find_sessions 查询。报出符合人数的时段和查询时的余位，然后停下来。
用户决定要订时，沿用已经说清的日期和人数。如果还有多个时段可选，只问缺的那个选择。
场次和人数确定后，用 prepare_booking 生成确认单。把日期、时间和人数展示给用户。
draft 表示等待用户在确认单上操作。收到应用传回的 booked，才能告诉用户预约成功。
如果结果是 not_enough_seats，说明原场次无法容纳这组人。按原人数重查，供用户重新选择。
```

`description` 写上“查询余位”，是为了覆盖第一句话里连“预约”二字都没有的情形。正文写“沿用已经说清的日期和人数”，是为了让用户说“那就上午吧”时能直接拿到两人的确认单。按 Agent Skills 规范，一个 Skill 目录至少包含 `SKILL.md`。名称和描述帮助宿主发现它，选中后再读具体步骤。能调用哪些工具，还取决于宿主实际提供的接口。[Agent Skills 格式规范](https://agentskills.io/specification)

我会让 `prepare_booking` 明确返回 `draft`。如果只返回 `{"ok": true}`，存好草稿和订好位置都能叫“成功”，模型即使读懂了用户的意思，也得猜这次成功指什么。确认单被人点击后，应用再把带单号的结果交给对话层。用户说“我点好了”，但回执还没到时，可以按单号核对进度。仅凭这句话就回复“已经订好”，等于跳过了真正决定结果的一步。

## 两张确认单，都写着周六上午

下面是附录脚本的一次实际运行。A 和 B 先各自生成上午的确认单。A 要 2 位，B 要 1 位，此时两份草稿上写的人数加起来已经超过余位。工坊允许这样做，因为草稿只记录意愿。接着让 B 先点确认。

| 操作 | 应用的结果 | 上午余位 |
| --- | --- | --- |
| A 与 B 都拿到草稿 | 单 1 和单 2 均为 `draft` | 2 |
| B 点一次确认 | 单 2，`booked` | 1 |
| B 没看到回执，又点一次 | 仍是单 2，`booked` | 1 |
| A 确认原来的两人预约 | 单 1，`not_enough_seats` | 1 |
| 按 A 原来的人数再查 | 只有下午 14:00，剩 4 位 | 1 |

A 当初看到的“上午剩 2 位”是真的，现在看到的失败也是真的。把错误写成“上午已满”，独自报名的人就会错过最后一个位置。替 A 自动改到下午，又会替用户决定一件从没确认过的事。这个返回值足够支撑一句更准确的回答：“上午现在放不下两位。下午 2 点还有 4 位，要换到下午吗？”

再看 B 的第二次点击。此时库里还剩 1 位，如果代码先查“还能不能加一个人”，答案仍然是能，重复请求就有机会再扣一次。这里应该**先查这张单有没有结果**。单 2 已经订好，直接返回已经保存的结果。只有状态仍为 `draft` 时，才尝试按“余位至少等于本次人数”的条件扣减，并把结果记到同一张单上。如果在事务外先读出余位，算完再用旧数字覆盖新余位，另一个人就可能在这两步之间完成了预约。

这两笔更新要一起提交。我在扣减和记录结果之间故意触发了一次写入错误。事务回滚后，上午还是 2 位，单子还是 `draft`。我又让两个独立连接同时提交预约。两张不同的两人单去争最后 2 位，一张成功，另一张余位不足。两个连接确认**同一张**两人单，两边都拿到了 `booked`，数据库里只有一张成功单。示例用 SQLite 的 `BEGIN IMMEDIATE` 串起这些写入。要是数据库忙到连写事务都拿不到，那属于系统暂时忙，不能向用户解释为“没名额”。[SQLite 的事务与写入规则](https://www.sqlite.org/lang_transaction.html)

这份回执跟着单号走。同一张单重试，结果稳定，余位不足的单子也会保留原结果。如果每次点“再试一次”都新建一张草稿，服务端看到的就是两个不同请求。于是，重试按钮应当带回原单号。工坊如果另有“同一个人每场限订一次”的规则，要按人和场次另做校验。

## 如果产品真的希望“看到就帮我留着”

那是另一种合理的预约体验。用户准备付款，页面显示“已为你保留 5 分钟”，倒计时里余位就应该真的减少。这就得决定锁给谁、什么时候过期、用户关掉页面后谁归还名额。倒计时结束的瞬间收到付款，系统也得有个说法。只把 Skill 的措辞从“查询”改成“保留”解决不了它们。这个工坊选择先到先得，接受了 A 在确认前失去位置的可能，也省掉了临时锁座的维护成本。

验收这类 Agent，我会分别看它**说了什么、尝试调什么、库里留下了什么**。拿“我先看看”测一次，即使余位没变，模型若提前生成了草稿，也说明它没读懂“先”。换成上一轮已经说过日期和人数的“那就上午吧”，它应该能生成一张选择正确的草稿。最后把回执换成 `not_enough_seats`，观察它会不会宣称成功或擅自换场。这几句适合拿去测真实模型。下面的本地实验固定了工具调用顺序，可以单独验证调用出错时余位会怎样变化。

<details>
<summary>在本机复现两个人争名额，以及同一张单重复点击</summary>

把下面保存为 `booking.py`，用 `python3 booking.py` 运行。实测环境为 Python 3.11，只用标准库。脚本用内存数据库模拟单个周六的工坊，场次均按工坊当地时间显示，A、B 代表应用已识别的两位用户，直接调用确认函数模拟按钮点击。每次运行都从上午 2 位、下午 4 位开始。

```python
import sqlite3
from contextlib import closing

DAY = "2030-06-08"
AM, PM = DAY + "T09:00", DAY + "T14:00"


def setup(db):
    db.executescript("""
        CREATE TABLE sessions(slot TEXT PRIMARY KEY, seats INTEGER NOT NULL CHECK(seats >= 0));
        CREATE TABLE proposals(
            id INTEGER PRIMARY KEY, owner TEXT NOT NULL, slot TEXT NOT NULL,
            people INTEGER NOT NULL CHECK(people > 0), status TEXT NOT NULL
        );
    """)
    with db:
        db.executemany("INSERT INTO sessions VALUES (?, ?)", [(AM, 2), (PM, 4)])


def check_people(people):
    if type(people) is not int or people < 1:
        raise ValueError("people must be a positive integer")


def find_sessions(db, day, people):
    check_people(people)
    rows = db.execute("""
        SELECT slot, seats FROM sessions
        WHERE substr(slot, 1, 10) = ? AND seats >= ? ORDER BY slot
    """, (day, people))
    return [dict(slot=s, seats_left=n) for s, n in rows]


def prepare_booking(db, owner, slot, people):
    check_people(people)
    with db:
        if not db.execute("SELECT 1 FROM sessions WHERE slot = ?", (slot,)).fetchone():
            return {"status": "unknown_session"}
        row = db.execute("""
            INSERT INTO proposals(owner, slot, people, status) VALUES (?, ?, ?, 'draft')
        """, (owner, slot, people))
        return dict(proposal_id=row.lastrowid, slot=slot, people=people, status="draft")


def agent_tool(db, owner, name, **args):
    if name == "find_sessions":
        return find_sessions(db, **args)
    if name == "prepare_booking":
        return prepare_booking(db, owner, **args)
    return {"status": "unknown_tool"}


def confirm_booking(db, owner, proposal_id):
    with db:
        db.execute("BEGIN IMMEDIATE")
        row = db.execute("""
            SELECT slot, people, status FROM proposals WHERE id = ? AND owner = ?
        """, (proposal_id, owner)).fetchone()
        if row is None:
            return {"status": "unknown_proposal"}
        slot, people, status = row
        if status == "draft":
            changed = db.execute("""
                UPDATE sessions SET seats = seats - ? WHERE slot = ? AND seats >= ?
            """, (people, slot, people)).rowcount
            status = "booked" if changed else "not_enough_seats"
            db.execute("UPDATE proposals SET status = ? WHERE id = ?", (status, proposal_id))
        return dict(proposal_id=proposal_id, status=status)


if __name__ == "__main__":
    with closing(sqlite3.connect(":memory:")) as db:
        setup(db)
        print("查询", agent_tool(db, "A", "find_sessions", day=DAY, people=2))
        a = agent_tool(db, "A", "prepare_booking", slot=AM, people=2)
        b = agent_tool(db, "B", "prepare_booking", slot=AM, people=1)
        print("两份草稿", a, b)
        print("模型尝试确认", agent_tool(db, "A", "confirm_booking", proposal_id=a["proposal_id"]))
        print("草稿后的上午余位", find_sessions(db, DAY, 1)[0]["seats_left"])
        print("B 点击", confirm_booking(db, "B", b["proposal_id"]))
        print("B 重试", confirm_booking(db, "B", b["proposal_id"]))
        print("A 点击", confirm_booking(db, "A", a["proposal_id"]))
        print("两人可选", find_sessions(db, DAY, 2))
        print("最终余位", find_sessions(db, DAY, 1))
```

可以把 B 草稿里的 `people=1` 改为 `people=2` 再运行。B 的两次成功回执仍然对应一张单，上午余位变成 0。恢复 B 的 `people=1` 后，把输出“两人可选”的那一行改为 `find_sessions(db, DAY, 1)` 再运行。上午场会重新出现在列表里。

</details>

<details>
<summary>用两个数据库连接，同时确认同一张单或两张不同的单</summary>

把这段保存为同一目录下的 `race.py`，运行 `python3 race.py`。两个线程会在同一处等待，随后各用一个连接确认。每组都从 2 个上午名额开始，临时数据库在运行后自动清理。

```python
import sqlite3
from concurrent.futures import ThreadPoolExecutor
from contextlib import closing
from pathlib import Path
from tempfile import TemporaryDirectory
from threading import Barrier

from booking import AM, confirm_booking, prepare_booking, setup

for same_proposal in (False, True):
    with TemporaryDirectory() as folder:
        path = Path(folder) / "booking.db"
        gate = Barrier(2)
        with closing(sqlite3.connect(path)) as db:
            setup(db)
            first = prepare_booking(db, "A", AM, 2)["proposal_id"]
            if same_proposal:
                clicks = [("A", first), ("A", first)]
            else:
                second = prepare_booking(db, "B", AM, 2)["proposal_id"]
                clicks = [("A", first), ("B", second)]

            def click(args):
                with closing(sqlite3.connect(path, timeout=5)) as conn:
                    gate.wait(timeout=5)
                    return confirm_booking(conn, *args)["status"]

            with ThreadPoolExecutor(max_workers=2) as pool:
                statuses = sorted(pool.map(click, clicks))
            booked = db.execute("SELECT count(*) FROM proposals WHERE status='booked'").fetchone()[0]
            print(same_proposal, statuses, "成功单数", booked)
```

第一组有一方得到 `not_enough_seats`，哪一方先拿到名额取决于写入顺序。第二组两次都返回 `booked`。两组的成功单数都是 1。

</details>
