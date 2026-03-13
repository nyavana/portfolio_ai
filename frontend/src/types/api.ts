/* ═══════════════════════════════════════════════
   Portfolio AI — API Type Definitions
   Mirrors the backend response contracts
   ═══════════════════════════════════════════════ */

// ── Generic request state ──
export interface RequestState<T> {
  readonly loading: boolean;
  readonly error: string | null;
  readonly data: T | null;
}

// ── System ──
export interface StatusResponse {
  readonly status: string;
  readonly message: string;
  readonly routes: readonly string[];
}

export interface HealthResponse {
  readonly status: string;
  readonly lmdeploy_base_url: string;
  readonly lmdeploy_model: string;
  readonly api_key_configured: boolean;
}

// ── Portfolio Summary ──
export interface Holding {
  readonly ticker: string;
  readonly name: string;
  readonly quantity: number;
  readonly avg_cost: number;
  readonly price: number;
  readonly sector: string;
  readonly asset_class: string;
  readonly market_value?: number;
  readonly cost_value?: number;
  readonly unrealized_pnl?: number;
  readonly weight?: number;
}

export interface PortfolioSummaryData {
  readonly user_id?: string;
  readonly as_of_date?: string;
  readonly cash?: number;
  readonly total_value?: number;
  readonly portfolio_value?: number;
  readonly num_holdings?: number;
  readonly top_holdings?: readonly Holding[];
  readonly sector_exposure?: Record<string, number>;
  readonly asset_class_exposure?: Record<string, number>;
  readonly holdings?: readonly Holding[];
  readonly [key: string]: unknown;
}

export interface PortfolioSummaryResponse {
  readonly summary_data: PortfolioSummaryData;
  readonly llm_summary: string;
}

// ── Risk Flags ──
export interface RiskFlagItem {
  readonly type: string;
  readonly severity?: string;
  readonly ticker?: string;
  readonly sector?: string;
  readonly message: string;
  readonly [key: string]: unknown;
}

export interface RiskFlagsResponse {
  readonly flags: readonly RiskFlagItem[];
  readonly llm_risk_summary: string;
}

// ── News Impact ──
export interface NewsDocumentItem {
  readonly text: string;
  readonly metadata?: Record<string, unknown>;
}

export interface NewsImpactItem {
  readonly ticker: string;
  readonly matched_news: readonly NewsDocumentItem[];
}

export interface NewsImpactResponse {
  readonly news_data: readonly NewsImpactItem[];
  readonly general_news: readonly NewsDocumentItem[];
  readonly llm_news_summary: string;
}

// ── Chat / Ask ──
export interface AskRequest {
  readonly question: string;
}

export interface AskResponse {
  readonly route: string;
  readonly answer: string;
  readonly data?: unknown;
  readonly contexts?: readonly {
    readonly text?: string;
    readonly metadata?: Record<string, unknown>;
  }[];
  readonly evidence?: unknown;
  readonly metadata?: unknown;
  readonly [key: string]: unknown;
}

// ── Upload ──
export interface IndexResult {
  readonly status: string;
  readonly file: string;
  readonly source_file: string;
  readonly chunks_indexed: number;
  readonly rows_parsed: number;
  readonly collection: string;
}

export interface UploadResponse {
  readonly status: string;
  readonly saved_to: string;
  readonly index_result?: IndexResult;
}

export interface UploadState {
  readonly uploading: boolean;
  readonly error: string | null;
  readonly result: UploadResponse | null;
}

// ── LLM Config ──
export interface LlmConfigResponse {
  readonly base_url: string;
  readonly model: string;
  readonly api_key_configured: boolean;
  readonly api_key_hint: string;
}

export interface LlmConfigRequest {
  readonly base_url?: string;
  readonly model?: string;
  readonly api_key?: string;
}

// ── Chat message (local state) ──
export interface ChatMessage {
  readonly id: string;
  readonly role: 'user' | 'assistant';
  readonly content: string;
  readonly route?: string;
  readonly data?: unknown;
  readonly contexts?: AskResponse['contexts'];
  readonly timestamp: number;
}
