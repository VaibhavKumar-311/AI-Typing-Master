import json
from accounts.services.xp_service import get_level
from django.db.models import Avg, Max
from typing_test.models import TypingTestResult

def get_dashboard_stats(user):
    profile = user.profile if hasattr(user, 'profile') else None
    streak_data = getattr(user, 'streak_data', None)
    
    stats = TypingTestResult.objects.filter(user=user).aggregate(
        avg_wpm=Avg('wpm'),
        best_wpm=Max('wpm'),
        avg_acc=Avg('accuracy')
    )
    
    return {
        'current_wpm': int(stats['avg_wpm'] or 0),
        'best_wpm': int(stats['best_wpm'] or 0),
        'avg_accuracy': int(stats['avg_acc'] or 0),
        'xp': profile.xp if profile else 0,
        'level': get_level(profile.xp) if profile else 'Beginner',
        'current_streak': streak_data.current_streak if streak_data else 0,
        'longest_streak': streak_data.longest_streak if streak_data else 0,
    }

def get_chart_data(user):
    recent_tests = TypingTestResult.objects.filter(user=user).order_by('-created_at')[:7]
    recent_tests = list(reversed(recent_tests)) # oldest to newest
    
    wpm_data = [t.wpm for t in recent_tests]
    acc_data = [t.accuracy for t in recent_tests]
    labels = [t.created_at.strftime('%m-%d %H:%M') for t in recent_tests]
    
    return {
        'wpm_progress': json.dumps(wpm_data if wpm_data else [0]),
        'accuracy_trend': json.dumps(acc_data if acc_data else [0]),
        'weekly_activity': json.dumps([len(wpm_data)]), # Simplified
        'xp_growth': json.dumps([]), # Can be populated from XPTransaction if needed
        'labels': json.dumps(labels if labels else ['No Data'])
    }
