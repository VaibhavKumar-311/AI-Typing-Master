from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
from .models import MultiplayerRoom, RaceParticipant
import json
import random
import string

def generate_room_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

@login_required
def lobby_view(request):
    return render(request, 'multiplayer/lobby.html')

@login_required
def race_view(request, room_code):
    room = get_object_or_404(MultiplayerRoom, room_code=room_code)
    
    # Ensure participant exists
    RaceParticipant.objects.get_or_create(room=room, user=request.user)
    
    context = {
        'room_code': room_code,
        'paragraph': "The thrill of the race is not just about speed, but about maintaining absolute focus under pressure. Every keystroke matters when you are competing against others in real-time."
    }
    return render(request, 'multiplayer/race.html', context)

@login_required
@require_http_methods(["POST"])
def create_room(request):
    code = generate_room_code()
    room = MultiplayerRoom.objects.create(room_code=code, is_public=False)
    return JsonResponse({'status': 'success', 'room_code': code})

@login_required
@require_http_methods(["POST"])
def join_room(request):
    try:
        data = json.loads(request.body)
        room_code = data.get('room_code', '').upper()
        
        room = MultiplayerRoom.objects.filter(room_code=room_code).first()
        if not room:
            return JsonResponse({'status': 'error', 'message': 'Room not found.'}, status=404)
            
        return JsonResponse({'status': 'success', 'url': f'/multiplayer/race/{room_code}/'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)

from django_ratelimit.decorators import ratelimit

@login_required
@ratelimit(key='user', rate='10/m', method='POST', block=True)
@require_http_methods(["POST"])
def save_race_result(request):
    try:
        data = json.loads(request.body)
        room_code = data.get('room_code')
        wpm = float(data.get('wpm', 0))
        accuracy = float(data.get('accuracy', 0))
        
        # Anti-cheat
        if wpm > 300:
            from core.models import SuspiciousActivityLog
            SuspiciousActivityLog.objects.create(
                user=request.user,
                activity_type='multiplayer_impossible_wpm',
                description=f'Submitted WPM: {wpm} in room {room_code}'
            )
            wpm = 300.0
            
        room = MultiplayerRoom.objects.get(room_code=room_code)
        participant = RaceParticipant.objects.get(room=room, user=request.user)
        
        participant.wpm = wpm
        participant.accuracy = accuracy
        participant.save()
        
        return JsonResponse({'status': 'success'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
