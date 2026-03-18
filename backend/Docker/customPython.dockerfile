FROM python:3.14-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libssl-dev \
    libffi-dev \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/requirements.txt /app/backend/
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r /app/backend/requirements.txt

COPY . /app

EXPOSE 80

WORKDIR /app/backend

CMD ["gunicorn", "-w", "1", "--threads", "2", "-b", "0.0.0.0:80", "main:app"]