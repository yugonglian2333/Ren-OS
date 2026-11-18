---
title: "书架上明明有两本在读，怎么一筛就没了？用 Chrome DevTools 查一遍"
description: "打开书架练习页，亲手追一条返回三本书的请求，在断点里找回消失的两本。再看看小响应为什么也会慢、聊天窗口的文字究竟从哪条连接回来。"
pubDate: 2026-11-18
category: "学习笔记"
draft: false
---

书架上有三本书。点「全部书目」，《岛上的邮局》和《厨房里的小实验》旁边都写着「在读」。再点「只看在读」，书架却变成了 **0 本**。如果现在有人问你“接口把书弄丢了吗”，你会拿什么回答？

我做了个可以点的书架，把这个小毛病留在了里面。用桌面 Chrome 打开练习页，右键选「检查」，切到 **Network（网络）**。先别展开页面底部的「验证修复」。这三本书和后面的请求示意都是为练习编的。[打开书架练习页](/labs/reading-shelf/)

## 点两次按钮，留下两条能比较的请求

看一眼 Network 左上角的录制按钮，开启时是红色。点旁边的清除按钮，回到书架，依次点「全部书目」和「只看在读」。在 Network 的筛选框输入 `books.json`。现在应该有两行同名记录。第一行对应看得见书的那次点击，第二行对应书消失的那次。

点第二行，先看 **Response（响应）**。如果你原先猜接口返回了空书单，这里会遇到第一个意外。

```json
[
  { "title": "岛上的邮局", "state": "reading" },
  { "title": "雨天的散步路线", "state": "finished" },
  { "title": "厨房里的小实验", "state": "reading" }
]
```

再点第一行。两次返回的书名、状态和条数都一样。这里比「两次都是 200」多给出了一条线索。**两本在读的书已经到了浏览器。** 此时去后台搜书名，能回答的问题很有限。更值得看的是，页面拿到三条记录后，对它们做了什么。

这也是我喜欢在排查开始时保留一次正常操作的原因。只盯着失败的那一行，`books.json` 这个名字没多少信息；放到两次点击中间，它就把问题缩小到了响应之后。如果表里一行都没有，先清掉文字筛选，点回 All，打开录制再点一次按钮。DevTools 只记录它在录制期间看到的请求。[Chrome 的 Network 操作说明](https://developer.chrome.com/docs/devtools/network/)

## 一个按钮写着「在读」，HTTP 收到了什么？

在第二条请求的 **Headers → General** 里看 Request URL 和 Request Method。地址以 `/labs/reading-shelf/books.json` 结尾，方法是 GET。里面连 `reading` 这个词都没有。这个练习每次取回同一份静态书单，按钮选中的状态只传给浏览器里的筛选函数。

换成由服务端筛选的书架，同样一次点击，HTTP/1.1 请求的开头可能长这样。这段是另一个接口的示意。

```http
GET /books?state=reading HTTP/1.1
Host: example.com
Accept: application/json
```

`/books` 指向书目资源，问号后面的 `state=reading` 才把筛选条件交给服务器。浏览器通常也能在 **Payload → Query String Parameters** 里展开它。如果给地址末尾加上 `#notes`，浏览器可以用它定位页面里的笔记段落，发往服务器的请求目标仍然是 `/books?state=reading`。

还有一种容易看错的位置。假如按钮改成「保存读书笔记」，请求使用 POST，Headers 中写着 `Content-Type: application/json`，那段笔记可能放在 Payload 的 **Request Payload** 里。想知道保存了什么，要读这次发出去的正文。点 Response 看到的则是服务端的回信。一行 Network 记录同时收着这两份东西，方向相反。

回来看书架。**Initiator（发起程序）** 能带你回到触发请求的脚本。在 `shelf.js` 里，`await fetch(...)` 拿到响应后先检查 `response.ok`，下一句 `await response.json()` 才读取正文并解析出那三本书。假如服务器回了 404，`fetch` 仍可能正常交回一个 Response；页面得自己检查状态。假如服务端回了 200 和一页 HTML，状态检查会通过，解析 JSON 时才会报错。遇到后一种情况，在 Response 看一眼开头的 `<!doctype html>`，比对着解析错误猜半天快得多。[MDN 的 Fetch 用法](https://developer.mozilla.org/zh-CN/docs/Web/API/Fetch_API/Using_Fetch)

## 让筛选函数停下来，看它读了哪个字段

进入 **Sources（源代码）**，按 `⌘ P`（Windows 或 Linux 用 `Ctrl P`），输入 `shelf.js`。在这一行的行号上点一下，留一个断点。

```js
return books.filter(book => book.status === view);
```

再点「只看在读」。页面暂停后，点一下 DevTools 区域，按 `Esc` 打开底部的 Console。在 Call Stack（调用堆栈）里选中 `selectBooks` 那一帧，分别输入下面三个表达式。

| 输入 | 此刻看到的值 |
| --- | --- |
| `view` | `"reading"` |
| `books[0].state` | `"reading"` |
| `books[0].status` | `undefined` |

现在可以逐字读出这次比较了。按钮传进来的是 `"reading"`。书的状态在 `state`，筛选函数取的却是 `status`。三本书都没有这个属性，三次比较都为假，结果自然为空。全部书目之所以一直正常，是因为 `view === "all"` 时函数直接返回原数组，根本没走到这一行。

点掉行号上的断点，按 `F8` 或点击继续执行。回到书架，展开「验证修复」，勾上修订版，再点一次「只看在读」。这一版读取 `book.state`。书架上应该能重新看到那两本书。**此时再看第三条请求**，响应里仍然有三本。修正只动了筛选函数，同一份输入这次留下了两本在读。

实际项目里，往往只知道请求的名字，连脚本在哪儿都不清楚。可以在 Sources 的 **XHR/fetch Breakpoints** 添加 URL 片段（练习里用 `books.json`），再点按钮。浏览器会在代码发出匹配请求的地方暂停。从这里找到请求函数，等读完响应后再下一个行断点，比在打包脚本里搜「在读」更直接。[Chrome 的断点指南](https://developer.chrome.com/docs/devtools/javascript/breakpoints)

## 同一条请求只有几百字节，为什么等了大半秒？

回到书架任意一条 `books.json`，打开 **Timing**。这里的数字会受你所在的位置和网络影响。假设另一次录制得到下面的读数，把 JSON 再压小一半，体感会好多少？

| 耗时阶段（构造读数） | 时间 |
| --- | ---: |
| 排队、连接、发送等 | 24 ms |
| Waiting for server response，等响应的第一个字节 | 510 ms |
| Content Download，读取响应内容 | 6 ms |

即使最后这 6 毫秒全省下来，请求仍要花约 534 毫秒。值得追的是中间那半秒。它包含网络往返，也包含服务器准备响应的时间。浏览器可以指出时间花在哪一段，但看不到其中哪条 SQL 执行了多久。如果应用把请求编号同时写入响应头和服务端日志，拿**这一次请求**的编号去对日志，才有机会把那 510 毫秒再拆开。

还有另一种“慢”。书单已经收完，按钮却过了半秒才动。此时可以在 **Performance** 点录制，只做一次点击，等书架更新就停止。沿时间轴找到这次交互，看看请求结束和下一次画面更新之间，主线程（Main）在忙什么。若 **Bottom-up** 里某个函数的 **Self time** 很高，时间主要花在它自身；若 **Total time** 高而 Self time 很低，应展开它调用的子函数。这样才知道是继续查网络，还是回去看一段循环或一次布局。[Network 耗时阶段](https://developer.chrome.com/docs/devtools/network/reference/#timing-explanation) · [Performance 录制解读](https://developer.chrome.com/docs/devtools/performance/reference)

## 聊天框一直转圈，回复可能在另一行

把书架练习换成一个聊天页面，会遇到更容易误判的情况。假设点「发送」后，Network 里一条 POST 很快回了 `202 Accepted`，正文只有 `{"accepted":true}`。你把 Response 翻到底也找不到回复。这个页面把提交问题和接收文字分成了两次通信，POST 的回信只够确认问题已被接收。

把 Network 切回 **All**，清掉 `method:POST` 之类的筛选。有些页面在打开聊天框时就连好了事件流，那一行会比刚刚的 POST 更早出现。若之前没录到，开启 Preserve log，刷新并重新操作。找到响应类型为 `text/event-stream` 的请求，打开 **EventStream** 看时间和数据。一个虚构的读书助手可能依次发来下面三个事件。

```text
event: fragment
data: {"text":"建议先读"}

event: fragment
data: {"text":"短篇集。"}

event: complete
data: {}
```

这里的事件名由示例应用约定。如果两个片段已经到了，屏幕还空着，就去看前端有没有监听 `fragment`、怎样把第二段接到第一段后面。如果连接一直 Pending，同时事件行不断增加，那恰是长连接在工作。如果直到最后才一下子冒出所有片段，下一步应对照服务端逐段写出的时间和浏览器收到的时间，再定位是哪一段在积攒数据。[Chrome 查看事件流](https://developer.chrome.com/docs/devtools/network/reference/#event-stream) · [SSE 事件格式](https://html.spec.whatwg.org/multipage/server-sent-events.html)

下次把问题交给同事或 Agent，我会留这样一句话：“点‘只看在读’显示 0 本。响应里有三本，其中两本的 `state` 是 `reading`。断点停在 `selectBooks`，它读到的 `status` 是 `undefined`。”对方可以直接去看那个函数。共享真实请求时，留下能复现差异的字段和值就够了。即便导出的是已清理的 HAR，URL 参数和正文里的个人数据仍要自己检查。[Chrome 的 HAR 导出说明](https://developer.chrome.com/docs/devtools/network/reference/#save-as-har)
