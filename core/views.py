from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
import json
from .models import UserSettings

def home(request):
    return render(request, 'home.html')

@login_required
def settings_view(request):
    settings_obj, _ = UserSettings.objects.get_or_create(user=request.user)
    return render(request, 'core/settings.html', {'settings': settings_obj})

@login_required
@require_http_methods(["POST"])
def sync_settings(request):
    try:
        data = json.loads(request.body)
        key = data.get('key')
        value = data.get('value')
        
        settings_obj, _ = UserSettings.objects.get_or_create(user=request.user)
        
        if key == 'theme':
            settings_obj.theme = value
        elif key == 'audio_pack':
            settings_obj.audio_pack = value
        elif key == 'reduced_motion':
            settings_obj.reduced_motion = bool(value)
            
        settings_obj.save()
        return JsonResponse({'status': 'success'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})

from django.db import connection
import redis
from django.conf import settings

def health_check(request):
    health = {
        "status": "healthy",
        "database": "disconnected",
        "redis": "disconnected",
        "websockets": "ready"
    }
    
    # Check DB
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            health["database"] = "connected"
    except Exception:
        health["status"] = "unhealthy"
        
    # Check Redis
    try:
        redis_url = getattr(settings, 'REDIS_URL', 'redis://127.0.0.1:6379/1')
        r = redis.from_url(redis_url)
        r.ping()
        health["redis"] = "connected"
    except Exception:
        health["status"] = "unhealthy"
        
    status_code = 200 if health["status"] == "healthy" else 503
    return JsonResponse(health, status=status_code)
