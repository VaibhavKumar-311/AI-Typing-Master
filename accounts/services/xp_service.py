from datetime import date, timedelta
from accounts.models import UserProfile, UserStreak, XPTransaction

LEVEL_THRESHOLDS = {
    'Beginner': 0,
    'Intermediate': 1000,
    'Advanced': 5000,
    'Pro': 15000,
    'Master': 50000,
}

def get_level(xp):
    current_level = 'Beginner'
    for level, threshold in sorted(LEVEL_THRESHOLDS.items(), key=lambda x: x[1]):
        if xp >= threshold:
            current_level = level
        else:
            break
    return current_level

def process_daily_streak(user):
    streak_data, created = UserStreak.objects.get_or_create(user=user)
    today = date.today()
    
    if streak_data.last_activity_date == today:
        return streak_data.current_streak
        
    if streak_data.last_activity_date == today - timedelta(days=1):
        streak_data.current_streak += 1
    else:
        streak_data.current_streak = 1
        
    if streak_data.current_streak > streak_data.longest_streak:
        streak_data.longest_streak = streak_data.current_streak
        
    streak_data.last_activity_date = today
    streak_data.save()
    return streak_data.current_streak

def award_xp_for_test(user, result_data, result_id):
    if XPTransaction.objects.filter(user=user, reference_id=str(result_id)).exists():
        return False, 0, False
        
    current_streak = process_daily_streak(user)
    
    wpm = result_data.get('wpm', 0)
    accuracy = result_data.get('accuracy', 0.0)
    duration = result_data.get('duration', 60)
    difficulty = result_data.get('difficulty', 'medium')
    
    base_xp = wpm * (duration / 60.0)
    
    if accuracy >= 98:
        base_xp *= 1.5
    elif accuracy >= 95:
        base_xp *= 1.2
    elif accuracy >= 90:
        base_xp *= 1.05
        
    diff_multipliers = {'easy': 0.8, 'medium': 1.0, 'hard': 1.5, 'expert': 2.0}
    base_xp *= diff_multipliers.get(difficulty, 1.0)
    
    streak_bonus = min(0.5, (current_streak - 1) * 0.05) if current_streak > 0 else 0
    final_xp = int(base_xp * (1 + streak_bonus))
    
    if final_xp > 0:
        XPTransaction.objects.create(
            user=user,
            amount=final_xp,
            transaction_type='TEST_COMPLETION',
            reference_id=str(result_id),
            description=f"Test completion: {wpm} WPM, {accuracy}% Acc"
        )
        
        profile = user.profile
        old_level = get_level(profile.xp)
        profile.xp += final_xp
        profile.streak = current_streak
        profile.save()
        
        new_level = get_level(profile.xp)
        leveled_up = new_level != old_level
        
        return True, final_xp, leveled_up
    return False, 0, False
