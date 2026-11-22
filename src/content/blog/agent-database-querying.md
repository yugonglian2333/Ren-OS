---
title: "Agent 如何查询业务数据库"
description: "用五笔虚构的收退款记录，看 Agent 如何选对表、只查有权看的数据，并把一笔 24.99 元的净收款和分页明细对上。"
pubDate: 2026-11-22
category: "学习笔记"
draft: false
---

“6 月 8 日，东馆的报名费扣掉退款，实际收了多少？把明细给我，我想对一下。”

用户用平常的话提问，Agent 选择查询工具，程序去数据库里取数，最后由 Agent 把结果讲给用户听。用下面的账本查一遍，它应该能给出这样的答复。

> 东馆当天收款两笔，共 29.80 元，退款一笔，4.81 元，净收 24.99 元。

先把数据摊在桌上。下面五笔都是为教学编的，账本只记录已经入账的人民币收退款。假设提问的人只能看东馆，表里的西馆记录用来检验查询范围。

| 流水号 | 场馆 | 入账时间（北京时间） | 金额 |
| --- | --- | --- | ---: |
| 11 | 东馆 | 6 月 8 日 09:00 | 收 19.90 元 |
| 12 | 东馆 | 6 月 8 日 10:10 | 收 9.90 元 |
| 13 | 东馆 | 6 月 8 日 10:10 | 退 4.81 元 |
| 14 | 西馆 | 6 月 8 日 11:00 | 收 50.00 元 |
| 15 | 东馆 | 6 月 9 日 00:00 | 收 7.00 元 |

按场馆和日期圈出前三行，两笔收款相加，再减那笔退款，手算就对上了。那么第一次连到这个数据库，助手从哪儿知道该圈哪些行？

## 先找表，再决定一行代表什么

打开一个预约系统，可能同时看见“报名单”和“收退款流水”。一张报名单可能还没付钱，也可能付过钱又退了一部分。现在要算进出的钱，就该选流水表。假设第 13 笔退的是昨天报的名，只要今天退了钱，它就属于今天的净收款。若改问“今天新报名的人最终付了多少”，就得按报名单追踪后续付款和退款。这个差别就是**指标口径**——同一句“收了多少”，具体按什么规则算。

实际接入时，我会先让应用给助手一份**当前用户可查的数据目录**。目录先列出表及用途，选到流水表后再看字段说明。比如在 SQLite 里，开发者可以用 `PRAGMA table_info(cash_entries)` 查看列名和声明类型。它会列出 `delta_fen` 的声明类型 `INTEGER`（整数）。至于退款有没有带负号，光看类型可看不出来。这样的含义要由熟悉账本的人补进目录里。[SQLite 的表结构查询](https://www.sqlite.org/pragma.html#pragma_table_info)

我会给这张表补上这样一条说明。“每行是一笔已入账流水。按 `posted_at` 归到入账当天，`delta_fen` 的单位是分，收款为正，退款为负。”这样再看到 `-481`，程序直接把它加进总数。如果又执行一次“减退款”，这笔钱就被加回去了。

## 用户能问什么，程序能读什么

给助手一个 `daily_receipts(day)` 工具就能接住这个问题。助手传日期，应用从当前登录会话取得已授权的场馆。用户能管多个馆时，可以让他选馆，再由服务端核对是否在授权范围内。汇总和明细都要使用同一范围。先把所有馆的数据交给模型，再请它在回答时只提东馆，其他馆的流水就已经被读出去了。

这里有两个很容易混在一起的要求。**只读**管的是“能不能改账本”。用 Python 连接 SQLite 文件时，`sqlite3.connect("file:sample.db?mode=ro", uri=True)` 可以按只读模式打开这个文件。**可见范围**管的是“能读哪几行、哪些列”。只读打开整本账仍然可能看到西馆，所以这个例子只向助手开放预先写好的查询，程序负责加场馆条件，返回对账需要的列。[Python 的 SQLite 只读连接](https://docs.python.org/3/library/sqlite3.html#how-to-work-with-sqlite-uris)

这道题并不需要模型每次重新写 SQL。让它把“6 月 8 日”交给工具就够了。若产品还要支持临时换维度，比如按活动或支付方式分组，可以逐步开放目录中有明确定义的维度。这样既能多回答几类问题，也能在每种查询里复用相同的权限和金额规则。

## 让数据库算总额，最后才把分写成元

下面是汇总工具实际执行的 SQLite 查询。冒号开头的是参数，程序把已核准的场馆和时间传给数据库。示例把时间统一存成固定宽度的本地时间文本。起点是 6 月 8 日零点，终点是 6 月 9 日零点，取到起点、停在终点之前。这样第 15 笔自然留给第二天。若库里用世界协调时（UTC）存时间，就先把业务时区的两个零点换算成 UTC，再用它们做边界。

```sql
SELECT COUNT(*) AS entry_count, SUM(delta_fen) AS net_fen
FROM cash_entries
WHERE site = :site
  AND posted_at >= :start AND posted_at < :end;
```

这条查询在样本上返回 **3 笔、2499 分**。仅凭这两个数还说不出收了几笔、退了几笔。开头答复里的收款和退款分项，来自后面两页的完整明细。也就是 `1990 + 990 - 481 = 2499`，向读者展示时才写成 24.99 元。像 19.90 这样的十进制小数，在常见的二进制浮点里只能近似表示。这个账本的最小单位是分，直接存整数分，在整数可表示范围内加减可以保持精确。若业务还有不足一分的单价或费率，应先约定保留几位、在哪一步舍入，再决定存储单位。[SQLite 对整数和浮点精度的说明](https://www.sqlite.org/floatingpoint.html)

让查询同时返回笔数，还有一个好处。若某天一笔也没有，SQLite 的 `COUNT(*)` 返回 0，`SUM` 返回 `NULL`，可以告诉用户“这天没有入账流水”。若收了 10 元又恰好退了 10 元，则是两笔、净额为零。查询超时时，连这两种情况都还分不出来，应该告诉用户本次没查出结果。[SQLite 的聚合函数](https://www.sqlite.org/lang_aggfunc.html)

## 第一页为什么会和总额对不上？

让工具每页展示两笔。第一页恰好都是收款，共 29.80 元。若 Agent 只看这两行就答“净收 29.80 元”，它漏掉的是下一页的退款。因此我会把“算完整范围的总额”和“逐页取明细”作为两个动作。总额交给数据库一次算完，用户想核哪几笔，再取哪一页。

| 工具这次返回什么 | 看到的金额 | 还有下一页吗 |
| --- | ---: | --- |
| 第一页，流水 11、12 | 19.90、9.90 元 | 有 |
| 第二页，流水 13 | −4.81 元 | 没有 |

这里还有个藏得很好的错误。第一页最后一笔是 10:10，如果让第二页“从 10:10 之后开始查”，同为 10:10 的第 13 笔会被跳过。只把“之后”改成“从 10:10 起”也不行，第 12 笔又回来了。

一个办法是让每一页都按**入账时间、唯一流水号**排序，记住最后展示的那一对值，这对值就叫**游标**。第一页到 `(10:10, 12)`，第二页从比它大的第一对值开始，所以同一时刻的 `(10:10, 13)` 仍然会被选中。每次取三行、只展示两行，第三行用于判断“还有下一页”。下一页接在最后**展示**的记录之后。[SQLite 的多列比较与分页](https://www.sqlite.org/rowvalue.html#scrolling_window_queries)

如果查询期间还有流水入账，排序稳定也不能让两个时刻的账本变成同一份。下面的本地核对把总额和明细放在一个短读事务里，它们看到的是同一个数据库快照。在线上，用户可能过好几分钟才点下一页，可以生成一份有版本的对账结果，让后续页继续读这一版。若界面展示实时数据，则应标明查询时刻，重新对账时一起刷新总额和明细。[SQLite 的读事务](https://www.sqlite.org/lang_transaction.html#read_transactions_versus_write_transactions)

<details>
<summary>在本机用五笔流水核对总额和翻页结果</summary>

下面的 Python 3.9+ 脚本只使用标准库。把它保存为 `receipts.py`，运行 `python3 receipts.py`。它在临时目录里建一份教学账本，随后以只读方式重开。输出应当依次包含 `(3, 2499)`、第一页 `[(11, 1990), (12, 990)]` 和第二页 `[(13, -481)]`。

```python
from contextlib import closing
from pathlib import Path
import sqlite3
from tempfile import TemporaryDirectory

schema = """CREATE TABLE cash_entries (
    entry_id INTEGER PRIMARY KEY,
    site TEXT NOT NULL,
    posted_at TEXT NOT NULL,
    delta_fen INTEGER NOT NULL
);"""
total = """SELECT COUNT(*) AS entry_count, SUM(delta_fen) AS net_fen
FROM cash_entries
WHERE site = :site
  AND posted_at >= :start AND posted_at < :end;"""
page = """SELECT entry_id, posted_at, delta_fen
FROM cash_entries
WHERE site = :site
  AND posted_at >= :start AND posted_at < :end
  AND (posted_at, entry_id) > (:last_time, :last_id)
ORDER BY posted_at, entry_id
LIMIT 3;"""
sample = [
    (11, "东馆", "2030-06-08 09:00:00", 1990),
    (12, "东馆", "2030-06-08 10:10:00", 990),
    (13, "东馆", "2030-06-08 10:10:00", -481),
    (14, "西馆", "2030-06-08 11:00:00", 5000),
    (15, "东馆", "2030-06-09 00:00:00", 700),
]
with TemporaryDirectory() as folder:
    path = Path(folder) / "sample.db"
    with closing(sqlite3.connect(path)) as setup:
        setup.execute(schema)
        with setup:
            setup.executemany("INSERT INTO cash_entries VALUES (?, ?, ?, ?)", sample)
    with closing(sqlite3.connect(path.as_uri() + "?mode=ro", uri=True)) as db:
        scope = dict(site="东馆", start="2030-06-08 00:00:00", end="2030-06-09 00:00:00")
        db.execute("BEGIN")
        print("字段", [r[1] for r in db.execute("PRAGMA table_info(cash_entries)")])
        print("笔数、净额（分）", db.execute(total, scope).fetchone())
        cursor = dict(last_time="", last_id=0)
        while True:
            rows = db.execute(page, scope | cursor).fetchall()
            shown = rows[:2]
            print("本页（编号，分）", [(r[0], r[2]) for r in shown], "有下一页", len(rows) > 2)
            if len(rows) <= 2:
                break
            last_id, last_time, _ = shown[-1]
            cursor = dict(last_time=last_time, last_id=last_id)
```

可以把第 13 笔的金额从 `-481` 改为 `-2980` 再运行。现在还是三笔，净额变成零。再把查询时间移到样本没有流水的一天，笔数会变成零，净额在 Python 里显示为 `None`。两种“零收入”的来历就这样区分开了。

</details>
