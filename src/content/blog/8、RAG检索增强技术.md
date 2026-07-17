---
title: "RAG 检索增强技术"
description: "从原始 RAG、Chunk、Embedding 和混合检索，到 pgvector、Supabase 与 Agentic RAG 的完整实践笔记。"
pubDate: 2026-07-07
category: "学习笔记"
draft: false
pinned: false
priority: 0
---

# RAG 检索增强技术

[返回 Agent 开发笔记合集](./0、agent-dev-notes.md)

## 1、RAG 是什么

RAG 是 Retrieval-Augmented Generation 的缩写，中文通常译为“检索增强生成”。它不是某一种数据库或某一种搜索算法，而是一套让大模型在生成答案之前，先从外部数据源获取相关信息，再基于这些信息回答的系统机制。

可以把它概括为：

```text
用户问题 -> 检索外部资料 -> 将资料加入模型上下文 -> 模型基于资料生成答案
```

普通 LLM 主要依靠训练阶段学到的参数知识回答。RAG 则让模型在回答时临时“查资料”，因此更适合处理模型训练数据中没有的私有知识、需要持续更新的事实，以及必须提供来源依据的内容。

RAG 不是让模型永久记住知识，也不等于微调。知识通常保留在外部系统中，需要时才被检索并放进上下文。

## 2、为什么 RAG 会流行

LLM 本身存在几个现实限制：

- 训练知识有截止时间，无法天然掌握后续变化。
- 不知道企业内部文档、个人资料和业务数据库中的私有知识。
- 即使语言表达流畅，也可能编造事实或混淆来源。
- 重新训练或微调模型的成本高，而且不适合频繁更新事实知识。

RAG 把“知识”从模型参数中部分拆出来，放进可维护的外部数据源。这样做通常具有以下价值：

- 知识可更新：修改知识库后，不必重新训练模型。
- 私有数据可用：可以检索企业文档、用户笔记和领域资料。
- 答案可追溯：可以返回文档标题、链接、页码等引用信息。
- 成本相对可控：只把与当前问题有关的材料交给模型。
- 更容易治理：可以控制数据来源、访问权限、更新时间和可信度。

不过，RAG 只能降低幻觉风险，不能保证模型绝不出错。检索错了、资料过期、上下文组织不当或模型误读资料，都会导致错误答案。

## 3、原始 RAG 的完整流程

一个基础 RAG 系统通常分成离线索引和在线问答两条链路。

### 3.1 离线索引链路

```text
收集文档
  -> 解析与清洗
  -> 切分 Chunk
  -> 生成 Embedding
  -> 保存文本、向量和元数据
  -> 建立检索索引
```

1. 收集文档：来源可以是网页、PDF、Markdown、数据库记录、产品手册或个人笔记。
2. 解析与清洗：去掉无关导航、乱码和重复内容，同时尽量保留标题、段落、表格及章节结构。
3. 切分 Chunk：将长文档拆成适合检索的小片段。
4. 生成 Embedding：用嵌入模型将每个文本片段转换成向量。
5. 入库：同时保存原文、向量和来源、城市、分类、页码等元数据。
6. 建立索引：让数据库能够高效执行向量、全文或结构化查询。

### 3.2 在线问答链路

```text
用户问题
  -> 理解或改写查询
  -> 检索候选资料
  -> 过滤与重排
  -> 组织上下文
  -> LLM 生成答案
  -> 返回引用并记录日志
```

1. 接收问题：例如“杭州下雨天适合安排哪些室内景点？”
2. 查询处理：提取城市、天气、兴趣等条件，必要时改写成多个检索查询。
3. 检索资料：从知识库中找出相关片段。
4. 过滤与重排：去掉低质量或重复内容，对候选资料重新排序。
5. 构造 Prompt：把问题、检索资料、回答规则和引用要求交给 LLM。
6. 生成答案：要求模型尽量只根据提供的资料回答。
7. 引用与评估：返回来源，并记录问题、检索结果、耗时和用户反馈。

RAG 的最终质量不只取决于 LLM。数据质量、切块方式、检索召回、重排和上下文组织往往同样重要。

## 4、Chunk 是什么

Chunk 就是从长文档中切出来的一小段文本，也是基础 RAG 中常见的检索单位。

如果把一本完整攻略直接生成一个向量，内容会过于宽泛，用户问一个具体景点时很难准确匹配；如果切成单个句子，上下文又可能不足。因此需要在“信息完整”和“检索精确”之间取得平衡。

一个 Chunk 可以包含如下内容：

```json
{
  "id": "chunk_001",
  "document_id": "doc_hangzhou_guide",
  "content": "浙江省博物馆适合雨天参观，部分展馆需要提前预约……",
  "city": "杭州",
  "category": "poi",
  "source_title": "杭州旅行指南",
  "source_url": "https://example.com/hangzhou",
  "page_index": 3,
  "embedding": [0.012, -0.331, 0.208]
}
```

其中 `page_index` 通常只是原文页码或页面位置的元数据，用于定位和引用，并不是 RAG 的必需算法。

### 4.1 常见切块方式

- 固定长度切块：按字符数或 Token 数切分，实现简单，但容易切断语义。
- 按段落或标题切块：更能保留文档结构，适合 Markdown 和说明文档。
- 递归切块：优先按章节、段落、句子分割，超长时继续向下切。
- 语义切块：根据主题变化决定边界，效果可能更自然，但实现和成本更高。
- Parent-Child 切块：用小片段精确检索，再返回它所属的较大父段落作为上下文。

旅行知识库的第一版可以先按标题和段落切分，将每块控制在约 300 至 800 个中文字符，并保留少量重叠。这个范围不是固定标准，最终应通过评测数据调整。

## 5、Embedding 和向量检索的原理

Embedding 是一种由模型学习得到的数值表示。文本输入嵌入模型后，会被转换成固定维度的向量，例如：

```text
“适合带老人游玩的杭州景点”
-> [0.012, -0.331, 0.208, ...]
```

句子并不是一变成数字就自动拥有了语义。真正起作用的是嵌入模型的训练过程：模型从大量语言数据以及“哪些文本相似、哪些文本不相似”的训练目标中，学会把在语义或使用场景上接近的文本映射到向量空间中的相近位置。

例如，“适合长辈的杭州景点”和“杭州有哪些老人友好的游玩地点”用词不同，但意图接近。训练良好的嵌入模型会让它们的向量距离较近。检索时，可以使用余弦相似度、点积或欧氏距离比较查询向量与文档向量。

这是一种统计意义上的语义表示，不等于真正理解，也不等于事实判断。向量检索可能在以下内容上表现不稳定：

- 否定关系，例如“允许携带”和“不允许携带”。
- 精确数字、日期、价格和版本号。
- 人名、地点名、产品编号等精确实体。
- 很新的事实或训练数据中罕见的专业概念。
- 逻辑上相关但措辞和上下文差异很大的内容。

因此，生产系统通常不会只依赖向量检索。

## 6、RAG 不等于向量检索

RAG 描述的是“先取得外部信息，再增强生成”的整体架构。向量检索只是其中一种 Retriever 实现。

系统可以按数据类型采用不同方法：

| 方法 | 擅长的问题 | 典型例子 |
| --- | --- | --- |
| 关键词 / BM25 | 精确词语、专有名词、编号 | 搜索“灵隐寺”“G1234” |
| 向量检索 | 同义表达、自然语言意图 | 搜索“适合老人轻松游玩的地方” |
| SQL 查询 | 明确字段、范围、排序和聚合 | 预算低于 500 元、开放时间晚于 20 点 |
| 图查询 | 实体关系、多跳关系 | 景点、区域、交通线路之间的关系 |
| API 查询 | 实时或外部动态信息 | 天气、路线、票价、营业状态 |
| 全文搜索 | 文档内文字匹配与排序 | PostgreSQL Full Text Search |
| 混合检索 | 融合多种结果 | BM25 + 向量 + 元数据过滤 |

这些名称并不完全处于同一层级：BM25 和向量检索属于检索算法；SQL 和 API 更像数据访问方式；全文搜索是一类搜索能力；混合检索是组合与融合策略。将它们放在一起，是为了说明 RAG 可以从多种信息源获取上下文，而不是宣称它们是同一种分类标准。

对于旅行场景，比较实用的组合是：

```text
SQL 元数据过滤
  + BM25 精确匹配
  + 向量语义召回
  + Reranker 重排
  + 引用来源
```

例如先用 SQL 限定“杭州、室内、亲子”，再结合关键词和向量检索寻找相关片段，最后用重排模型选择最能回答问题的资料。

## 7、pgvector 与 Supabase

`pgvector` 是 PostgreSQL 的向量扩展。它让 PostgreSQL 能够保存向量，并执行向量距离计算和近似最近邻搜索。

Supabase 的核心数据库是 PostgreSQL，因此可以启用 `pgvector`，把业务数据、文本元数据和向量放在同一个数据库中。对于中小型 RAG 项目，这是很实用的起点。

启用扩展：

```sql
create extension if not exists vector with schema extensions;
```

建立独立的 RAG Schema 和数据表：

```sql
create schema if not exists rag;

create table rag.documents (
  id uuid primary key,
  title text not null,
  source_url text,
  created_at timestamptz not null default now()
);

create table rag.chunks (
  id uuid primary key,
  document_id uuid not null references rag.documents(id) on delete cascade,
  content text not null,
  city text,
  category text,
  page_index integer,
  embedding extensions.vector(1536),
  created_at timestamptz not null default now()
);
```

`1536` 必须与所选 Embedding 模型的输出维度一致，不能随意填写。数据量增加后，可以为向量列建立 HNSW 索引：

```sql
create index rag_chunks_embedding_hnsw_idx
on rag.chunks
using hnsw (embedding vector_cosine_ops);
```

本地或服务端程序负责调用嵌入模型生成向量，再写入 Supabase。查询时，程序把用户问题也生成向量，然后在 PostgreSQL 中执行相似度搜索。

如果客户端是移动 App，不应该把 Supabase `service_role` 密钥或模型密钥放进客户端。可以使用 Python + FastAPI 作为 RAG 服务，由服务端连接 Supabase、调用 Embedding/LLM，并对外提供受控 API。

## 8、旅行知识库可以放什么

旅行 RAG 不应一开始就追求“全国所有城市”。更适合先选约 10 个有代表性的城市，用少量高质量资料跑通完整链路。

知识库可以包含：

- 城市旅行包：城市概况、区域特点、适合季节和常见路线。
- POI 资料：景点特色、适合人群、建议游玩时长、预约要求。
- 行程模板：一日游、周末游、亲子游、老人友好、低预算等。
- 交通知识：机场和车站到市区、区域间通勤、路线安排经验。
- 季节与天气经验：雨天替代方案、夏季避暑、冬季注意事项。
- 预算参考：住宿、餐饮、门票和市内交通的大致区间。
- 用户私有资料：收藏、旅行笔记和偏好，但需要单独设计权限与隐私边界。
- 来源元数据：标题、URL、发布日期、抓取时间、页码和可信度。
- 评测数据：标准问题、期望命中的资料、关键答案点和引用要求。

第一版可以控制为 10 个城市、30 至 50 份文档、3 至 5 类知识，以及 20 至 50 个评测问题。范围小一些，反而更容易真正理解并优化 RAG 的每个环节。

## 9、WayLog 中哪些功能适合使用 RAG

适合使用 RAG 的共同特征是：回答需要外部领域知识、动态信息或可引用依据。

可以使用 RAG 的场景包括：

- 根据城市、天数、预算和偏好生成旅行草案。
- 优化已有行程，发现路线绕行、安排过满或景点组合不合理。
- 推荐景点、餐厅、区域和雨天替代方案。
- 解释为什么这样安排行程，并附上依据。
- 检查老人友好、亲子友好、季节性和天气风险。
- 填补行程空档，生成备选安排。
- 将知识库与天气、地图路线等实时 API 结合。

不需要 RAG 的场景包括：

- 将某个安排移动到第二天。
- 修改备注、删除地点或调整排序。
- 统计当前 Trip 有多少天、多少个地点。
- 展示确认、撤销和应用提案等交互状态。
- 只依赖当前 Trip 数据就能完成的确定性计算。

一个简单的判断标准是：如果答案需要“查外部资料并给依据”，使用 RAG；如果只是在操作当前 App 状态或执行确定性规则，就不需要 RAG。

在 WayLog 当前产品边界下，RAG 更适合作为仓库中的隔离实验项目，而不是直接并入现有移动端核心链路。可以将代码放在类似 `labs/travel-rag/` 的目录中，用独立 FastAPI 服务和 `rag` 数据库 Schema，避免破坏 Trip 的本地优先写入与 Agent 提案确认机制。

## 10、从原始 RAG 到 Advanced RAG

基础 RAG 通常只是“切块、向量化、检索、生成”。Advanced RAG 会针对每个薄弱环节增加优化能力：

- Query Rewrite：将模糊问题改写成更适合搜索的查询。
- Multi-Query：从不同角度生成多个查询，提高召回率。
- Metadata Filter：先按城市、时间、分类、权限等条件过滤。
- Hybrid Search：融合关键词搜索与向量搜索。
- Rerank：用更精确的模型对候选片段重新排序。
- Context Compression：只保留片段中真正相关的句子，降低噪声。
- Parent-Child Retrieval：小块负责召回，大块负责提供完整上下文。
- Citation Grounding：让答案中的结论与具体来源片段对应。
- Evaluation：分别评估检索命中率、答案正确性、忠实度和引用质量。

这些能力通常比一开始上复杂 Agent 更值得优先实现，因为它们直接改善基础检索质量。

## 11、Agentic RAG

Agentic RAG 是把 Agent 的决策能力加入 RAG 流程。普通 RAG 的流程通常固定，而 Agentic RAG 会让模型根据问题决定：

- 是否需要检索。
- 应该查知识库、SQL、图数据库还是外部 API。
- 如何拆分问题和改写查询。
- 当前资料是否充分，是否需要再次检索。
- 是否需要调用天气、地图或其他工具补充信息。
- 最终应该回答，还是明确说明证据不足。

一个旅行 Agentic RAG 流程可能是：

```text
用户提出旅行需求
  -> 判断是否需要外部知识
  -> 提取城市、日期、预算和同行人
  -> 分别检索景点、交通和季节资料
  -> 调用天气或地图 API
  -> 检查资料是否充分
  -> 必要时补充检索
  -> 生成带来源的旅行建议或 AgentProposal
```

Agentic RAG 更适合多条件、多步骤、需要多种数据源的问题，但它也会增加延迟、模型调用成本、调试难度和不可预测性。第一版不必追求全自动，可以先做“轻量 Agentic RAG”：只允许系统在有限工具中选择检索路线、生成少量查询，并判断是否需要补充检索。

在 WayLog 中，即使 Agent 使用 RAG 得到了资料，它仍然只能生成结构化 `AgentProposal`。对 Trip 的真实修改仍然必须经过客户端运行时校验、用户确认或明确授权，并走本地优先存储和云同步链路。

## 12、其他进阶 RAG 方向

### Self-RAG

模型不仅检索，还会判断何时需要检索，并对检索证据和生成内容进行自我检查。

### Corrective RAG（CRAG）

系统先评估检索结果质量。如果结果不可靠，就触发查询改写、补充检索或其他纠正流程。

### Adaptive RAG

根据问题复杂度选择不同策略：简单问题不检索，一般问题执行单次检索，复杂问题执行多步检索。

### Hierarchical RAG / RAPTOR

将长文档组织成分层摘要或树结构，使系统既能检索局部细节，也能处理跨章节的全局问题。

### GraphRAG

先抽取实体和关系形成图，再结合图结构与文本资料回答。它更适合多跳关系、全局主题和复杂实体网络，但数据构建和维护成本也更高。

### PageIndex 类方案

一些方案强调保留文档的页面、章节和树状目录，让模型沿结构定位信息，而不完全依赖扁平向量召回。它们适合结构清晰的长文档，但并不意味着向量检索已经失效。对于第一版旅行 RAG，只需先保留 `page_index`、标题和章节等元数据，不必立即引入复杂树索引。

## 13、建议的实操学习路线

### 第一阶段：跑通原始 RAG

```text
文档 -> Chunk -> Embedding -> pgvector -> 检索 -> Prompt -> 回答与引用
```

重点不是框架调用，而是亲手理解数据如何进入系统、检索结果为什么命中或漏掉。

### 第二阶段：改善检索质量

加入元数据过滤、全文搜索、混合检索、重排、引用和基础评测。记录失败案例，并根据评测结果调整切块、查询和索引。

### 第三阶段：轻量 Agentic RAG

让系统判断是否需要检索、选择数据源、改写查询，并在证据不足时补充检索。工具和循环次数要有明确边界。

### 第四阶段：按实际问题选择高级方案

只有当长文档层级、多跳关系或全局总结确实成为瓶颈时，再考虑 Hierarchical RAG、GraphRAG 或 PageIndex 类方案。

## 14、常见误区

### 误区一：RAG 就是向量数据库

向量数据库只是可能使用的基础设施。RAG 的核心是如何取得证据并增强生成，检索来源可以是搜索引擎、SQL、API 或图数据库。

### 误区二：接上知识库就不会幻觉

资料可能检索错误，模型也可能脱离资料发挥。必须加入引用、忠实度约束和评测。

### 误区三：召回越多越好

过多资料会增加噪声、Token 成本和模型判断难度。真正目标是提供少量、相关、互补且可信的证据。

### 误区四：切块参数可以照抄

最佳块大小取决于文档结构、语言、问题类型和嵌入模型。经验值只能作为起点，最终必须通过评测调整。

### 误区五：用了 LangChain 等框架就掌握了 RAG

框架可以简化连接组件，但真正的能力在于理解数据质量、检索失败原因、评测指标、权限隔离和线上可观测性。

## 15、一句话总结

RAG 不是“给大模型接一个向量数据库”，而是建立一条可检索、可验证、可更新的外部知识链路，让模型在需要时带着相关证据回答；Agentic RAG 则进一步让 Agent 决定何时查、查什么、资料是否够，以及是否需要继续行动。

## 参考资料

- [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401)
- [Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks](https://arxiv.org/abs/1908.10084)
- [Supabase Docs: pgvector](https://supabase.com/docs/guides/database/extensions/pgvector)
- [PostgreSQL: Full Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [Elasticsearch: BM25](https://www.elastic.co/guide/en/elasticsearch/reference/current/index-modules-similarity.html)
- [Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection](https://arxiv.org/abs/2310.11511)
- [Corrective Retrieval Augmented Generation](https://arxiv.org/abs/2401.15884)
- [Adaptive-RAG: Learning to Adapt Retrieval-Augmented Large Language Models through Question Complexity](https://arxiv.org/abs/2403.14403)
- [RAPTOR: Recursive Abstractive Processing for Tree-Organized Retrieval](https://arxiv.org/abs/2401.18059)
- [From Local to Global: A Graph RAG Approach to Query-Focused Summarization](https://arxiv.org/abs/2404.16130)
