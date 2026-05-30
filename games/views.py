import json
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from .models import GameScore

def games_home(request):
    return render(request, 'games/games.html')

def falling_words_view(request):
    return render(request, 'games/falling_words.html')

def zombie_typing_view(request):
    return render(request, 'games/zombie.html')

def racing_typing_view(request):
    return render(request, 'games/racing.html')

def space_shooter_view(request):
    return render(request, 'games/space.html')

@require_http_methods(["POST"])
def save_game_score(request):
    try:
        data = json.loads(request.body)
        user = request.user if request.user.is_authenticated else None
        
        score = int(data.get('score', 0))
        duration = max(1, int(data.get('duration', 0)))
        
        game_type = data.get('game_type', 'falling_words')
        
        # Anti-cheat validation
        if game_type == 'falling_words':
            if score / duration > 50: 
                return JsonResponse({'status': 'error', 'message': 'Invalid score anomaly detected.'}, status=400)
        elif game_type == 'zombie_typing':
            level_reached = int(data.get('level_reached', 1))
            # Dynamic theoretical max: Roughly 10 zombies per wave * max 250 pts * max 5x combo
            max_theoretical_score = level_reached * 15 * 250 * 5 
            if score > max_theoretical_score:
                return JsonResponse({'status': 'error', 'message': 'Invalid anomaly.'}, status=400)
        elif game_type == 'racing_typing':
            # Human max WPM ~ 250. Max score = (250 WPM * 10) + 2000 placement = 4500. 
            # Plus 500 buffer for extremely short burst tests = 5000.
            if score > 5000:
                return JsonResponse({'status': 'error', 'message': 'Impossible speed anomaly detected.'}, status=400)
        elif game_type == 'space_shooter':
            level_reached = int(data.get('level_reached', 1))
            # Max enemies per wave ~ 5, base score ~ 250 elite + boss kills 1000, 5x combo.
            # Theoretical max is similar to zombie scaling, plus massive boss bonuses.
            max_theoretical_score = (level_reached * 10 * 250 * 5) + (level_reached // 5 * 1000 * 5)
            if score > max_theoretical_score:
                return JsonResponse({'status': 'error', 'message': 'Impossible kill rate anomaly detected.'}, status=400)
                
        game_score = GameScore.objects.create(
            user=user,
            game_type=game_type,
            score=score,
            accuracy=min(float(data.get('accuracy', 0.0)), 100.0),
            highest_combo=int(data.get('highest_combo', 0)),
            level_reached=int(data.get('level_reached', 1)),
            duration=duration
        )
        
        if user:
            # Gamification Integration
            from accounts.models import XPTransaction
            from accounts.services.xp_service import process_daily_streak, get_level
            
            # Simple game XP formula: Base score / 10
            xp_earned = max(0, int(score / 10))
            current_streak = process_daily_streak(user)
            streak_bonus = min(0.5, (current_streak - 1) * 0.05) if current_streak > 0 else 0
            final_xp = int(xp_earned * (1 + streak_bonus))
            
            leveled_up = False
            if final_xp > 0:
                XPTransaction.objects.create(
                    user=user,
                    amount=final_xp,
                    transaction_type='TEST_COMPLETION', # or 'GAME_COMPLETION'
                    reference_id=f"game_{game_score.id}",
                    description=f"Played {game_score.game_type}: Score {score}"
                )
                profile = user.profile
                old_level = get_level(profile.xp)
                profile.xp += final_xp
                profile.save()
                new_level = get_level(profile.xp)
                leveled_up = new_level != old_level
                
            return JsonResponse({
                'status': 'success', 
                'score_id': game_score.id,
                'xp_earned': final_xp,
                'leveled_up': leveled_up
            })
            
        return JsonResponse({'status': 'success', 'score_id': game_score.id})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
