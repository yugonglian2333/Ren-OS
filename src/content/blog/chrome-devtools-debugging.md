---
title: "Chrome DevTools 入门与 Web 应用问题排查"
description: "从一次可复现的页面异常出发，用 Console、Network、Performance 和 Application 收集证据，再把浏览器线索连接到代码与服务端日志。"
pubDate: 2026-11-18
category: "学习笔记"
draft: false
---

页面一直转圈，接口返回了数据却没有显示，点击按钮后偶尔卡住。这些问题看起来都发生在浏览器里，原因却可能来自参数、权限、缓存、网络或渲染。

我使用 DevTools 时，最有帮助的习惯是把“页面有问题”拆成可以验证的观察。先记录操作和现象，再找到对应请求与代码，最后用同一组步骤确认修复。下面的例子均为构造的教学场景。

## 从现象选择面板

在 Chrome 中按 `⌘ Option I`，Windows 或 Linux 按 `Ctrl Shift I`，可以打开开发者工具。界面名称可能随浏览器版本和语言变化。

| 观察到的现象 | 优先查看 | 要回答的问题 |
| --- | --- | --- |
| 点击后报错、页面状态异常 | Console | 哪段代码抛错，经过了哪些函数？ |
| 数据缺失、请求失败、接口慢 | Network | 实际发出了什么，收到了什么？ |
| 滚动或点击卡顿 | Performance | 哪项工作占用了主线程？ |
| 登录失效、刷新后状态异常 | Application | Cookie、存储和 Service Worker 怎样参与？ |
| 需要跟踪执行过程 | Sources | 断点处的变量和调用路径是什么？ |

这些面板会相互补充。例如，Console 出现读取字段失败，Network 可能显示接口返回的是一段错误消息。

## 先抓住一次完整操作

打开 Network，确认录制开启，清空旧记录，然后只复现一次问题。需要跨刷新或跳转观察时，勾选 Preserve log。记录太多时，用 Fetch/XHR 类型按钮和筛选框缩小范围。[Network 入门教程](https://developer.chrome.com/docs/devtools/network/)

常见筛选可以这样写。`example.com` 是示例域名，使用时换成自己的测试站点。

```text
domain:example.com
domain:example.com method:POST
```

找不到请求时，先检查是否打开了录制、是否复现了操作，以及筛选条件是否把目标隐藏了。清空筛选后再看一次，往往比继续猜测更有效。

打开目标请求后，按下面的顺序阅读。

| 位置 | 重点核对 |
| --- | --- |
| Headers | URL、方法、HTTP 状态、请求头和响应头 |
| Payload | 查询参数、表单和 JSON 请求体 |
| Preview / Response | 返回结构、数据内容、错误信息 |
| Initiator | 发起请求的脚本及调用线索 |
| Timing | 排队、连接、等待首字节和下载的分布 |

HTTP 200 只说明这次响应的 HTTP 状态成功。参数错误仍可能得到合法的空数组，页面还需要正确解释返回数据。排查时要同时写下“应该得到什么”和“实际得到了什么”。

## 一个可以本地复现的例子

下面故意把列表查询条件写成了 `closed`，而示例数据只有 `open` 状态。它用于练习定位“请求成功但列表为空”。

需要 Node.js 18 或更新版本，无需安装依赖。将代码保存为 `devtools-demo.mjs`，运行 `node devtools-demo.mjs`，在 Chrome 打开 `http://127.0.0.1:4300`。

```js
import { createServer } from "node:http";

const items = [{ id: "demo-1", title: "示例任务", status: "open" }];
const page = `<!doctype html><meta charset="utf-8">
<title>请求排查练习</title>
<button id="load">加载待处理任务</button><pre id="result"></pre>
<script>
document.querySelector('#load').onclick = async () => {
  const output = document.querySelector('#result');
  try {
    const response = await fetch('/api/items?status=closed');
    if (!response.ok) throw new Error('HTTP ' + response.status);
    output.textContent = JSON.stringify(await response.json(), null, 2);
  } catch (error) {
    output.textContent = String(error);
    console.error(error);
  }
};
</script>`;

createServer((req, res) => {
  const url = new URL(req.url, "http://127.0.0.1:4300");
  res.setHeader("Cache-Control", "no-store");
  if (url.pathname === "/api/items") {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    setTimeout(() => {
      res.end(JSON.stringify(items.filter(
        item => item.status === url.searchParams.get("status")
      )));
    }, 350);
    return;
  }
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(page);
}).listen(4300, "127.0.0.1");
```

打开 Network，点击按钮，找到 `/api/items`。响应是 200，Response 是 `[]`。再看 Payload 中的查询参数，可以发现页面请求了 `status=closed`。

把代码里的请求改为 `status=open`，重启服务并刷新页面，再点击按钮。响应应该包含一条任务。这样就验证了请求参数与页面意图之间的偏差，也留下了一组可重复检查的步骤。

## 接口慢，先拆开时间

示例接口人为增加了 350 毫秒等待。查看 Timing，可以观察时间主要花在哪一段。

等待首字节包含网络往返以及服务器准备响应的时间。生产环境里，仅凭这一段偏长，无法确定是数据库查询慢还是某个上游服务慢。继续关联服务端日志、请求编号，或者服务端提供的 `Server-Timing`，才能进一步细分。下载时间较长则需要结合传输量、带宽和压缩情况分析。[Timing 各阶段说明](https://developer.chrome.com/docs/devtools/network/reference/#timing-explanation)

流式响应可能长时间处于 Pending。要结合预期生命周期、已收到的数据和页面进度判断，不能仅用请求持续时间认定超时。

## 从报错、卡顿追到代码

Console 中先展开错误，阅读来源文件、行号和调用栈，再去 Sources 设置断点。调用栈能帮助还原错误经过的函数，断点则能检查当时的变量。[Console 调用栈说明](https://developer.chrome.com/docs/devtools/console/reference/#view-stack-traces)

如果来源是 `chrome-extension://`，说明这条线索属于扩展。可以在扩展停用的测试环境复现，比较结果。第三方脚本和站点代码也可能相互影响，需要继续核对调用过程。

当请求很快完成，页面却迟迟不更新，可以录制一次 Performance。只覆盖关键操作，选中卡顿时间段，检查主线程中的 JavaScript、样式计算、布局和绘制。结合 Bottom-up 或 Call tree 找到值得继续追踪的调用，再用相同操作比较修改前后的记录。[运行时性能分析教程](https://developer.chrome.com/docs/devtools/performance/)

Application 则适合核对 Cookie、Local Storage、Session Storage，以及 Service Worker 和缓存。清理站点数据会改变登录与本地状态，应先记录原状，在测试环境中有目的地验证。[Application 面板概览](https://developer.chrome.com/docs/devtools/application/)

## 把证据交给 Agent 或其他开发者

我倾向于整理一份短记录，包含复现步骤、预期结果、实际结果、相关请求、错误堆栈和已经验证的判断。这样 Agent 查代码时，有具体条件和可检验的目标。

例如本地练习可以记录为“点击加载待处理任务，实际请求 `status=closed`，HTTP 200 返回空数组。改为 `open` 后返回一条任务”。这段描述把现象、证据和验证连在了一起。

分享截图、Copy as fetch 或 HAR 前，要检查账号、Cookie、Authorization、URL 参数及请求和响应正文。Chrome 的 sanitized HAR 默认省略部分敏感标头，业务内容和自定义字段仍需自己核对。公开复盘可以换成构造数据与示意图。[HAR 导出说明](https://developer.chrome.com/docs/devtools/network/reference/#save-as-har)

一次排查最终应回到原来的复现步骤。参数正确、响应符合约定、页面正常展示，相关操作也没有出现新的异常，才形成了从观察到验证的完整过程。
