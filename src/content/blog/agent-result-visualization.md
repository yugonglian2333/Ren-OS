---
title: "Agent 的结构化结果如何变成图表与地图"
description: "用一份虚构的阅读点报名数据，讲清数据契约、图表映射、地图点位、结果版本、保存与导出如何共用同一份结构化结果。"
pubDate: 2026-11-25
category: "学习笔记"
draft: false
---

用户问：“把最近三个月四个阅读点的报名变化画成折线，再看看 8 月各点在地图上怎么分布。”

Agent 已经查到了 12 条记录。接下来最省事的做法，是把这 12 条数据拼成一段 JSON，交给前端直接画图。页面通常也能显示出来。但用户刷新一次、保存一次或者导出一次以后，就很容易遇到几个说不清的问题：

- 折线图还是刚才的结果，地图却重新查了一遍，两边的 8 月合计不一样。
- 图表少了一个点，却看不出来是零、没上报，还是程序把空值丢掉了。
- 用户把视图保存下来，第二天打开时标题仍写着“8 月”，图里却悄悄换成了新数据。
- 导出失败后重试，图片中的数据已经不是第一次点击导出时看到的那一版。

这些问题的根源都不在图表库。它们来自数据从查询结果走向视图时，少了明确的**数据契约**和**结果引用**。

本文用一份完全虚构、可以手算的数据，走完这条路径：查询结果怎样描述，折线和地图怎样从同一份结果派生，旧数据如何防止混入新视图，保存和导出又该保存什么。文中的阅读点、坐标和报名人数均为构造数据。

## 先把这 12 条数据摆在桌上

假设一家虚构的社区阅读空间有四个报名点，Agent 查询了 6 月、7 月和 8 月的报名人数。

| 阅读点 | 示意位置 `(x, y)` | 6 月 | 7 月 | 8 月 |
| --- | --- | ---: | ---: | ---: |
| 松果点 | (20, 30) | 120 | 150 | 180 |
| 河湾点 | (72, 25) | 100 | 90 | 80 |
| 青石点 | (35, 75) | 40 | 60 | 110 |
| 月台点 | (82, 68) | 60 | 未上报 | 90 |

只看表就能核对几件事：

- 6 月四站合计 `120 + 100 + 40 + 60 = 320` 人。
- 7 月只收到三个点，已知人数合计 `150 + 90 + 60 = 300` 人。月台点缺报，所以这 300 不能写成“四站总报名人数”。
- 8 月四站合计 `180 + 80 + 110 + 90 = 460` 人。

对话里可以先给一句结论：“8 月四站合计 460 人，松果点 180 人最多。7 月月台点没有上报，已知三站合计 300 人。”

接着才是两张视图：

1. 折线图按月份展示各站变化，月台点的 7 月处断开。
2. 地图只展示 8 月的四个点，按报名人数决定标记大小或颜色。

如果两边分别查数据库，这个页面还算不上一个可靠的结果。只要两条查询之间数据发生变化，折线图和地图就可能来自两个时点。更麻烦的是，用户看到的正文数字、图表读数和导出的文件还可能互相对不上。

## 数据契约要回答什么

可以把数据契约想成一份货运清单。不仅要知道箱子里装了什么，还要知道是谁发的、哪一版、用的是什么单位、每个空格代表什么。图表组件拿到数据后，才有条件拒绝不完整的输入。

下面是一个简化后的结果信封，省略了中间的若干行数据：

```json
{
  "resultId": "res_reading_demo_001",
  "resultVersion": 3,
  "schemaVersion": "reading-signups/v1",
  "generatedAt": "2026-11-25T20:00:00+08:00",
  "query": {
    "from": "2026-06-01T00:00:00+08:00",
    "to": "2026-09-01T00:00:00+08:00",
    "timeZone": "Asia/Shanghai",
    "scope": "虚构数据集中的四个阅读点",
    "unit": "人"
  },
  "completeness": {
    "status": "partial",
    "missingCells": 1
  },
  "columns": [
    { "name": "siteId", "type": "string", "semantic": "阅读点稳定标识" },
    { "name": "siteName", "type": "string", "semantic": "展示名称" },
    { "name": "positionX", "type": "number", "semantic": "示意横坐标，不是真实经度" },
    { "name": "positionY", "type": "number", "semantic": "示意纵坐标，不是真实纬度" },
    { "name": "month", "type": "string", "semantic": "自然月，格式 YYYY-MM" },
    { "name": "registrations", "type": "integer|null", "semantic": "当月已确认报名人数" },
    { "name": "cellStatus", "type": "string", "semantic": "observed 或 missing" }
  ],
  "rows": [
    {
      "siteId": "A",
      "siteName": "松果点",
      "positionX": 20,
      "positionY": 30,
      "month": "2026-06",
      "registrations": 120,
      "cellStatus": "observed"
    }
  ]
}
```

这里每一项都不是装饰。

`resultId` 说明“这是哪一次查询”，`resultVersion` 说明“具体是哪一版结果”。只有 ID 没有版本，后续代码重新读取时可能拿到另一份数据，却仍然套用原来的标题和解释。版本号应该指向一份不可变结果，而不是一个随时会被覆盖的“最新结果”指针。

`schemaVersion` 让视图代码知道自己接收的是哪一种数据结构。字段增加、单位改变或状态枚举调整时，旧视图应明确拒绝，或者走一个写清楚的兼容分支。拿旧代码猜新字段，通常比直接报错更危险。

`query.from` 包含起点，`to` 不包含终点。这样 6 月 1 日零点到 9 月 1 日零点，刚好覆盖 6、7、8 三个月，又不会把 9 月 1 日的第一条记录算进来。时区一并保留。只写“6 月到 8 月”这句话，无法说明查询边界到底落在哪一刻。

`scope` 描述数据范围，`unit` 描述数值单位。一个字段叫 `count`，不代表读者知道它统计的是报名、到场还是取消。列上的 `semantic` 和查询范围要写清楚业务含义。这里统计的是“已确认报名”，不是“预约提交”，也不是“实际到场”。

`completeness` 区分“结果完整”和“结果缺了一部分”。月台点 7 月没有上报，数据行中保留 `null` 和 `missing`，而不是填 0，也不把这行删掉。删除后，折线图会以为这一站只有两个月，读者看不到数据缺口。

最后，`generatedAt` 是结果生成时间，`query.to` 是业务数据截止时间，两者不是一回事。一个在 11 月生成的报表，可能统计的是截至 8 月底的数据。保存和导出时只留下其中一个，都无法把时间说清。

## 图表和地图是同一份结果的两种投影

有了结果信封，下一步是给图表和地图各写一份**视图定义**。视图定义只说明“取哪些字段、怎样映射到组件”，不再夹带第二份业务数据。

折线图可以这样描述：

```json
{
  "viewKind": "line",
  "source": {
    "resultId": "res_reading_demo_001",
    "resultVersion": 3
  },
  "x": { "field": "month", "type": "month" },
  "seriesBy": "siteName",
  "y": { "field": "registrations", "unit": "人" },
  "missing": "gap"
}
```

地图只需要 8 月的点，因此多一项明确的筛选：

```json
{
  "viewKind": "point-map",
  "source": {
    "resultId": "res_reading_demo_001",
    "resultVersion": 3
  },
  "filter": { "field": "month", "equals": "2026-08" },
  "position": { "x": "positionX", "y": "positionY" },
  "value": { "field": "registrations", "unit": "人" }
}
```

两份定义都指向 `res_reading_demo_001` 的第 3 版。折线图展示 12 个单元格，其中一个月台点是空值；地图筛出 8 月，展示四个非空点。它们不是两次查询，只是对同一份结果的两次读取。

这样分工还有一个好处：数据契约不用为每一种组件变形。同一批数据还可以派生表格、指标卡和 CSV。各种视图共享列名、单位和空值语义，只在展示方式上不同。

需要警惕的是，不要把任意 HTML、SVG、JavaScript 或 CSS 当作“组件参数”交给 Agent 生成。这样表面灵活，实际会绕开输入校验、无障碍处理、主题和内容安全。更稳妥的做法是维护一个受控组件目录，只接受已知 `viewKind`、已知字段和有限属性。未知图表类型直接拒绝，不能退回到一段无法验证的任意标记。

地图还要额外检查位置字段。上面的 `(x, y)` 是构造的绘图坐标，专门用于这组示意图。若换成真实经纬度，必须声明坐标参考系，例如经纬度常用 `EPSG:4326`，并明确哪个字段是经度、哪个是纬度。坐标缺失时不能当成 `(0, 0)`，否则一个没有位置的数据点会被画到地图上的某个真实位置。[EPSG 对 4326 的定义](https://epsg.io/4326)

同样，地图适合看“位置上的分布”，不适合替代精确排名。如果用户真正想问的是“哪个阅读点报名最多”，条形图更容易比较。只有地理位置本身就是问题的一部分时，地图才提供额外信息。[英国国家统计局的选图指南](https://service-manual.ons.gov.uk/data-visualisation/chart-types/choosing-a-chart-type)

## 空值、单位和总数不能靠猜

月台点的 7 月缺报，会在三个地方体现出来。

在数据层，它是 `registrations: null` 和 `cellStatus: "missing"`。在折线图中，它形成一个断点，而不是连成一条从 60 到 90 的线。在地图视图中，因为只展示 8 月，这个缺失不会影响 8 月的四个点。

如果页面要显示“7 月合计”，程序应该返回“已知三站合计 300 人，缺失 1 站”，而不是返回一个看似完整的 `300`。当缺失站点很多时，还需要防止读者把“已知合计”误当成“总体合计”。图表库通常能画空值，不能替产品决定缺失值该怎么解释。

单位也一样。报名人数是整数“人”，不能和百分比、金额直接叠在同一坐标轴上。即使两个系列都是数字，它们也不是同一种量纲。如果一个视图需要多个单位，应该分图或分轴，并让每个系列携带自己的单位。

精确值最好一直保留到展示层。报名人数用整数，不存在小数精度问题；如果换成金额或比例，计算和图形坐标可以使用数值，但提示框、数据表、导出文件仍应回到原始十进制值。比如原始值 `0.1` 与 `0.2` 的和，不应该只因为经过了一次浮点绘图，就在导出文件里变成 `0.30000000000000004`。图形坐标可以近似，作为证据的数字不能跟着近似。

还有一个经常被忽略的一致性检查：当折线图和地图都展示 8 月、范围相同、口径相同时，两边合计应该相等。

```text
折线图 8 月四站：180 + 80 + 110 + 90 = 460
地图 8 月四个点：180 + 80 + 110 + 90 = 460
表格 8 月四行：180 + 80 + 110 + 90 = 460
```

这不是让每张图各自重新求和，而是对同一个结果做一次核对。正文里的 460、图表提示里的 460 和导出文件里的 460 都应该来自这份核验过的摘要。只要其中一处不一致，页面就还有混版风险。

## 为什么保存“最新结果”还不够

设想用户在 20:00 看到第 3 版结果，20:10 数据源又产生第 4 版。此时如果页面刷新，折线图保留了旧版，地图却重新读取了新版，就可能出现：

| 位置 | 展示内容 | 实际结果版本 |
| --- | --- | --- |
| 正文 | 8 月 460 人 | 第 3 版 |
| 折线图 | 8 月 460 人 | 第 3 版 |
| 地图 | 8 月 470 人 | 第 4 版 |

每一块单独看都可能是对的，整个回答却错了。用户会以为 460 与 470 是同一个页面里的两个矛盾数字。

处理这种问题有两条清晰路线。

一条是**冻结结果**。保存回答时，把结果版本一起保存。再次打开页面，正文、表格、图表、地图和导出全部读取同一个版本。需要最新值时，用户明确点击“刷新”，所有视图一起换到新版本，正文结论也一起重算。

另一条是**实时视图**。页面不承诺复现历史快照，只展示当前数据，但必须标明“数据读取于 20:10”，并在每次刷新时成组更新所有组件。不能只让地图变，也不能把旧截图和实时表格并排摆着，却不加说明。

两种方式都可以用，关键是不要把两者混在同一次回答里。

冻结结果时，还要区分两种保存法：

- 保存完整行数据和元信息，后面即使原始查询服务不可用，也还能重开和导出。
- 只保存查询参数和版本号，之后回到数据源重放。存储更省，但依赖原系统保留历史版本，旧数据被覆盖时就无法还原。

如果文章、报告或审计记录需要长期复现，前者更可靠。如果只是短时间内的实时看板，后者可以接受，但界面必须明确它依赖当前数据源。

## “保存”和“导出”保存的不是同一样东西

一张图表至少有三种可保存对象。

第一种是**视图配置**，包括标题、图表类型、字段映射、筛选、排序、位置和尺寸。它决定“怎样展示”。

第二种是**结果快照**，包括数据行、单位、缺失状态、查询范围和版本。它决定“展示什么”。

第三种是**渲染产物**，例如 PNG、PDF 或 CSV。它决定“这一次交付的文件长什么样”。

一个可靠的保存记录通常需要把前两种绑定起来：

```json
{
  "viewId": "view_reading_aug_map_01",
  "viewKind": "point-map",
  "source": {
    "resultId": "res_reading_demo_001",
    "resultVersion": 3
  },
  "title": "8 月各阅读点报名人数",
  "filter": { "field": "month", "equals": "2026-08" }
}
```

只保存 `view` 配置，重新打开时如果数据源已经变了，图会换，标题却不会变。只保存一张截图，又无法展开明细、重新导出或检查数据口径。把视图定义和结果版本一起保存，才能既知道怎么画，又知道画的是哪一版。

导出要在点击按钮的那一刻冻结输入。比如用户 20:20 点击“下载 PNG”，任务开始排队，20:21 数据源更新。重试时不能悄悄读取最新结果再生成一张同名图片。导出任务应固定 `resultId`、`resultVersion`、视图配置和权限范围，重试只重新渲染同一份清单。

导出的图片至少应保留标题、时间范围、单位、口径和缺失说明。只导出绘图区，文件离开网页以后就很容易被误读。CSV 则应保留原始值、空值状态和本次筛选范围，不能把缺失值导出成 0，也不能把“已知合计”写成“总计”。

用户权限也要跟着结果走。保存的是第 3 版，不代表任何人以后都能看第 3 版。重新打开和再次导出时仍要检查当前账号是否仍具备该数据范围的权限。权限失效时显示不可用，不能因为浏览器里还留着旧缓存，就继续展示内容。

## 一个最小实现

下面这段 JavaScript 不依赖第三方库。它先校验结果信封，再把同一份数据投影成折线序列和 8 月地图点，并核对缺报与合计。把所有代码放进一个文件，用 `node result-view.js` 运行即可。

```js
const result = {
  resultId: "res_reading_demo_001",
  resultVersion: 3,
  schemaVersion: "reading-signups/v1",
  query: {
    from: "2026-06-01T00:00:00+08:00",
    to: "2026-09-01T00:00:00+08:00",
    timeZone: "Asia/Shanghai",
    unit: "人",
  },
  rows: [
    ["A", "松果点", 20, 30, "2026-06", 120, "observed"],
    ["A", "松果点", 20, 30, "2026-07", 150, "observed"],
    ["A", "松果点", 20, 30, "2026-08", 180, "observed"],
    ["B", "河湾点", 72, 25, "2026-06", 100, "observed"],
    ["B", "河湾点", 72, 25, "2026-07", 90, "observed"],
    ["B", "河湾点", 72, 25, "2026-08", 80, "observed"],
    ["C", "青石点", 35, 75, "2026-06", 40, "observed"],
    ["C", "青石点", 35, 75, "2026-07", 60, "observed"],
    ["C", "青石点", 35, 75, "2026-08", 110, "observed"],
    ["D", "月台点", 82, 68, "2026-06", 60, "observed"],
    ["D", "月台点", 82, 68, "2026-07", null, "missing"],
    ["D", "月台点", 82, 68, "2026-08", 90, "observed"],
  ].map(([siteId, siteName, positionX, positionY, month, registrations, cellStatus]) => ({
    siteId,
    siteName,
    positionX,
    positionY,
    month,
    registrations,
    cellStatus,
  })),
};

function assertResult(result) {
  if (result.schemaVersion !== "reading-signups/v1") {
    throw new Error("不支持的 schemaVersion");
  }
  if (!Number.isInteger(result.resultVersion) || result.resultVersion < 1) {
    throw new Error("resultVersion 必须是正整数");
  }
  if (result.query.unit !== "人") {
    throw new Error("字段单位与视图单位不一致");
  }

  const keys = new Set();
  const namesBySite = new Map();
  for (const row of result.rows) {
    const key = `${row.siteId}@${row.month}`;
    if (keys.has(key)) throw new Error(`重复单元格: ${key}`);
    keys.add(key);

    if (!/^\d{4}-\d{2}$/.test(row.month)) {
      throw new Error(`月份格式错误: ${row.month}`);
    }
    if (!Number.isFinite(row.positionX) || !Number.isFinite(row.positionY)) {
      throw new Error(`坐标不是有限数字: ${key}`);
    }
    if (row.cellStatus === "observed") {
      if (!Number.isInteger(row.registrations) || row.registrations < 0) {
        throw new Error(`已上报单元格必须是自然数: ${key}`);
      }
    } else if (row.cellStatus === "missing") {
      if (row.registrations !== null) {
        throw new Error(`缺失单元格必须保留 null: ${key}`);
      }
    } else {
      throw new Error(`未知单元格状态: ${row.cellStatus}`);
    }

    const previousName = namesBySite.get(row.siteId);
    if (previousName && previousName !== row.siteName) {
      throw new Error(`同一阅读点出现多个名称: ${row.siteId}`);
    }
    namesBySite.set(row.siteId, row.siteName);
  }
}

function buildLineView(result) {
  const months = [...new Set(result.rows.map((row) => row.month))].sort();
  const sites = new Map();
  for (const row of result.rows) {
    if (!sites.has(row.siteId)) sites.set(row.siteId, row.siteName);
  }
  const byKey = new Map(
    result.rows.map((row) => [`${row.siteId}@${row.month}`, row]),
  );

  return {
    viewKind: "line",
    source: { resultId: result.resultId, resultVersion: result.resultVersion },
    labels: months,
    unit: result.query.unit,
    series: [...sites].map(([siteId, name]) => ({
      name,
      values: months.map((month) => {
        const row = byKey.get(`${siteId}@${month}`);
        return row.cellStatus === "observed" ? row.registrations : null;
      }),
    })),
  };
}

function buildMapView(result, month) {
  const points = result.rows
    .filter(
      (row) =>
        row.month === month &&
        row.cellStatus === "observed" &&
        Number.isFinite(row.positionX) &&
        Number.isFinite(row.positionY),
    )
    .map((row) => ({
      siteId: row.siteId,
      label: row.siteName,
      x: row.positionX,
      y: row.positionY,
      value: row.registrations,
    }));

  const allRows = result.rows.filter((row) => row.month === month);
  const missing = allRows.length - points.length;
  return {
    viewKind: "point-map",
    source: { resultId: result.resultId, resultVersion: result.resultVersion },
    month,
    unit: result.query.unit,
    points,
    total: missing === 0
      ? points.reduce((sum, point) => sum + point.value, 0)
      : null,
    missing,
  };
}

function summarizeMonth(result, month) {
  const rows = result.rows.filter((row) => row.month === month);
  const missing = rows.filter((row) => row.cellStatus === "missing").length;
  const knownTotal = rows.reduce(
    (sum, row) =>
      row.cellStatus === "observed" ? sum + row.registrations : sum,
    0,
  );
  return {
    month,
    knownTotal,
    missing,
    completeTotal: missing === 0 ? knownTotal : null,
  };
}

assertResult(result);
const chart = buildLineView(result);
const map = buildMapView(result, "2026-08");

console.log("折线图", JSON.stringify(chart.series));
console.log("8 月地图", map.total, map.points.length, map.source);
console.log("7 月摘要", summarizeMonth(result, "2026-07"));
console.log("8 月摘要", summarizeMonth(result, "2026-08"));
```

输出中应能看到：8 月地图合计 460 人、四个点；7 月摘要保留已知合计 300、缺失 1 站和完整总计 `null`；8 月完整总计 460。折线序列中，月台点的第二个月度值是 `null`，而不是 0。

这个最小实现没有处理所有业务，但已经把三个关键边界立住了：

- 视图只保存 `resultId` 和 `resultVersion`，不暗中重新查数。
- 缺失值保留为 `null`，完整总计与已知合计分开。
- 图表和地图共用同一批行，测试可以直接比较 8 月合计。

## 验收时我会检查什么

发布一条带图表或地图的 Agent 回答前，我会按下面顺序检查：

1. **身份**：每个视图都能说清 `resultId`、`resultVersion` 和 `schemaVersion`。
2. **口径**：时间范围、时区、筛选范围、单位与字段语义一致。
3. **完整性**：空值没有被当成 0，缺失行没有被悄悄删掉，已知合计没有冒充完整总计。
4. **投影**：从同一版结果生成的折线、地图、表格和正文摘要能相互对上。
5. **权限**：重新打开、分享和导出时都按当前用户重新检查范围。
6. **保存**：保存的是视图定义加结果引用，重开后不会自动混入最新版本。
7. **导出**：导出任务冻结了具体结果版本和视图配置，重试不换数据。
8. **降级**：某张图渲染失败时，原始结果和数据表仍然可读，用户知道缺的是展示还是数据。

真正需要设计的，不是“怎样把一坨 JSON 变成一张图”。需要设计的是：**数据和展示怎样分开，展示和具体结果版本怎样绑定，结果又怎样在保存、重新打开和导出以后保持同一条证据链。**

回到开头那份 12 条记录。可靠的实现不会在折线图里生成一份数据、在地图里再查一份数据。它只会查询一次，把结果固定成第 3 版，然后让折线、地图、正文和导出都沿着同一个引用去读取。8 月的 460 人无论在哪里出现，都能追到同一份 6 月至 8 月的查询结果，以及那个明确标出的 7 月缺报单元格。
