# N8N 

This repository contains a simple Docker-based setup for running n8n with a persistent data volume.

## What is included

- A custom Docker image based on the official n8n image
- A Docker Compose configuration exposing n8n on port 5678
- A persistent volume for n8n data

## Requirements

- Docker
- Docker Compose

## Getting started

1. Clone the repository.
2. Start the service:

   ```bash
   docker compose up -d
   ```

3. Open n8n in your browser:

   ```text
   http://localhost:5678
   ```

## Useful commands

Start the containers:

```bash
docker compose up -d
```

Stop the containers:

```bash
docker compose down
```

View logs:

```bash
docker compose logs -f
```

Remove the persistent data volume:

```bash
docker compose down -v
```

## Notes

- The n8n data is stored in a Docker volume so workflows and credentials persist between restarts.
- If you want to customize the setup further, edit the Docker Compose configuration and Dockerfile.
