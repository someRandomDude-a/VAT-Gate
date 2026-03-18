# Use Python 3.9 Slim base image
FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libssl-dev \
    libffi-dev \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*
# Set working directory
WORKDIR /app

# Copy the local repository into the container during build
COPY . /app

# Install Python dependencies
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Expose port
EXPOSE 80

WORKDIR /app/backend
# Set the default command to run the app
CMD ["gunicorn", "-w", "1", "--threads", "2", "-b", "0.0.0.0:80", "main:app"]