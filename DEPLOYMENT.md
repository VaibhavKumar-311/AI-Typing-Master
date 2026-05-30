# Production Deployment Guide

This guide details how to deploy the AI Typing Master platform in production.

## Architecture

The platform uses:
- **Django (Daphne/Channels)**: Core ASGI application.
- **PostgreSQL**: Relational database.
- **Redis**: In-memory data store for WebSockets (Channel Layer) and analytics cache.
- **Nginx**: Reverse proxy to serve static/media files and handle WebSocket Upgrade headers.

---

## Deployment Option 1: Docker Compose (VPS / Ubuntu)

For deploying on DigitalOcean, AWS EC2, or any Linux VPS.

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/typing-master.git
   cd typing-master
   ```

2. **Configure Environment Variables**
   Copy the example template and fill in your secure keys:
   ```bash
   cp .env.production.example .env
   nano .env
   ```
   *Ensure you update `SECRET_KEY`, `ALLOWED_HOSTS`, and `CSRF_TRUSTED_ORIGINS`.*

3. **Start the Infrastructure**
   ```bash
   docker-compose build
   docker-compose up -d
   ```

4. **Run Migrations**
   ```bash
   docker-compose exec web python manage.py migrate
   ```

5. **Create a Superuser**
   ```bash
   docker-compose exec web python manage.py createsuperuser
   ```

---

## Deployment Option 2: Render / Platform-as-a-Service (PaaS)

If deploying to managed PaaS providers like Render, Heroku, or Railway.

### 1. Redis Service
- Create a new Redis instance.
- Copy the internal Redis connection string.

### 2. PostgreSQL Service
- Create a managed PostgreSQL database.
- Copy the internal Database URL.

### 3. Web Service
- Connect your GitHub repository.
- Build Command: 
  ```bash
  pip install -r requirements.txt && npm install && npm run build:css && python manage.py collectstatic --noinput && python manage.py migrate
  ```
- Start Command: 
  ```bash
  daphne -b 0.0.0.0 -p $PORT typing_master.asgi:application
  ```

### 4. Environment Variables
Add the following to your PaaS environment variables:
- `DJANGO_ENV`: `production`
- `SECRET_KEY`: `your_generated_secret`
- `DATABASE_URL`: *(from step 2)*
- `REDIS_URL`: *(from step 1)*
- `ALLOWED_HOSTS`: `your-app-name.onrender.com`
- `CSRF_TRUSTED_ORIGINS`: `https://your-app-name.onrender.com`

---

## Health Checks

You can monitor the deployment status by hitting the health endpoint:
`GET /health/`

Response:
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "websockets": "ready"
}
```
