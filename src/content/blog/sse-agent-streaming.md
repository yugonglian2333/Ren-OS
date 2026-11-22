---
title: "Agent 的回答为什么一口气冒出来？追一条 SSE 事件流"
description: "同样是等了一秒才看见整句，Chrome 里却能看到三种不同的时序。动手测一次字节到达、事件派发和页面更新，再让连接断在工具返回结果的那一行。"
pubDate: 2026-11-20
category: "学习笔记"
draft: false
---

聊天助手通常写出几个字，屏幕上就多出几个字。一种常见做法叫 **SSE**。浏览器发出一次请求，服务器把这次回答分成一条条消息，沿着同一个响应陆续发回来。

可有时屏幕空了将近一秒，才突然出现整句“找到两条记录。”服务端日志倒很均匀，每隔 300 毫秒就有一行。是哪一段把字攒住了？

我在本机把这句话拆成“找到”“两条”“记录。”，用 Chrome 跑了四遍。最容易误判的一遍里，浏览器在第 304 毫秒已经读到了“找到”所在的那批字节，但页面一直等到第 907 毫秒才收到第一条消息。中间这 600 毫秒，字究竟在哪儿？先看浏览器在等什么。

## 一个空行，决定浏览器能不能把“找到”交给页面

在聊天页面点“发送”，Network 面板里可能会多出两条请求。一条 `POST` 提交问题，拿到这次回答的编号，另一条 `GET` 订阅这次回答的进展。`POST` 很快完成并不奇怪，接下来要点开的是仍在传输的那条请求。也有应用直接用 `POST` 的响应传回整条流，判断依据是哪个响应在持续返回正文。找请求的步骤可以对照上一篇 DevTools 教程。[用 Chrome DevTools 排查网页问题](/blog/chrome-devtools-debugging/)

SSE（Server-Sent Events，服务器发送事件）约定了这段 HTTP 正文的写法。响应类型是 `text/event-stream`，文本按 UTF-8 解码。实验里第一条消息的原文很短，末尾有两个换行。

```js
"id: 1\ndata: 找到\n\n"
```

第一个换行结束 `data` 这一行，第二个换行留出一个空行。浏览器读到空行，才有一条可以交给页面的消息。试着把前两条消息末尾的空行删掉，只保留整段末尾那个。三次 `write` 照常执行，浏览器却把三个 `data` 行合成了一条消息，内容是 `"找到\n两条\n记录。"`，ID 是最后读到的 `3`。如果连末尾的空行也删掉，连接结束时，这条未完成的消息会被丢弃。[HTML 标准中的事件流解析规则](https://html.spec.whatwg.org/multipage/server-sent-events.html#event-stream-interpretation)

这个细节会改变排障方法。只看“前端一直没收到消息”，既可能是字节还在路上，也可能是字节都到了，只差一个空行。

## 同样等了近一秒，打开 Network 看见了什么？

下面是本机的一次读数，单位为毫秒。每组同时开两个请求，向同一个接口索取相同的三段文字。一个用 `fetch` 记录 JavaScript 何时读到字节，另一个用 Chrome 原生 `EventSource` 记录何时收到完整事件，并在修改 `textContent` 后记下时间。各列从各自请求开始计时，读数适合看间隔和次数。DOM 那列量到的是改完文字的时刻，屏幕实际绘制还要经过浏览器的渲染步骤。

| 改了哪一处 | 读到字节 | 收到事件 | 改完 DOM |
| --- | --- | --- | --- |
| 每段写完就发 | 311 / 609 / 910 | 312 / 610 / 915 | 312 / 610 / 915 |
| 服务端攒齐再发 | 906 | 907 / 907 / 907 | 907 / 907 / 907 |
| 前两处少一个空行 | 304 / 605 / 906 | 907 | 907 |
| 页面等第 3 条再更新 | 304 / 606 / 907 | 304 / 606 / 907 | 907 |

遇到类似问题，我会先打开 Chrome 的 **Network → 选中流式请求 → EventStream**。看事件列表什么时候变长，再决定下一步去哪里找。[Chrome DevTools 的事件流面板](https://developer.chrome.com/docs/devtools/network/reference/#stream-events)

- **一口气出现三行。** 实验第二组直到 906 毫秒才读到一块 63 字节的正文，里面三条完整事件都在。回看服务端，301、602、903 毫秒的日志记录的是把文字加进暂存字符串，真正写响应只有最后一次。在线上，如果应用确实分次写出，可以让同一段固定输出分别走源站和代理。源站能分段读、经过代理才成批读，再去查代理的响应缓冲。Nginx 的 `proxy_buffering` 控制这个方向。`X-Accel-Buffering: no` 能否生效还取决于代理是否接纳该响应头。[Nginx 的响应缓冲设置](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_buffering)
- **只出现一行，点开却有三行文本。** 第三组每隔约 300 毫秒都能读到字节，事件列表只出现 ID 为 3 的一行。打开响应原文，检查 `data` 行之间的空行。这时去调代理，改不了三条消息被写成一条的事实。
- **三行陆续出现，聊天框最后才变。** 第四组的监听器在 304 毫秒已经拿到第一条消息。沿着监听器往下看，页面一直在拼字符串，直到收到 ID 3 才给 DOM 赋值。实际项目里可以在收到事件和提交界面更新时各记一个时间。如果 DOM 也在按时变，下一步才是录 Performance，看主线程何时有机会绘制。

读到的一块字节，可能装着三条事件，也可能只装半个汉字。自己用 `fetch` 读 `POST` 响应时，如果把每次 `read()` 的结果直接解码、切行、`JSON.parse`，碰巧分块整齐的样例很容易通过。换一个分块位置就可能丢字或解析失败。需要跨块保留 UTF-8 解码状态，也要留下尚未结束的行和事件。能用原生 `EventSource` 的订阅接口，可以把这段工作交给浏览器。

## 工具还在查，连接怎么先断了？

还有一种“屏幕没动”出现在工具执行期间。假设查一次资料要 45 秒，而中间的代理只允许上游连续 30 秒没有数据。即使任务还在跑，代理也可能在第 30 秒关闭连接。以 Nginx 的 `proxy_read_timeout` 为例，它限制的是从上游连续两次读取之间能等多久。一条一直有数据的响应可以持续超过这个时长。[Nginx 的读取超时](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_read_timeout)

如果耗时只来自等待，服务端可以定时写出一行以冒号开头的注释，例如 `: ping\n\n`。这就是**心跳**。只要它及时到达上述代理，就能让代理知道上游还有数据。浏览器的 SSE 解析器会跳过注释，聊天框里不会冒出一个“ping”。心跳能帮助维持空闲连接。要知道查询究竟有没有完成，还得等工具结果。已经断了的连接，则需要另一套恢复办法。[HTML 标准的 SSE 编写说明](https://html.spec.whatwg.org/multipage/server-sent-events.html#authoring-notes)

## 把连接断在“工具查完了”的半句话上

文字能逐段出现，还有一个更隐蔽的问题。想象聊天框里已经显示“在查。”，旁边有个转圈的搜索图标。这时候 Wi-Fi 断了一下。恢复连接后，怎样让转圈停下来，同时保住前面那半句？

我给同一次虚构查询准备了五条按序保存的事件，让本地服务在第一次发到第 3 条时故意结束响应。第 3 条的字段已经写出，**唯独缺少最后的空行**。以下是构造的业务内容，断点和重连请求头是实测的。

| ID | 事件 | 页面据此做什么 |
| --- | --- | --- |
| 1 | `text.delta` | 追加“在查。” |
| 2 | `tool.started` | 为调用 `search-1` 显示“查询中” |
| 3 | `tool.finished` | 把同一项改为“查到 2 条” |
| 4 | `text.delta` | 追加“找到两条记录。” |
| 5 | `done` | 将回复标为完成，关闭订阅 |

服务端第一次打印 `Last-Event-ID = （无）`。Chrome 交付了 1 和 2，随后用**同一个** `EventSource` 自动重连。第二个请求实际带的是 `Last-Event-ID: 2`。服务端从保存的记录里选出 `id > 2` 的记录，补全第 3 条，接着发 4 和 5。监听器这才第一次收到完整的 `tool.finished`，最后收到 `done` 并调用 `close()`。这里的 `done` 是应用约定的事件名，订阅端要用 `addEventListener("done", …)` 接它。单独用 `onmessage` 收不到这种有名字的事件。[EventSource 的重连步骤和请求头](https://html.spec.whatwg.org/multipage/server-sent-events.html#the-last-event-id-header)

假如服务端只转发此刻新产生的事件，第 3 条发完就丢了，情况会怎样？重连照样可以成功，页面也可能拿到 4、5。于是答案显示“找到两条记录。”，旁边的搜索图标却还在转。“已重新连接”能说明请求通了，无法回答断线那段时间发生了什么。

## 恢复一段文字，和恢复一次工具调用，代价差在哪里？

如果页面只展示回答文本，一种省事的设计是重连时读取一份完整答案，**覆盖**本地草稿。拿到“在查。找到两条记录。”就能恢复阅读，无须保存模型输出的每个碎片。答案越长、重连越频繁，反复传整段的成本就越高。如果回答还在生成，快照还要带上“这份文字已经包含到哪一条”的编号，后续订阅从它之后接起。

如果界面还要展示工具进度，只存答案就没法知道 `search-1` 是执行中、已完成，还是失败了。可以保留一段有序事件记录，也可以把**文字、按调用编号保存的工具状态、回复是否完成、截至哪个事件**一起存进同一版快照。比如快照截至 3，应当同时含“在查。”和“查到 2 条”。如果先读到截至 2 的状态、过一会儿又读到最新编号 3，再把两者拼在一起返回，客户端就会从 4 继续，恰好永久跳过那个让转圈停下来的事件。

回放还得接得上正在跑的任务。假设服务器查出待补的 3、4，发送完才订阅实时通知，而 5 正好在这段空当写入。前四条都能在日志里找到，页面却等不到结束。若系统有可按编号持续读取的日志，从同一个游标一路读到新事件最简单。如果历史记录和实时通知由两套设施提供，就需要先订阅并暂存新事件，再补历史，最后按编号合并、去重。短答案可以直接取最终快照，省掉这段交接。

还有两个容易藏在“支持续传”这句话里的决定。

1. **谁确认进度？** 浏览器带回的 ID 表示它解析到了哪一条。假设监听器处理第 3 条时抛了异常，业务界面可能还停在 2。需要跨刷新恢复时，可以保存“已经成功应用的编号”和对应状态，重新打开页面后以这个进度订阅。新建的 `EventSource` 有自己的游标，应用可以通过订阅 URL 传入起点。若自动重连时 URL 里的起点和 `Last-Event-ID` 同时出现，要约定优先级，免得每次都从旧位置重播。
2. **补发时，哪些动作可以再做一遍？** 同一次回答里，重复追加第 4 条会把“找到两条记录。”写两遍。若约定编号连续，可以跳过已应用的编号，发现缺号就等回放或取新快照。如果服务端最早只保留到 70，客户端还停在 2，直接推第 70 条会留下中间的空白。工具事件则按 `call` 更新对应的那一项。重播“查完了”只更新界面。真正执行工具应由运行任务负责，否则每次重新打开聊天都有可能再执行一次。

这也是我在需要恢复的长任务里倾向于把“发起回答”和“订阅回答”拆成两个请求的原因。前者创建一次运行，后者可以反复打开同一次运行。直接在 `POST` 响应上流式返回，可以省掉建立订阅的一次往返。如果重试 `POST` 会创建另一轮回答，就得先设计好如何认回原来的那一轮。是否值得多做一个接口，取决于用户断线回来时，是只要读到最终文字，还是要接着看同一项工作。

## 在本机重跑

下面只用 Node.js 的内置模块和桌面 Chrome。两端都在本机，不需要模型、代理或账号。将服务端代码存为 `demo.mjs`，运行 `node demo.mjs`，在 Chrome 打开 `http://127.0.0.1:43176/`。空白页里有一个用来显示回答的 `pre` 元素。做完实验，在终端用 Ctrl+C 关掉服务。

<details>
<summary>展开完整的本地服务代码</summary>

```js
import { createServer } from "node:http";
import { setTimeout as sleep } from "node:timers/promises";

createServer(async (req, res) => {
  if (req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end('<meta charset="utf-8"><pre id="reply"></pre>');
  }
  if (req.url === "/resume") return resume(req, res);
  if (!["/plain", "/held", "/joined"].includes(req.url)) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-store" });
  res.flushHeaders();
  const start = performance.now();
  const parts = ["找到", "两条", "记录。"];
  let held = "";

  for (const [index, part] of parts.entries()) {
    await sleep(300);
    const id = index + 1;
    const blank = req.url === "/joined" && id < parts.length ? "" : "\n";
    const frame = `id: ${id}\ndata: ${part}\n${blank}`;
    if (req.url === "/held") held += frame;
    else res.write(frame);
    console.log(req.url, id, Math.round(performance.now() - start), held ? "暂存" : "写出");
  }
  res.end(held);
}).listen(43176, "127.0.0.1");

const history = [
  ["text.delta",   { text: "在查。" }],
  ["tool.started", { call: "search-1" }],
  ["tool.finished", { call: "search-1", count: 2 }],
  ["text.delta",   { text: "找到两条记录。" }],
  ["done",         {}],
];

function resume(req, res) {
  const cursor = req.headers["last-event-id"];
  console.log("Last-Event-ID =", cursor ?? "（无）");
  res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-store" });
  res.write("retry: 300\n\n");
  for (const [index, [type, data]] of history.entries()) {
    const id = index + 1;
    if (id <= Number(cursor ?? 0)) continue;
    const frame = `id: ${id}\nevent: ${type}\ndata: ${JSON.stringify(data)}`;
    if (cursor === undefined && id === 3) return res.end(frame + "\n");
    res.write(frame + "\n\n");
  }
  res.end();
}
```

</details>

打开 DevTools 的 Console，执行下面两个函数。`bytes` 观察应用能读到的字节，`watch` 观察原生事件和 DOM。二者各发一个请求，所以终端会看到两组服务端日志。

```js
async function bytes(path) {
  const start = performance.now();
  const response = await fetch(path);
  for await (const chunk of response.body) {
    console.log("字节", Math.round(performance.now() - start), chunk.length);
  }
}

function watch(path, holdScreen = false) {
  const output = document.querySelector("#reply");
  output.textContent = "";
  const start = performance.now();
  const ms = () => Math.round(performance.now() - start);
  const stream = new EventSource(path);
  let text = "";
  stream.onmessage = (e) => {
    console.log("事件", ms(), e.lastEventId, JSON.stringify(e.data));
    text += e.data;
    if (!holdScreen || e.lastEventId === "3") {
      output.textContent = text;
      console.log("DOM", ms(), output.textContent);
    }
    if (e.lastEventId === "3") stream.close();
  };
}
```

先运行 `watch("/plain"); bytes("/plain")`。等到“找到两条记录。”显示完，再把两处路径都改成 `/held`，然后试 `/joined`。第四组用 `watch("/plain", true); bytes("/plain")`。同时看 Network 里的 EventStream 和 Console 里的毫秒数。不同机器上的毫秒数会浮动，最值得对照的是每一列来了几次、有没有隔开。

最后保持 Network 录制，在 Console 执行下面这段。找到第二个 `/resume` 请求，在 **Headers → Request Headers** 里找 `Last-Event-ID`。再看 Console 里 `tool.finished` 出现了几次。把代码里 `if (id <= Number(cursor ?? 0)) continue;` 这行注释掉，重启服务再运行一遍，重连后的 1、2 会重复出现。仅这一行，就能看出“浏览器会重连”和“应用能从上次的位置恢复”之间差了什么。

```js
{
  const stream = new EventSource("/resume");
  for (const type of ["text.delta", "tool.started", "tool.finished", "done"]) {
    stream.addEventListener(type, (e) => {
      console.log(e.lastEventId, e.type, JSON.parse(e.data));
      if (e.type === "done") stream.close();
    });
  }
}
```
