FROM python:3.9-slim

# Install system dependencies (git needed to clone repo)
RUN apt-get update \
    && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Clone GitHub repository
RUN git clone https://github.com/someRandomDude-a/VAT-Gate .

WORKDIR /app/backend

# Install Python dependencies if requirements.txt exists
RUN if [ -f requirements.txt ]; then \
        pip install --no-cache-dir -r requirements.txt ; \
    fi

# Expose port if this is a web app (safe to keep even if unused)
EXPOSE 80

# Python entry file
CMD ["python", "main.py"]
