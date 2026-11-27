---
title: "从本地开发到容器部署的 Web 应用交付"
description: "用一个留言服务演练 Docker 构建、配置注入、数据卷和健康检查，验证换掉容器后旧留言还能读出来。"
pubDate: 2026-11-27
category: "学习笔记"
draft: false
---

第一次部署一个会保存数据的 Web 应用，我最想验证的是这件事：昨天写进去的一条留言，今天把服务升级后还能读出来吗？

用一个虚构的留言板来试。第一版叫「周末留言板」，写入一条「周六见」。后来要改标题，再把接口升级到第二版。更新后标题和版本应该变，留言应该还在。这个实验能测出发布流程有没有把三件事放对地方：程序放进镜像，标题在启动时传入，留言写到独立的数据卷。

## 先让本地跑得起来

下面的示例只用 Node.js 标准库。它有三个入口。浏览器打开 `/` 可以看标题、版本和留言。用 `POST /notes` 写入固定的一条教学留言。`/healthz` 供容器检查服务是否响应，以及留言文件是否具备基本的读写权限。

在一个新目录里保存 `server.mjs`。示例只运行一个进程，文件写入量很小。

```js
import { createServer } from "node:http";
import { accessSync, appendFileSync, constants, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const port = 3000;
const host = process.env.HOST ?? "127.0.0.1";
const title = process.env.BOARD_TITLE ?? "周末留言板";
const version = "v1";
const dataDir = process.env.DATA_DIR ?? "./data";
const notes = join(dataDir, "notes.txt");

mkdirSync(dataDir, { recursive: true });
appendFileSync(notes, "");

createServer((request, response) => {
  response.setHeader("Content-Type", "text/plain; charset=utf-8");

  try {
    if (request.method === "GET" && request.url === "/healthz") {
      accessSync(notes, constants.R_OK | constants.W_OK);
      response.end("ok\n");
    } else if (request.method === "GET" && request.url === "/") {
      response.end(`${title} (${version})\n${readFileSync(notes, "utf8")}`);
    } else if (request.method === "POST" && request.url === "/notes") {
      appendFileSync(notes, "周六见\n");
      response.writeHead(201).end("已保存\n");
    } else {
      response.writeHead(404).end("找不到这个入口\n");
    }
  } catch (error) {
    console.error("留言文件操作失败", error.code);
    response.writeHead(503).end("留言暂时不可用\n");
  }
}).listen(port, host);
```

用 Node.js 24 运行 `node server.mjs`，访问 `http://127.0.0.1:3000/`，会看到「周末留言板 (v1)」。这会在当前目录创建 `data/notes.txt`。试完按 Ctrl+C 停止，再进行容器实验。两次实验各有自己的数据目录，容器会从空留言板开始。

## 镜像里装程序，构建时只重做变了的部分

镜像把 Node.js、程序和启动命令打包起来。用这个镜像启动一次，就会得到一个容器。建新容器时，宿主机只需安装 Docker，无需为这个服务单独装 Node.js。在同一目录保存 `Dockerfile`。

```dockerfile
FROM node:24-bookworm-slim
WORKDIR /app
RUN mkdir /app/data && touch /app/data/notes.txt && chown -R node:node /app/data
COPY server.mjs ./
ENV HOST=0.0.0.0 DATA_DIR=/app/data
USER node
HEALTHCHECK --interval=3s --timeout=2s --start-period=5s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/healthz').then(r => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
CMD ["node", "server.mjs"]
```

这里 `COPY` 只取 `server.mjs`。如果项目以后改用 `COPY . .`，先用 `.dockerignore` 排除本地的 `data/`、`node_modules/` 和环境文件，免得把开发机的内容带进构建上下文。镜像里的空留言文件由运行用户 `node` 持有，稍后挂载一个全新的空卷时，Docker 默认会把目录中的初始内容复制进去。已有卷挂上来时，容器看到的是卷内原有的文件。[Docker 构建上下文](https://docs.docker.com/build/concepts/context/)、[Docker 数据卷](https://docs.docker.com/engine/storage/volumes/#mounting-a-volume-over-existing-data)

等后面把 `server.mjs` 的版本号改为 v2，再用同一个构建器构建时，可以观察哪些步骤会重新执行。基础镜像相同且缓存仍在时，`RUN mkdir …` 可以复用，`COPY server.mjs` 会因为文件内容变了而重做。这个服务准备目录只需一条命令，在实际项目里，省下来的往往是整次依赖安装。

比如给一个需要生产依赖的 Node.js 应用打包，可以先 `COPY package.json package-lock.json ./`，再 `RUN npm ci --omit=dev`，最后复制业务代码。改业务代码时还能复用依赖层。改了锁文件则会重跑安装以及受影响的后续步骤。如果项目还需要编译前端，编译阶段通常还要装开发依赖，再把编译产物交给运行阶段。[Docker 缓存失效规则](https://docs.docker.com/build/cache/invalidation/)、[npm ci](https://docs.npmjs.com/cli/commands/npm-ci)、[Docker 多阶段构建](https://docs.docker.com/build/building/multi-stage/)

## 启动时给标题，给留言一个能重挂的卷

在同一目录保存 `compose.yaml`。Compose 把镜像、端口、启动配置和数据卷记在一起，第二次发布时可以沿用同一套定义。

```yaml
services:
  web:
    build: .
    image: noticeboard-demo:local
    environment:
      BOARD_TITLE: "${BOARD_TITLE:-周末留言板}"
    ports:
      - "127.0.0.1:3000:3000"
    volumes:
      - notes:/app/data

volumes:
  notes:
```

`HOST=0.0.0.0` 让程序在容器内监听可接收转发的地址。`127.0.0.1:3000:3000` 则把宿主机上的访问入口限定在本机。容器里能访问 `127.0.0.1:3000`，只能说明容器内的服务在响应。宿主机能不能访问，还要单独用 `curl` 验证端口映射。[Docker 端口发布](https://docs.docker.com/engine/network/port-publishing/)

标题由 Compose 从宿主环境取值，再通过 `environment` 传给容器。也可以在项目的 `.env` 里为这里的变量替换提供默认值。改了标题要通过 `docker compose up` 应用新配置，正在运行的进程不会自己读到新值。密码之类的秘密可以用 Compose secrets 按服务挂载为文件，应用再从约定的路径读取。[Compose 变量替换](https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/)、[Compose secrets](https://docs.docker.com/compose/how-tos/use-secrets/)

数据卷的作用要用「换容器」来检验。普通重启仍沿用同一个容器，留在容器可写层的文件也可能还在，容易产生已经做了持久化的错觉。用新镜像替换容器时，新的可写层从镜像开始，独立的 `notes` 卷仍能挂到 `/app/data`。卷让数据留在这台 Docker 主机上。迁机器和磁盘损坏后的恢复还需要备份，以及一次实际的恢复演练。[Docker 数据卷的生命周期与备份](https://docs.docker.com/engine/storage/volumes/)

## 观察一次真正的容器替换

以下为构造实验的预期结果。需要运行中的 Docker Engine 和支持 `up --wait` 的 Docker Compose，宿主机 3000 端口应空闲。在新建的示例目录中，先启动第一版，再写入一条留言。

```bash
docker compose up -d --build --wait
curl -fsS -X POST http://127.0.0.1:3000/notes
curl -fsS http://127.0.0.1:3000/
docker compose ps -q web
```

页面应读出「周末留言板 (v1)」和「周六见」。记下最后一条命令返回的容器 ID，再只改标题。

```bash
BOARD_TITLE=社区留言板 docker compose up -d --wait
curl -fsS http://127.0.0.1:3000/
docker compose ps -q web
```

此时应读出「社区留言板 (v1)」和同一条留言。容器 ID 应变化，镜像可以沿用。接下来把 `server.mjs` 里的 `v1` 改成 `v2`，再执行一次带构建的发布。

```bash
BOARD_TITLE=社区留言板 docker compose up -d --build --wait
curl -fsS http://127.0.0.1:3000/
docker compose ps -q web
```

预期看到「社区留言板 (v2)」和原来的「周六见」。如果只剩标题和版本号，先查 `docker compose ps` 和 `docker compose logs web`，再用 `docker inspect` 查看当前容器的 `Mounts`。核对应用实际写入的目录、挂载目标，以及升级前后的卷名。比如换了 Compose 项目名，默认可能用上另一个卷，旧留言仍在原卷内。[Compose up](https://docs.docker.com/reference/cli/docker/compose/up/)、[Compose 卷配置](https://docs.docker.com/reference/compose-file/volumes/)

实验结束可用 `docker compose down` 停掉服务，保留命名卷。加上 `-v` 会删除这个 Compose 项目声明的命名卷及附加的匿名卷，正式服务的更新流程应保留持久数据。[Compose down](https://docs.docker.com/reference/cli/docker/compose/down/)

## 健康检查能证明到哪一步？

容器起来后，Docker 定期在容器内部访问 `/healthz`。探针只有在 HTTP 返回成功时才退出 0。服务没监听、请求超时、检查文件权限失败，都有机会从健康状态里看出来。例如进程可能还在运行，但失去了对留言文件的写权限，此时探针会收到 503。启动宽限期允许程序先完成初始化。宽限期内一旦成功过，后续失败就开始计数。连续失败达到阈值后，Docker 会把容器标为 `unhealthy`。[Dockerfile HEALTHCHECK](https://docs.docker.com/reference/dockerfile/#healthcheck)

这个探针只做轻量的检查。文件权限检查通过时，磁盘仍可能已满，真正写入时才会失败。单机 Docker 的健康状态也不会自行重启仍在运行的进程。发布时把 `up --wait` 当作第一道验证，再从宿主机访问真实入口。对这个留言板，我会读取一条升级前就存在的留言，然后在测试实例上写入并读回一条新留言。[Compose up 的等待条件](https://docs.docker.com/reference/cli/docker/compose/up/)、[Docker 重启策略](https://docs.docker.com/engine/containers/start-containers-automatically/)

以后如果留言改存数据库，升级还会涉及表结构。回滚旧镜像前要确认旧程序能读升级后的表，否则切回 `v1`，它也可能打不开留言。验证发布的最后一步，仍是从用户会访问的入口读出那条升级前写进去的记录。
