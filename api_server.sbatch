#!/bin/bash
#SBATCH -A stats
#SBATCH --qos=normal
#SBATCH --gres=gpu:1
#SBATCH --time=2:00:00
#SBATCH -J portfolio_ai
#SBATCH -N 1
#SBATCH --ntasks=1
#SBATCH -c 4
#SBATCH --mem=48G
#SBATCH -o /burg-archive/stats/users/kj2712/6895/logs/%x_%j.out
#SBATCH -e /burg-archive/stats/users/kj2712/6895/logs/%x_%j.err
#SBATCH -D /burg-archive/stats/users/kj2712/6895/portfolio_ai

set -exo pipefail
export PYTHONUNBUFFERED=1

# ===== 路径配置 =====
PROJECT_DIR=/burg-archive/stats/users/kj2712/6895/portfolio_ai
MODEL_PATH=/burg-archive/stats/users/kj2712/6895/LLaMA-Factory/saves/llama
LOG_DIR=/burg-archive/stats/users/kj2712/6895/logs
TMP_DIR=/burg-archive/stats/users/kj2712/6895/tmp

UPLOAD_FILINGS_DIR=$PROJECT_DIR/DATA/uploads/filings
UPLOAD_NEWS_DIR=$PROJECT_DIR/DATA/uploads/news
PROCESSED_FILINGS_DIR=$PROJECT_DIR/DATA/processed/filings
PROCESSED_NEWS_DIR=$PROJECT_DIR/DATA/processed/news
CHROMA_FILINGS_DIR=$PROJECT_DIR/DATA/chroma_filings
CHROMA_NEWS_DIR=$PROJECT_DIR/DATA/chroma_news

HF_HOME=/burg-archive/stats/users/kj2712/6895/DATA/hf_home
HF_HUB_CACHE=$HF_HOME/hub
HF_DATASETS_CACHE=$HF_HOME/datasets

LMDEPLOY_LOG=$LOG_DIR/lmdeploy_${SLURM_JOB_ID}.log
API_LOG=$LOG_DIR/api_${SLURM_JOB_ID}.log

mkdir -p "$LOG_DIR"
mkdir -p "$TMP_DIR"
mkdir -p "$UPLOAD_FILINGS_DIR"
mkdir -p "$UPLOAD_NEWS_DIR"
mkdir -p "$PROCESSED_FILINGS_DIR"
mkdir -p "$PROCESSED_NEWS_DIR"
mkdir -p "$CHROMA_FILINGS_DIR"
mkdir -p "$CHROMA_NEWS_DIR"
mkdir -p "$HF_HOME" "$HF_HUB_CACHE" "$HF_DATASETS_CACHE"

# ===== 安全加载 conda =====
set +u
export BASHRCSOURCED=1
if [ -f "$HOME/miniconda3/etc/profile.d/conda.sh" ]; then
  source "$HOME/miniconda3/etc/profile.d/conda.sh"
elif [ -f "$HOME/anaconda3/etc/profile.d/conda.sh" ]; then
  source "$HOME/anaconda3/etc/profile.d/conda.sh"
else
  echo "[ERR] 未找到 conda.sh"
  exit 2
fi
set -u

conda activate lmdeploy_env 2>/dev/null || {
  echo "[ERR] conda env 'lmdeploy_env' 不存在"
  exit 2
}

# ===== 环境变量 =====
export HF_HOME="$HF_HOME"
export HF_HUB_CACHE="$HF_HUB_CACHE"
export HF_DATASETS_CACHE="$HF_DATASETS_CACHE"
export TMPDIR="$TMP_DIR"
export TOKENIZERS_PARALLELISM=false

# 避免 set -u 下 PYTHONPATH 未定义导致报错
export PYTHONPATH="$PROJECT_DIR:${PYTHONPATH:-}"

# API 调用同节点上的 LMDeploy
export LMDEPLOY_BASE_URL=http://127.0.0.1:23333/v1
export LMDEPLOY_MODEL="$MODEL_PATH"
export LMDEPLOY_API_KEY=lmdeploy

# ===== 基础检查 =====
test -d "$MODEL_PATH" || {
  echo "[ERR] 模型目录不存在: $MODEL_PATH"
  exit 3
}

test -f "$PROJECT_DIR/app/api_server.py" || {
  echo "[ERR] api_server.py 不存在: $PROJECT_DIR/app/api_server.py"
  exit 4
}

test -f "$MODEL_PATH/tokenizer_config.json" || {
  echo "[ERR] tokenizer_config.json 不存在: $MODEL_PATH/tokenizer_config.json"
  exit 5
}

test -f "$MODEL_PATH/tokenizer.json" || {
  echo "[ERR] tokenizer.json 不存在: $MODEL_PATH/tokenizer.json"
  exit 6
}

echo "=== NODE === $(hostname)"
echo "=== DATE === $(date)"
echo "=== JOB  === ${SLURM_JOB_ID:-N/A}"
echo "=== PWD  === $(pwd)"
echo "=== PYTHON === $(which python)"
echo "=== UVICORN === $(which uvicorn || true)"
echo "=== LMDEPLOY === $(which lmdeploy || true)"
echo "=== LMDEPLOY_BASE_URL === ${LMDEPLOY_BASE_URL}"
echo "=== PYTHONPATH === ${PYTHONPATH}"
nvidia-smi || true
python --version || true

# ===== tokenizer 配置自动修正 =====
python - <<'PY'
import json
import os
import shutil
import sys

cfg_path = "/burg-archive/stats/users/kj2712/6895/LLaMA-Factory/saves/llama/tokenizer_config.json"
with open(cfg_path, "r", encoding="utf-8") as f:
    cfg = json.load(f)

tok_cls = cfg.get("tokenizer_class")
print(f"[INFO] tokenizer_class before patch: {tok_cls}")

if tok_cls == "TokenizersBackend":
    backup_path = cfg_path + ".bak"
    if not os.path.exists(backup_path):
        shutil.copy2(cfg_path, backup_path)
        print(f"[INFO] backup saved to: {backup_path}")
    cfg["tokenizer_class"] = "PreTrainedTokenizerFast"
    with open(cfg_path, "w", encoding="utf-8") as f:
        json.dump(cfg, f, ensure_ascii=False, indent=2)
    print("[INFO] tokenizer_class patched to PreTrainedTokenizerFast")
else:
    print("[INFO] tokenizer_config.json does not need patch")
PY

# ===== 预检查 tokenizer 是否可加载 =====
python - <<'PY'
import sys
import transformers
from transformers import AutoTokenizer

model_path = "/burg-archive/stats/users/kj2712/6895/LLaMA-Factory/saves/llama"

print(f"[INFO] transformers version: {transformers.__version__}")
try:
    tok = AutoTokenizer.from_pretrained(model_path, trust_remote_code=True)
    ids = tok("hello world")["input_ids"][:10]
    print(f"[INFO] tokenizer loaded successfully: {type(tok)}")
    print(f"[INFO] tokenizer smoke test ids: {ids}")
except Exception as e:
    print(f"[ERR] AutoTokenizer smoke test failed: {e}")
    sys.exit(7)
PY

LMDEPLOY_PID=""
API_PID=""

cleanup() {
  echo "[$(date)] cleanup..."
  if [ -n "${API_PID:-}" ]; then
    kill "${API_PID}" 2>/dev/null || true
  fi
  if [ -n "${LMDEPLOY_PID:-}" ]; then
    kill "${LMDEPLOY_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT SIGTERM SIGINT

cd "$PROJECT_DIR"

echo "[$(date)] Starting LMDeploy..."
lmdeploy serve api_server \
  "$MODEL_PATH" \
  --server-name 0.0.0.0 \
  --server-port 23333 \
  > "$LMDEPLOY_LOG" 2>&1 &
LMDEPLOY_PID=$!

echo "LMDeploy PID: $LMDEPLOY_PID"
echo "LMDeploy log: $LMDEPLOY_LOG"

# ===== 等待 LMDeploy 就绪，同时检测是否提前退出 =====
LMDEPLOY_READY=0
for i in $(seq 1 180); do
  if curl -s http://127.0.0.1:23333/v1/models >/dev/null 2>&1; then
    echo "[$(date)] LMDeploy is ready."
    LMDEPLOY_READY=1
    break
  fi

  if ! kill -0 "$LMDEPLOY_PID" >/dev/null 2>&1; then
    echo "[ERR] LMDeploy 进程已提前退出，请检查日志: $LMDEPLOY_LOG"
    tail -n 200 "$LMDEPLOY_LOG" || true
    exit 8
  fi

  sleep 5
done

if [ "$LMDEPLOY_READY" -ne 1 ]; then
  echo "[ERR] LMDeploy 未在预期时间内就绪，请检查日志: $LMDEPLOY_LOG"
  tail -n 200 "$LMDEPLOY_LOG" || true
  exit 9
fi

echo "[$(date)] Starting FastAPI..."
python -m uvicorn app.api_server:app \
  --host 0.0.0.0 \
  --port 8000 \
  > "$API_LOG" 2>&1 &
API_PID=$!

echo "API PID: $API_PID"
echo "API log: $API_LOG"

# ===== 等待 API 就绪，同时检测是否提前退出 =====
API_READY=0
for i in $(seq 1 60); do
  if curl -s http://127.0.0.1:8000/health >/dev/null 2>&1; then
    echo "[$(date)] API is ready."
    API_READY=1
    break
  fi

  if ! kill -0 "$API_PID" >/dev/null 2>&1; then
    echo "[ERR] API 进程已提前退出，请检查日志: $API_LOG"
    tail -n 200 "$API_LOG" || true
    exit 10
  fi

  sleep 2
done

if [ "$API_READY" -ne 1 ]; then
  echo "[ERR] API 未在预期时间内就绪，请检查日志: $API_LOG"
  tail -n 200 "$API_LOG" || true
  exit 11
fi

echo "======================================"
echo "Node: $(hostname)"
echo "LMDeploy: http://$(hostname):23333/v1"
echo "API:      http://$(hostname):8000"
echo "Docs:     http://$(hostname):8000/docs"
echo "======================================"

# 保持作业存活
wait "$API_PID"