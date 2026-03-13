# Portfolio AI 前端联调用 Mock API 文档

## 1. 文档目的

这份文档用于让前端同学在后端持续开发期间，先完成：

- 接口封装
- 页面结构搭建
- 上传组件
- 问答页
- 结果展示组件
- 错误提示与 loading 状态

当前以后端现有接口为准，适合作为前端联调的第一版契约。

---

## 2. 服务信息

### 开发环境 Base URL

本地开发（`bash run_api.sh`）：

```text
http://127.0.0.1:8000
```

HPC 部署通过 SSH 转发时（`sbatch api_server.sbatch` + `ssh -L 8000:localhost:8000 <hpc>`）：

```text
http://127.0.0.1:8000
```

> 前端建议把它配置成环境变量，例如：

```ts
const API_BASE_URL = "http://127.0.0.1:8000";
```

### 文档页

```text
GET /docs
```

### OpenAPI

```text
GET /openapi.json
```

---

## 3. 当前可用接口总览

### 基础接口

- `GET /api/status`
- `GET /health`

### 配置接口

- `GET /config/llm`
- `POST /config/llm`

### 业务接口

- `GET /portfolio_summary`
- `GET /risk_flags`
- `GET /news_impact`
- `POST /ask`

### 上传接口

- `POST /upload/filing`
- `POST /upload/news`

---

## 4. 前端建议页面结构

建议前端先做 5 个页面/模块：

1. **系统状态页**
   - 健康检查
   - 模型状态
2. **Portfolio Summary 页**
   - 展示结构化 summary
   - 展示 LLM 自然语言总结
3. **Risk Flags 页**
   - 展示 flags 列表
   - 展示 LLM 风险解释
4. **News Impact 页**
   - 展示每个 ticker 命中的新闻
   - 展示 LLM 对新闻影响的总结
5. **Financial QA / Chat 页**
   - 输入问题
   - 展示 route
   - 展示 answer
   - 可选展示 data
6. **文档上传页**
   - 上传 filing
   - 上传 news
   - 展示上传结果和入库结果

---

## 5. 基础接口定义

## 5.1 `GET /api/status`

### 用途
返回服务状态和可用路由列表。

> **注意：** `/api/status` 是开发环境和 Docker 环境统一使用的状态接口。`/` 在构建后的前端场景下保留给 SPA 入口页面。

### 请求

```http
GET /api/status
```

### 示例响应

```json
{
  "status": "ok",
  "message": "Portfolio AI Assistant is running",
  "routes": [
    "/api/status",
    "/health",
    "/config/llm",
    "/portfolio_summary",
    "/risk_flags",
    "/news_impact",
    "/ask",
    "/upload/filing",
    "/upload/news",
    "/docs"
  ]
}
```

### 前端建议
- 可用于首页卡片展示
- 可用于初始化时确认 API 已经可用

---

## 5.2 `GET /health`

### 用途
返回服务健康状态与当前 LLM 配置。

### 请求

```http
GET /health
```

### 示例响应

```json
{
  “status”: “ok”,
  “lmdeploy_base_url”: “https://api.openai.com/v1”,
  “lmdeploy_model”: “gpt-4o-mini”,
  “api_key_configured”: true
}
```

> **注意：** `api_key_configured` 为 `false` 时，前端 Settings Modal 会强制弹出。`LMDEPLOY_API_KEY=ollama` 时视为未配置（本地 Ollama 不需要 key）。

### 前端建议
- 在页面顶部显示”服务正常 / 异常”
- 可在开发模式下显示模型路径和推理服务地址
- 启动时检查 `api_key_configured`，为 false 则打开 Settings Modal

---

## 5.3 `GET /config/llm`

### 用途
返回当前 LLM 配置（endpoint、model、masked key hint）。

### 请求

```http
GET /config/llm
```

### 示例响应

```json
{
  “base_url”: “https://api.openai.com/v1”,
  “model”: “gpt-4o-mini”,
  “api_key_configured”: true,
  “api_key_hint”: “sk-proj****”
}
```

### TypeScript 类型

```ts
export interface LlmConfigResponse {
  readonly base_url: string;
  readonly model: string;
  readonly api_key_configured: boolean;
  readonly api_key_hint: string;
}
```

---

## 5.4 `POST /config/llm`

### 用途
运行时更新 LLM 配置（无需重启服务）。所有字段均为可选；省略字段保留当前值。

### 请求头

```http
Content-Type: application/json
```

### 请求体

```json
{
  “base_url”: “http://127.0.0.1:11434/v1”,
  “model”: “llama3”,
  “api_key”: “ollama”
}
```

### 请求字段

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| base_url | string | 否 | OpenAI-compatible endpoint URL |
| model | string | 否 | 模型名称 |
| api_key | string | 否 | API 密钥（传入后不会在响应中明文返回） |

### 示例响应

```json
{
  “base_url”: “http://127.0.0.1:11434/v1”,
  “model”: “llama3”,
  “api_key_configured”: false,
  “api_key_hint”: “”
}
```

### TypeScript 类型

```ts
export interface LlmConfigRequest {
  readonly base_url?: string;
  readonly model?: string;
  readonly api_key?: string;
}
```

### 前端建议
- 使用 Settings Modal 调用此接口
- 成功后重新调用 `/health` 确认 `api_key_configured`

---

## 6. 业务接口定义

## 6.1 `GET /portfolio_summary`

### 用途
返回投资组合的结构化摘要和 LLM 总结。

### 请求

```http
GET /portfolio_summary
```

### 示例响应

```json
{
  "summary_data": {
    "portfolio_value": 100000,
    "num_holdings": 4,
    "top_holdings": [
      {
        "ticker": "AAPL",
        "weight": 0.32
      },
      {
        "ticker": "NVDA",
        "weight": 0.28
      },
      {
        "ticker": "MSFT",
        "weight": 0.22
      }
    ],
    "sector_breakdown": {
      "Technology": 0.82,
      "Healthcare": 0.10,
      "Cash": 0.08
    }
  },
  "llm_summary": "The portfolio is concentrated in large-cap technology holdings, with AAPL and NVDA representing the largest positions. The portfolio may benefit from continued AI investment trends, but concentration risk remains meaningful."
}
```

### 前端展示建议
- 左侧：结构化卡片
  - 总市值
  - 持仓数
  - 前三大持仓
  - 行业分布
- 右侧：LLM summary 文本框

### TypeScript 类型建议

```ts
export interface PortfolioSummaryResponse {
  summary_data: {
    portfolio_value?: number;
    num_holdings?: number;
    top_holdings?: Array<{
      ticker: string;
      weight?: number;
    }>;
    sector_breakdown?: Record<string, number>;
    [key: string]: any;
  };
  llm_summary: string;
}
```

---

## 6.2 `GET /risk_flags`

### 用途
返回规则引擎识别出的风险点，以及 LLM 生成的风险解释。

### 请求

```http
GET /risk_flags
```

### 示例响应

```json
{
  "flags": [
    {
      "type": "concentration_risk",
      "ticker": "AAPL",
      "message": "Single-name exposure exceeds threshold."
    },
    {
      "type": "sector_concentration",
      "sector": "Technology",
      "message": "Technology allocation is high relative to diversification target."
    }
  ],
  "llm_risk_summary": "The portfolio shows elevated concentration risk, especially in large-cap technology names. While the current positioning may align with an AI-growth thesis, the portfolio is exposed to drawdowns if sector sentiment weakens or valuation multiples compress."
}
```

### 前端展示建议
- 风险标签列表
- 风险类型徽章
- 风险说明
- 右侧展示 LLM 风险总结

### TypeScript 类型建议

```ts
export interface RiskFlagItem {
  type?: string;
  ticker?: string;
  sector?: string;
  message?: string;
  [key: string]: any;
}

export interface RiskFlagsResponse {
  flags: RiskFlagItem[];
  llm_risk_summary: string;
}
```

---

## 6.3 `GET /news_impact`

### 用途
返回与投资组合相关的新闻匹配结果，以及 LLM 对新闻影响的总结。

### 请求

```http
GET /news_impact
```

### 示例响应

```json
{
  "news_data": [
    {
      "ticker": "NVDA",
      "matched_news": [
        {
          "text": "NVIDIA shares rose after strong AI chip demand.",
          "metadata": {
            "source": "uploaded_news",
            "filename": "news_ai_chip_demand_mock.txt"
          }
        },
        {
          "text": "Investors remain concerned about supply constraints and valuation.",
          "metadata": {
            "source": "uploaded_news",
            "filename": "news_macro_risk_mock.txt"
          }
        }
      ]
    },
    {
      "ticker": "AAPL",
      "matched_news": [
        {
          "text": "Apple continues to increase AI infrastructure spending.",
          "metadata": {
            "source": "uploaded_news"
          }
        }
      ]
    }
  ],
  "llm_news_summary": "Recent news is broadly supportive of AI-related holdings, especially semiconductor exposure, though valuation and supply-chain risk remain key watch items."
}
```

### 前端展示建议
- 按 ticker 分组展示新闻
- 每条新闻展示文本与 metadata
- 底部统一展示 LLM 总结

### TypeScript 类型建议

```ts
export interface NewsDocumentItem {
  text: string;
  metadata?: Record<string, any>;
}

export interface NewsImpactItem {
  ticker: string;
  matched_news: NewsDocumentItem[];
}

export interface NewsImpactResponse {
  news_data: NewsImpactItem[];
  llm_news_summary: string;
}
```

---

## 6.4 `POST /ask`

### 用途
统一问答入口。后端会先做路由分类，再决定走：

- portfolio summary
- risk flags
- news impact
- financial QA / RAG（Financial Q&A，走 ChromaDB 检索）

所有 LLM 请求（含 `qa` / RAG 路由）均优先使用请求头中的 LLM 配置，以覆盖服务端环境变量。

### 请求头

```http
Content-Type: application/json
X-Api-Key: sk-...your-key...          # 可选，覆盖 LMDEPLOY_API_KEY
X-Api-Base-Url: https://...           # 可选，覆盖 LMDEPLOY_BASE_URL
X-Api-Model: gpt-4o                   # 可选，覆盖 LMDEPLOY_MODEL
```

> Settings Modal 会在每次请求时自动注入以上三个头，确保 Financial Q&A 也能正确使用用户配置的 API Key。

### 请求体

```json
{
  "question": "What are the main risk flags in my portfolio?"
}
```

### 请求字段

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| question | string | 是 | 用户问题 |

### 示例响应 1：命中 `portfolio_summary`

```json
{
  "route": "portfolio_summary",
  "answer": "Your portfolio is concentrated in large-cap technology names, with AI-related exposure playing a significant role.",
  "data": {
    "portfolio_value": 100000,
    "num_holdings": 4
  }
}
```

### 示例响应 2：命中 `risk_flags`

```json
{
  "route": "risk_flags",
  "answer": "The portfolio has concentration risk in technology and in a few large single-name positions.",
  "data": [
    {
      "type": "concentration_risk",
      "ticker": "NVDA",
      "message": "Single-name weight is elevated."
    }
  ]
}
```

### 示例响应 3：命中 `news_impact`

```json
{
  "route": "news_impact",
  "answer": "Recent news is supportive for semiconductor exposure but highlights valuation and supply constraints.",
  "data": [
    {
      "ticker": "NVDA",
      "matched_news": [
        {
          "text": "NVIDIA shares rose after strong AI chip demand.",
          "metadata": {
            "source": "uploaded_news"
          }
        }
      ]
    }
  ]
}
```

### 示例响应 4：命中 `qa` / RAG

```json
{
  "route": "qa",
  "answer": "The uploaded filings mention margin pressure, higher AI infrastructure spending, and macro uncertainty as near-term risks.",
  "contexts": [
    {
      "text": "Management warned about margin pressure and macro uncertainty.",
      "metadata": {
        "filename": "filing_apple_q_mock.txt"
      }
    }
  ]
}
```

### 前端展示建议
- 左侧输入框
- 中部消息区
- 显示 `route`
- 显示 `answer`
- 可折叠显示 `data` / `contexts`

### TypeScript 类型建议

```ts
export interface AskRequest {
  question: string;
}

export interface AskResponse {
  route: string;
  answer: string;
  data?: any;
  contexts?: Array<{
    text?: string;
    metadata?: Record<string, any>;
  }>;
  [key: string]: any;
}
```

---

## 7. 上传接口定义

## 7.1 `POST /upload/filing`

### 用途
上传 filing 文档，并触发单文件增量入库。

### 请求类型

```http
multipart/form-data
```

### 表单字段

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| file | File | 是 | 上传的 filing 文件 |

### cURL 示例

```bash
curl -X POST "http://127.0.0.1:8000/upload/filing" \
  -F "file=@/path/to/filing_apple_q_mock.txt"
```

### 示例响应

```json
{
  "status": "ok",
  "saved_to": "/path/to/portfolio_ai/DATA/uploads/filings/filing_apple_q_mock.txt",
  "index_result": {
    "status": "ok",
    "file": "DATA/uploads/filings/filing_apple_q_mock.txt",
    "source_file": "filing_apple_q_mock.txt",
    "chunks_indexed": 1,
    "rows_parsed": 1,
    "collection": "financial_reports"
  }
}
```

### 前端建议
- 上传成功后弹 toast
- 展示保存路径和 index_result
- 支持文件名、进度、状态提示

### TypeScript 类型建议

```ts
export interface UploadResponse {
  status: string;
  saved_to: string;
  index_result?: any;
}
```

---

## 7.2 `POST /upload/news`

### 用途
上传 news 文档，并触发单文件增量入库。

### 请求类型

```http
multipart/form-data
```

### 表单字段

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| file | File | 是 | 上传的 news 文件 |

### cURL 示例

```bash
curl -X POST "http://127.0.0.1:8000/upload/news" \
  -F "file=@/path/to/news_ai_chip_demand_mock.txt"
```

### 示例响应

```json
{
  "status": "ok",
  "saved_to": "/path/to/portfolio_ai/DATA/uploads/news/news_ai_chip_demand_mock.txt",
  "index_result": {
    "status": "ok",
    "file": "DATA/uploads/news/news_ai_chip_demand_mock.txt",
    "source_file": "news_ai_chip_demand_mock.txt",
    "chunks_indexed": 1,
    "rows_parsed": 1,
    "collection": "news"
  }
}
```

---

## 8. 错误响应约定

当前后端如果报错，FastAPI 可能返回：

```json
{
  "detail": "error message"
}
```

### 常见情况

#### 404

```json
{
  "detail": "Not Found"
}
```

#### 500

```json
{
  "detail": "failed to index filing: ..."
}
```

### 前端建议
- 统一错误拦截
- 优先显示 `detail`
- 上传失败和问答失败要有 toast / alert

---

## 9. 前端接口封装建议

建议拆成：

- `api/system.ts` — `/health`, `/`
- `api/config.ts` — `/config/llm` (GET + POST)
- `api/portfolio.ts`
- `api/risk.ts`
- `api/news.ts`
- `api/chat.ts`
- `api/upload.ts`

### 示例封装

```ts
const API_BASE_URL = "http://127.0.0.1:8000";

export async function getPortfolioSummary() {
  const res = await fetch(`${API_BASE_URL}/portfolio_summary`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function askQuestion(question: string, apiKey?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) headers["X-Api-Key"] = apiKey;

  const res = await fetch(`${API_BASE_URL}/ask`, {
    method: "POST",
    headers,
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function uploadFiling(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/upload/filing`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
```

---

## 10. 推荐联调顺序

建议前端按以下顺序联调：

1. `GET /health` → 检查 `api_key_configured`
2. `GET /config/llm` + `POST /config/llm` → Settings Modal 预填 & 保存
3. `GET /portfolio_summary`
3. `GET /risk_flags`
4. `GET /news_impact`
5. `POST /ask`
6. `POST /upload/filing`
7. `POST /upload/news`
8. 上传后再次测试 `POST /ask`

---

## 11. 前端已知注意事项

1. 当前部分接口返回字段可能随着后端业务逻辑继续迭代略有扩展，但建议尽量保持兼容。
2. `data` 字段在不同 route 下结构可能不同，前端需要做兜底处理。
3. 上传接口当前推荐只支持 `.txt`、`.md`、`.json`、`.pdf` 等文档类文件。
4. 业务接口目前以同步请求为主，LLM 响应可能需要几秒钟，前端要展示 loading。
5. 当前问答接口是单轮问答，不是多轮会话；前端如果做聊天 UI，可以先本地保存消息历史，但每次只发送当前问题。

---

## 12. 建议的前端状态字段

### 通用状态

```ts
interface RequestState<T> {
  loading: boolean;
  error: string | null;
  data: T | null;
}
```

### 上传状态

```ts
interface UploadState {
  uploading: boolean;
  progress?: number;
  error: string | null;
  result: UploadResponse | null;
}
```

---

## 13. 结论

前端可以基于这份文档先完成以下功能：

- 系统状态页
- Portfolio summary 展示
- Risk flags 展示
- News impact 展示
- 单轮问答页
- Filing / News 上传页

后端后续若新增接口，建议继续沿用相同风格扩展。
