from django.db.models import Max, Q
from django.contrib.auth.models import User
from django.core.cache import cache
from datetime import timedelta
from django.utils import timezone

def get_leaderboard_data(category='wpm', timeframe='all-time'):
    cache_key = f'leaderboard_{category}_{timeframe}'
    cached_data = cache.get(cache_key)
    
    if cached_data is not None:
        return cached_data
        
    date_filter = Q()
    now = timezone.now()
    if timeframe == 'weekly':
        date_filter = Q(typing_results__created_at__gte=now - timedelta(days=7))
    elif timeframe == 'monthly':
        date_filter = Q(typing_results__created_at__gte=now - timedelta(days=30))
        
    if category == 'wpm':
        qs = User.objects.filter(date_filter).annotate(
            score=Max('typing_results__wpm', filter=date_filter)
        ).filter(score__isnull=False).select_related('profile').order_by('-score')[:100]
    elif category == 'accuracy':
        qs = User.objects.filter(date_filter).annotate(
            score=Max('typing_results__accuracy', filter=date_filter)
        ).filter(score__isnull=False).select_related('profile').order_by('-score')[:100]
    elif category == 'xp':
        qs = User.objects.select_related('profile').order_by('-profile__xp')[:100]
        for u in qs:
            u.score = u.profile.xp if hasattr(u, 'profile') else 0
    else:
        qs = []
        
    # Calculate Dense Rank
    ranked_data = []
    current_rank = 1
    previous_score = None
    
    for user in qs:
        score = getattr(user, 'score', 0)
        if previous_score is not None and score < previous_score:
            current_rank += 1
            
        ranked_data.append({
            'rank': current_rank,
            'user': user,
            'score': score,
            'level': user.profile.get_level() if hasattr(user.profile, 'get_level') else 'Beginner',
            'avatar': user.profile.avatar.url if hasattr(user.profile, 'avatar') and user.profile.avatar else None,
        })
        previous_score = score
        
    cache.set(cache_key, ranked_data, 60 * 5) # Cache for 5 mins
    return ranked_data
