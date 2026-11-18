---
title: "用 Chrome DevTools 排查网页问题"
description: "从 Network 里的一次点击开始，读请求、追断点、看事件流，再用 Performance 和 Application 分清页面卡顿、登录与缓存问题。"
pubDate: 2026-11-18
category: "学习笔记"
draft: false
---

我刚开始用 DevTools 时，有个很容易把自己带偏的习惯：页面出了问题，先点控制台里最红的那一条。后来翻排查笔记，有一条请求看起来又大又慢，点开完整地址，开头却是 `chrome-extension://`。我盯了半天的是浏览器扩展加载的资源。真正跟那次点击有关的请求，小得几乎没引起注意。

现在我会先留一条能认出来的请求。只要能回答“我刚才点的那一下，在浏览器里留下了什么”，接下来才知道该查接口、查代码，还是录一段性能数据。

## 先亲手抓住一条请求

Chrome 官方有个几乎空白的演示页，只有一个 **Get Data** 按钮。用桌面 Chrome 打开它，先别点按钮。右键选「检查」，切到 **Network（网络）**。确认左上角的录制按钮已开启，点旁边的清除按钮，再回页面点一次 Get Data。列表里会多出一条 `getstarted.json`。[打开 Chrome 官方演示页](https://chrome.dev/devtools-network-activity/getstarted.html)

点开这一行。**Headers** 里的 Request URL 和 Request Method 告诉你浏览器向哪里、用什么方法发了请求。**Response** 里是拿到的正文。关掉详情，再点一次按钮，观察第二次请求和页面变化。这个小动作放到真实网页上也好用：一轮只做一次操作，留下的几行记录比刷新整页得到的几百行容易读得多。

列表里什么都没有时，我会先点 **All** 并清空筛选框。比如点「登录」触发了整页跳转，只选 Fetch/XHR 就容易漏掉文档请求。想留住跳转前那几行，可以提前勾上 **Preserve log**。Console 也有自己的保留日志选项，两处各管各的。[Chrome Network 入门](https://developer.chrome.com/docs/devtools/network/)

## 接口回了 200，接着看哪儿？

假设你在列表里选了「只看未完成」，页面却空了。下面的字段和值是构造示例。在 Network 里先留一次「全部」的记录，再留一次「只看未完成」的记录。两行即使都是 200，比较它们也能把问题缩小很多。

| 两次点击留下的差异 | 接下来值得查什么 |
| --- | --- |
| 选了不同条件，两次 Request URL 和 Payload 却一样 | 先查这个界面按设计是在本地筛选还是重新查询。若应重新查询，就追参数从哪里生成。 |
| 参数从 `state=all` 变成 `state=open`，第二次 Response 是 `[]` | 浏览器拿到的就是空数组。核对筛选值和接口约定，再查对应条件下是否有数据。 |
| Response 里明明有两条符合条件的记录，页面仍然空白 | 去查读取响应、转换字段和更新页面的那几行代码。 |

GET 的查询条件常在 **Payload → Query String Parameters**。表单或 JSON 提交通常还要看 Form Data 或 Request Payload。有时一行状态是 200，Console 却报 JSON 解析错误。点开 Response，如果开头是 `<!doctype html>`，浏览器收到的是一页 HTML。看看响应的 Content-Type 和前面有没有重定向，通常比反复改 JSON 解析代码更快。对 URL、标头和正文还不熟，可以配合另一篇图解读。[一次 HTTP 请求的全貌](/blog/http-request-anatomy/)

## 从 Network 的一行跳到发请求的代码

我在笔记里记过一个更难找的请求：页面停着不动，同一个地址却隔一会儿就出现一次。光看名字，很难分清是谁在刷新状态。先点 **Initiator（发起程序）** 看调用来源。如果栈里出现计时器，沿着它去找注册定时回调的代码。若每一轮都来自同一个回调，便有了核对轮询间隔、页面切走后是否还在运行的入口。

另一个入口在 **Sources → XHR/fetch Breakpoints**。可以直接在刚才的官方演示里试：添加 URL 片段 `getstarted.json`，然后再点 Get Data。浏览器会停在发起匹配请求的代码附近。右侧 **Call Stack** 可以切换调用帧，**Scope** 会跟着显示那一帧里的变量。按 `Esc` 打开底部 Console，就能读取当前作用域中的值。

这个暂停位置适合看“发出去的地址是怎么拼的”。如果要查“响应回来以后为什么没显示”，继续找到处理响应的回调，或 `await response.json()` 后面使用数据的那一行，再下行断点。查完取消断点，点继续执行。暂停期间测出的交互耗时包含你盯着断点看的时间。[Chrome 断点指南](https://developer.chrome.com/docs/devtools/javascript/breakpoints)

## 提交已经成功，聊天窗口为什么还在等？

学习事件流时，我在 POST 的 Payload 里找到了自己输入的文字，翻遍它的 Response 却找不到回答。切回 Network 的 All，才在另一条**早已打开的连接**里看见回复一段一段地到达。

这种聊天实现把“接收问题”和“发送回复”分开了。前一个请求返回成功，只能确认提交已被接收。先去掉 `method:POST` 的筛选，找响应类型为 `text/event-stream` 的那一行，点开 **EventStream**，看发送前后新出现了哪些事件。连接如果是在进页面时建立的，得先打开 Network 再刷新一次才能录到它。

我会把三个时刻放在一起看：提交什么时候返回，第一段文字什么时候到，屏幕什么时候开始显示。事件已经陆续到达而屏幕还空着，就优先查前端的事件监听和渲染。过很久才看到一批事件同时出现，则需要对照服务端逐次写出的时间，看数据在哪一段等了这么久。一条仍标着 Pending、同时持续收到新事件的连接，本来就可以正常工作。[Chrome 查看事件流](https://developer.chrome.com/docs/devtools/network/reference/#event-stream)

## 是接口慢，还是页面画得慢？

看一次构造的 Timing 读数。请求共用 540 毫秒，等待首字节用了 510 毫秒，下载正文只用了 6 毫秒，其余 24 毫秒花在其他阶段。即使把正文压缩到几乎为零，等待首字节的半秒也还在。这个阶段包括网络往返和服务器准备响应的时间。若响应头带有应用记录的请求编号，可以拿它对上服务端日志，继续看这一次查询和上游调用各花了多久。[Network 耗时阶段](https://developer.chrome.com/docs/devtools/network/reference/#timing-explanation)

另一种情况是请求早就收完了，滚动列表仍然掉帧。切到 **Performance**，开始录制，只做一次容易卡住的操作，画面稳定后停止。在时间轴选中那一小段，展开 **Main** 看主线程当时在执行脚本、计算布局还是绘制。**Bottom-up** 把相同活动花掉的时间汇总起来。某个函数 Total time 很高、Self time 很低，说明时间主要花在它调用的工作上，可以沿子调用再往下找。[Chrome 性能录制参考](https://developer.chrome.com/docs/devtools/performance/reference)

内存也有类似的误读。我曾把“分配给 JS 的堆容量变大”直接读成“页面留住了这么多对象”。再做一轮时，更有意义的是重复同一个动作，比如打开面板、关闭，连续几轮后比较**回收后的已用量**。曲线涨起来又落下去很常见。若回到同一页面状态后，低点还在不断抬高，再用 Memory 的堆快照比较多轮后仍被保留的对象和引用路径。[Chrome 内存排查指南](https://developer.chrome.com/docs/devtools/memory-problems)

## 刷新以后才出错，先留住现场

“刷新后要重新登录”这类问题，清站点数据会连线索一起清掉。我会先在 **Application → Cookies** 看这个站点有没有预期的会话 Cookie，再回到 **Network** 检查**失败的那次请求**是否实际携带了它。存储面板能看到、请求却没带上，就检查 Domain、Path、Secure、SameSite 和浏览器显示的排除原因。请求确实带上了而服务端仍返回 401，就该继续核对会话的服务端有效期。记录这些差别只需要属性和现象，分享时隐去凭证值。

刷新后总出现旧内容，则留意 Network 里资源来自哪里。若请求由 Service Worker 处理，可以在 **Application → Service Workers** 临时勾选 **Bypass for network**，重复同一个操作，比较返回版本。旁路后恢复正常，就有理由去看 Worker 的取数策略以及 Cache Storage 中的条目。做完对照记得恢复开关，下次复现才和普通访问条件一致。[Chrome Service Worker 调试说明](https://developer.chrome.com/docs/devtools/application/service-workers/)

最后给同事或 Agent 留记录时，我会写下足够让对方找到同一行请求的信息。比如：“选择未完成后列表为空；这次 GET 带了 `state=open`，响应里有两条记录。下一步请看处理响应后传给列表的数组。”如果需要分享 HAR，再检查 URL 参数、请求体和响应正文。即便选了已清理的导出，这些位置仍可能带有私人数据。[Chrome 的 HAR 导出说明](https://developer.chrome.com/docs/devtools/network/reference/#save-as-har)
