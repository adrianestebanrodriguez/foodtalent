# Root Dockerfile for Render - builds backend
FROM python:3.12-slim

WORKDIR /app

RUN pip install --no-cache-dir --upgrade pip setuptools wheel

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

RUN mkdir -p storage/profiles

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]