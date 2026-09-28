# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package.json ./
RUN npm install --ignore-scripts
COPY frontend/ ./
RUN node node_modules/vite/bin/vite.js build

# Stage 2: Python FastAPI Backend + Served Frontend
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend dependencies and install
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend app files
COPY backend /app/backend
COPY .env.example /app/.env.example

# Copy built frontend assets from stage 1
COPY --from=frontend-builder /frontend/dist /app/frontend/dist

ENV PYTHONPATH=/app/backend
EXPOSE 8000

CMD ["python", "-m", "uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
