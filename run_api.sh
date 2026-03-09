#!/bin/bash
set -e

source ~/.bashrc
conda activate lmdeploy_env

cd /burg-archive/stats/users/kj2712/6895/portfolio_ai
uvicorn app.api_server:app --host 0.0.0.0 --port 8000