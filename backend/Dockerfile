FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 8080

CMD ["sh", "-c", "python init_db.py && gunicorn -w 1 --threads 2 -b 0.0.0.0:8080 main:app"]
