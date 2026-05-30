# AI Typing Master

An AI-powered typing ecosystem featuring multiplayer races,
coding practice, analytics, and competitive typing games.

## Features
- Multiplayer Typing Races
- Coding Practice Mode
- Real-time Analytics
- Competitive Games
- User Profiles with Avatar Upload
- Leaderboards

## Tech Stack
- Backend: Django + Django Channels
- Real-time: WebSockets + Redis
- Frontend: HTML/CSS/JS (Glassmorphism)
- Database: PostgreSQL (Production) / SQLite (Dev)
- Deployment: Docker + Daphne + Gunicorn

## Local Setup

### 1. Clone karo
git clone https://github.com/yourusername/ai-typing-master.git
cd ai-typing-master

### 2. Virtual env banao
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

### 3. Dependencies install karo
pip install -r requirements.txt

### 4. .env file banao
cp .env.example .env
# .env mein apni values fill karo

### 5. Migrations run karo
python manage.py migrate

### 6. Server start karo
python manage.py runserver

## Environment Variables
| Variable | Description |
|----------|-------------|
| SECRET_KEY | Django secret key |
| DEBUG | True/False |
| ALLOWED_HOSTS | Domain names |
| DATABASE_URL | PostgreSQL URL |
| REDIS_URL | Redis URL |

## Deployment
See deployment guides below.

## Future Roadmap
- AI-powered typing suggestions
- More game modes
- Mobile app

## Built By
Vaibhav Kumar © 2026
