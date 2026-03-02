FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libssl-dev \
    libffi-dev \
    python3-dev \
    git \
    openssh-client \
    && rm -rf /var/lib/apt/lists/*
# Set working directory
WORKDIR /app

# Copy the custom entrypoint script
COPY customPythonEntrypoint.sh /customPythonEntrypoint.sh
RUN chmod +x /customPythonEntrypoint.sh

# Expose port
EXPOSE 80

# Use custom entrypoint
ENTRYPOINT ["/customPythonEntrypoint.sh"]
