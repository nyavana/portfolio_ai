# Stage 1: Build the Vite frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Install dependencies first
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Build the frontend with relative base URL
COPY frontend/ ./
ENV VITE_API_BASE_URL=""
RUN npm run build

# Stage 2: Build the FastAPI backend
FROM python:3.12-slim
WORKDIR /app

# Install system dependencies if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY app/ app/
COPY core/ core/
COPY data/ data/
COPY ingest/ ingest/
COPY rag/ rag/
COPY scripts/ scripts/
COPY services/ services/
COPY .env.example .env.local

# Copy built frontend assets
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Expose port 8000
EXPOSE 8000

# Set Python path so imports work correctly
ENV PYTHONPATH=/app

# Start the application
CMD ["python", "-m", "uvicorn", "app.api_server:app", "--host", "0.0.0.0", "--port", "8000"]
