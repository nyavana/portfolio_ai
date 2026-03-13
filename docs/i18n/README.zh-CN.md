# Portfolio AI Assistant

**语言：** [English](../../README.md) | 简体中文

[![Docker Image](https://img.shields.io/docker/v/ggdxwz/portfolio-ai/latest?label=image)](https://hub.docker.com/r/ggdxwz/portfolio-ai) [![Build and push Docker image](https://github.com/nyavana/portfolio_ai/actions/workflows/docker-publish.yml/badge.svg?branch=main)](https://github.com/nyavana/portfolio_ai/actions/workflows/docker-publish.yml) [![Python 3.12](https://img.shields.io/badge/python-3.12-blue)](https://www.python.org/downloads/release/python-3120/) [![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/nyavana/portfolio_ai)

这是一个基于 RAG 的金融投资组合助手，使用 FastAPI、ChromaDB 和兼容 OpenAI 的 LLM 构建，并提供采用 “Dark Terminal Editorial” 风格的 React 前端。

![实时用例演示](../images/Portfolio_AI_Front.png)

该项目展示了一个用于投资组合分析、风险审查和交互式金融问答的金融 AI 助手。

## 概览

该应用结合了 React 前端、FastAPI 后端、基于 ChromaDB 的 filings 与新闻检索，以及兼容 OpenAI 的 LLM API。

- 前端：Dashboard、Risk Flags、News、Chat、Upload 和 Status 页面
- 后端：投资组合摘要、风险标记分析、新闻影响分析、上传和统一问答
- 检索：`chroma_news` 用于新闻，`chroma_filings` 用于 SEC 风格的 filing 内容
- 部署方式：Docker、本地开发，以及基于 SLURM 的 HPC 部署

### 产品视图

<p align="center"><img src="../images/Portfolio%20AI%20Summery.png" alt="项目摘要" width="100%"><img src="../images/Portfolio%20AI%20Overview%20and%20Risk.png" alt="投资组合总览与风险分析" width="100%"><img src="../images/Portfolio%20AI%20Q%26A.png" alt="金融问答" width="100%"></p>

## 快速开始

Docker 是运行该项目的首选方式。

### 方式 1：本地构建

```bash
docker build -t portfolio-ai .

docker run -p 8000:8000 \
  -e LMDEPLOY_API_KEY=sk-...your-key... \
  -e LMDEPLOY_BASE_URL=https://api.openai.com/v1 \
  -e LMDEPLOY_MODEL=gpt-5.3-chat-latest \
  portfolio-ai
```

### 方式 2：从 Docker Hub 拉取

```bash
docker pull ggdxwz/portfolio-ai:latest

docker run -p 8000:8000 \
  -e LMDEPLOY_API_KEY=sk-...your-key... \
  -e LMDEPLOY_BASE_URL=https://api.openai.com/v1 \
  -e LMDEPLOY_MODEL=gpt-5.3-chat-latest \
  ggdxwz/portfolio-ai:latest
```

应用可通过以下地址访问：

- `http://localhost:8000`：前端 UI
- `http://localhost:8000/docs`：API 文档

如果希望在容器重启后保留 ChromaDB 数据，请挂载 `DATA/`：

```bash
docker run -p 8000:8000 \
  -e LMDEPLOY_API_KEY=sk-... \
  -v $(pwd)/DATA:/app/DATA \
  portfolio-ai
```

如需查看 Docker 相关的更多细节，包括在宿主机上使用 Ollama 和已发布镜像标签，请参见 [Docker 部署](#docker-部署)。

## 前置要求

### Docker 快速开始

- Docker
- OpenAI API key，或其他兼容 OpenAI 的 LLM 端点

### 本地开发

- Python 3.12（`/usr/bin/python3.12`）
- Node.js 18+（已在 v25.8 上验证）
- OpenAI API key 或本地 Ollama 服务

## 本地开发设置

如果你希望在开发时分别运行后端和前端，请使用这一方式。

### 1. 创建虚拟环境

```bash
# 在 Debian/Ubuntu 上，python3.12-venv 可能不包含 ensurepip；
# 如有需要，请手动引导安装 pip
python3.12 -m venv --without-pip .venv
curl -sS https://bootstrap.pypa.io/get-pip.py | .venv/bin/python3.12
```

如果 `ensurepip` 可用：

```bash
python3.12 -m venv .venv
```

### 2. 安装后端依赖

```bash
.venv/bin/pip install -r requirements.txt
```

### 3. 配置环境变量

```bash
cp .env.example .env.local
# 编辑 .env.local，填入 LMDEPLOY_API_KEY
```

`.env.local` 控制以下配置：

| 变量 | 默认值 | 用途 |
|---|---|---|
| `LMDEPLOY_BASE_URL` | `https://api.openai.com/v1` | LLM API 端点 |
| `LMDEPLOY_MODEL` | `gpt-5.3-chat-latest` | 模型名称 |
| `LMDEPLOY_API_KEY` | *(empty)* | API key，LLM 调用必填 |
| `HF_HOME` | `DATA/hf_home` | HuggingFace 模型缓存 |
| `TOKENIZERS_PARALLELISM` | `false` | 抑制 tokenizer 警告 |
| `PROJECT_DIR` | *(auto: repo root)* | 覆盖数据目录根路径 |

### 4. 初始化 filings 向量数据库

`chroma_news` 已预先填充。`chroma_filings` 需要通过 mock 文件初始化：

```bash
bash scripts/bootstrap_filings.sh
```

这会索引 `DATA/uploads/filings/filing_apple_q_mock.txt` 和 `filing_nvidia_q_mock.txt`。
`all-MiniLM-L6-v2` 嵌入模型（约 22 MB）会在首次运行时下载，并缓存到 `HF_HOME`。

### 5. 启动后端

```bash
bash run_api.sh
```

API 文档地址为 `http://127.0.0.1:8000/docs`。

### 6. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端运行在 `http://localhost:5173`，并要求后端运行在 `8000` 端口。
你可以通过 `frontend/.env.local` 中的 `VITE_API_BASE_URL` 覆盖 API 地址。

### 可选：使用 Ollama 替代托管 API

```bash
ollama pull llama3.2:3b
# 在 .env.local 中：
# LMDEPLOY_BASE_URL=http://127.0.0.1:11434/v1
# LMDEPLOY_MODEL=llama3.2:3b
# LMDEPLOY_API_KEY=ollama
```

### OpenAI SDK 兼容性

项目使用 `openai==2.26.0`。与 GPT-4 相比，较新的前沿模型（GPT-5 及以上）有两个参数发生了变化：

| 参数 | 旧版（GPT-4） | 新版（GPT-5+） |
|---|---|---|
| Token 上限 | `max_tokens` | `max_completion_tokens` |
| 采样参数 | `temperature=0.2` | 不支持，需完全省略 |

`core/lmdeploy_client.py` 已经使用 `max_completion_tokens` 并省略了 `temperature`。
通过 LMDeploy 部署的 HPC LLaMA 不受影响，因为它会忽略未知参数。

## 验证

### 冒烟测试

```bash
# 健康检查
curl -s http://127.0.0.1:8000/health | python3 -m json.tool

# 完整 LLM 往返测试：通过请求头传入 key（会覆盖环境变量）
curl -s -X POST http://127.0.0.1:8000/ask \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: sk-...your-key..." \
  -d '{"question": "What are the risk factors in the Apple filing?"}' \
  | python3 -m json.tool

# 或者在 .env.local 中设置 LMDEPLOY_API_KEY，并省略该请求头
```

## API 参考

完整的请求/响应 schema 和 TypeScript 类型见 `../api/portfolio_ai_frontend_mock_api.md`。

### CORS

后端允许来自 `http://localhost:5173` 和 `http://127.0.0.1:5173` 的跨域请求，这一配置位于 `app/api_server.py` 的 `CORSMiddleware` 中。如果部署到其他前端主机，请扩展 `allow_origins`。

### 按请求覆盖 LLM 的请求头

每个依赖 LLM 的端点（`/portfolio_summary`、`/risk_flags`、`/news_impact`、`/ask`）都会读取三个可选请求头，并优先使用它们而不是服务端环境变量：

| 请求头 | 覆盖项 | 示例 |
|---|---|---|
| `X-Api-Key` | `LMDEPLOY_API_KEY` | `sk-abc...` |
| `X-Api-Base-Url` | `LMDEPLOY_BASE_URL` | `https://api.openai.com/v1` |
| `X-Api-Model` | `LMDEPLOY_MODEL` | `gpt-4o` |

这也是 UI 中设置弹窗在无需重启服务器的情况下向后端注入用户配置 key 的方式。如果某个请求头缺失，则继续使用服务端默认值。

### 端点快速参考

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/status` | 服务状态和路由列表（Docker）/ 开发环境下为 `/` |
| `GET` | `/health` | LLM 连通性检查 |
| `GET` | `/config/llm` | 当前 LLM 配置（带掩码的 key 提示） |
| `POST` | `/config/llm` | 在运行时替换服务端 LLM 配置 |
| `GET` | `/portfolio_summary` | 结构化摘要 + LLM 叙述 |
| `GET` | `/risk_flags` | 基于规则的标记 + LLM 解释 |
| `GET` | `/news_impact` | 与持仓匹配的新闻 + LLM 摘要 |
| `POST` | `/ask` | 统一问答，路由到上述能力或 RAG（Financial Q&A） |
| `POST` | `/upload/filing` | 上传并索引 filing 文档 |
| `POST` | `/upload/news` | 上传并索引 news 文档 |

## 架构

```text
┌─────────────────────────────────────────────────────────┐
│           React Frontend (Vite, port 5173)             │
│  Dashboard · Risk Flags · News · Chat · Upload · Status│
└────────────────────────┬────────────────────────────────┘
                         │ fetch (CORS enabled)
┌────────────────────────▼────────────────────────────────┐
│                   FastAPI (port 8000)                  │
│  GET /portfolio_summary  GET /risk_flags               │
│  GET /news_impact        POST /ask                     │
│  POST /upload/filing     POST /upload/news             │
└────────────────────────┬────────────────────────────────┘
                         │
           ┌─────────────┼─────────────┐
           ▼             ▼             ▼
     ChromaDB        ChromaDB      OpenAI-compatible
   (chroma_news)  (chroma_filings)   LLM API
   5 news docs     2 filing docs   gpt-5.3-chat-latest (local)
                                   LLaMA (HPC)
```

### 后端模块

| 路径 | 用途 |
|---|---|
| `app/api_server.py` | FastAPI 路由和 CORS 中间件 |
| `app/config.py` | 基于环境变量的配置（无硬编码路径） |
| `core/lmdeploy_client.py` | 兼容 OpenAI 的 LLM 客户端 |
| `core/router.py` | 查询意图分类 |
| `rag/filings_retriever.py` | 面向 SEC 文件的 ChromaDB 检索 |
| `rag/news_retriever.py` | 面向新闻的 ChromaDB 检索 |
| `services/` | 投资组合摘要、风险标记、新闻影响、问答 |
| `ingest/` | 分块与索引流水线 |
| `data/` | 数据加载工具 |

### 前端模块

| 路径 | 用途 |
|---|---|
| `frontend/src/api/` | 7 个端点对应的类型化 fetch 封装 |
| `frontend/src/pages/` | Dashboard、RiskFlags、NewsImpact、Chat、Upload、Status |
| `frontend/src/components/` | 布局外壳、AiCard、图表、通用 UI |
| `frontend/src/hooks/` | `useApi`（通用 GET）、`useChatHistory`（本地聊天状态） |
| `frontend/src/styles/` | CSS 设计令牌、动画、全局重置 |
| `frontend/src/types/api.ts` | 与后端契约对应的 TypeScript 接口 |

## 数据目录结构

```text
DATA/
├── portfolio/
│   └── demo_portfolio.json        # 3 个持仓：AAPL、NVDA、JPM + 12k 美元现金
├── news/
│   └── demo_news.json             # 3 条 AAPL、NVDA、JPM 相关新闻
├── filings/
│   └── financial_reports_sec_small_lite/   # HuggingFace 数据集（可选）
├── uploads/
│   ├── filings/                   # 通过 API 上传的 filing .txt 文件
│   └── news/                      # 通过 API 上传的 news .txt 文件
├── processed/
│   ├── filings/
│   └── news/
├── chroma_news/                   # ChromaDB：5 个文档（预填充）
├── chroma_filings/                # ChromaDB：2 个文档（已初始化）
└── hf_home/                       # HuggingFace 模型缓存
```

## Docker 部署

仓库包含一个多阶段 `Dockerfile`，可在单个容器中构建 React 前端并运行 FastAPI 后端。无需额外的 Web 服务器。FastAPI 会直接从 `frontend/dist/` 提供编译后的前端文件。

### 构建镜像

```bash
docker build -t portfolio-ai .
```

### 运行容器

```bash
docker run -p 8000:8000 \
  -e LMDEPLOY_API_KEY=sk-...your-key... \
  -e LMDEPLOY_BASE_URL=https://api.openai.com/v1 \
  -e LMDEPLOY_MODEL=gpt-5.3-chat-latest \
  portfolio-ai
```

随后可通过 `http://localhost:8000` 访问前端 UI，通过 `http://localhost:8000/docs` 访问 API 文档。

### 工作原理

| 阶段 | 基础镜像 | 作用 |
|---|---|---|
| `frontend-builder` | `node:20-alpine` | 以 `VITE_API_BASE_URL=""` 执行 `npm ci && npm run build` |
| final | `python:3.12-slim` | 安装 Python 依赖，复制后端和 `frontend/dist/`，启动 uvicorn |

在构建时将 `VITE_API_BASE_URL=""` 设为空字符串后，React 应用会调用相对路径，例如 `/portfolio_summary`。浏览器会将这些请求解析到容器自身端口，从而避免 CORS 和跨域问题。

> **注意：** 容器内的 `/` 根端点被重命名为 `/api/status`，以避免与 SPA 的 catch-all 路由冲突；后者需要为所有未匹配路径返回 `index.html`，这是 React Router 所必需的。

### Docker 环境变量

可通过 `-e` 参数或 `.env` 文件（例如 `--env-file .env.local`）传入：

| 变量 | 说明 |
|---|---|
| `LMDEPLOY_API_KEY` | 必填，你的 LLM API key |
| `LMDEPLOY_BASE_URL` | LLM 端点（默认：OpenAI） |
| `LMDEPLOY_MODEL` | 模型名称 |

### 在 Docker 中使用 Ollama

```bash
docker run -p 8000:8000 \
  -e LMDEPLOY_BASE_URL=http://host.docker.internal:11434/v1 \
  -e LMDEPLOY_MODEL=llama3.2:3b \
  -e LMDEPLOY_API_KEY=ollama \
  portfolio-ai
```

### 数据持久化

ChromaDB 数据库存放在容器内的 `/app/DATA/`。如需跨重启保留数据，请挂载卷：

```bash
docker run -p 8000:8000 \
  -e LMDEPLOY_API_KEY=sk-... \
  -v $(pwd)/DATA:/app/DATA \
  portfolio-ai
```

### 从 Docker Hub 拉取镜像

通过 GitHub Actions，每次推送到 `main` 时都会自动发布预构建镜像。你无需克隆仓库，也无需在远程服务器上本地构建：

```bash
docker pull ggdxwz/portfolio-ai:latest

docker run -p 8000:8000 \
  -e LMDEPLOY_API_KEY=sk-...your-key... \
  -e LMDEPLOY_BASE_URL=https://api.openai.com/v1 \
  -e LMDEPLOY_MODEL=gpt-5.3-chat-latest \
  ggdxwz/portfolio-ai:latest
```

如需持久化数据卷：

```bash
docker run -p 8000:8000 \
  -e LMDEPLOY_API_KEY=sk-... \
  -v $(pwd)/DATA:/app/DATA \
  ggdxwz/portfolio-ai:latest
```

每次推送到 `main` 还会基于 Git commit SHA 生成一个固定标签，例如 `ggdxwz/portfolio-ai:abc1234`，便于可复现部署。

## HPC 部署（SLURM）

GPU 集群部署请使用 `api_server.sbatch`。该 sbatch 脚本会导出所有必需的环境变量（`PROJECT_DIR`、`LMDEPLOY_*`），从而覆盖 `app/config.py` 中的本地默认值。无需修改 sbatch 文件。

```bash
sbatch api_server.sbatch
```

该 sbatch 脚本会：

1. 设置 conda 环境（`lmdeploy_env`）
2. 在 `23333` 端口启动 LMDeploy 推理服务
3. 等待 LMDeploy 就绪，最长 15 分钟
4. 在 `8000` 端口启动 FastAPI
5. 在 API 进程退出前保持作业存活

通过本地机器上的 SSH 隧道访问：

```bash
ssh -L 8000:localhost:8000 <hpc-host>
```

## ChromaDB 说明

`chroma_news` SQLite 数据库是使用较旧版本的 chromadb 创建的。如果升级后出现 `KeyError: '_type'`，请修补 `config_json_str` 列：

```python
import chromadb
from chromadb.api.configuration import CollectionConfigurationInternal

cfg = CollectionConfigurationInternal().to_json_str()
# 然后执行：UPDATE collections SET config_json_str = '<cfg>' WHERE name = 'news';
```

项目固定使用 `chromadb==0.6.3`。现有 SQLite schema（migration level 10）与 chromadb 1.x 的重写版本不兼容。
