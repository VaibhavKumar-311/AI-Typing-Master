from analytics.models import KeyAnalytics, PracticeRecommendation, UserTypingPattern

def generate_recommendations(user):
    if not user.is_authenticated:
        return
        
    # Clear old recommendations
    PracticeRecommendation.objects.filter(user=user).delete()
    
    # Analyze Weak Keys by mistakes
    weakest_keys = KeyAnalytics.objects.filter(user=user, total_strokes__gt=20).order_by('-mistakes')[:3]
    if weakest_keys.exists():
        keys_str = ", ".join([f"'{k.key_char}'" for k in weakest_keys])
        PracticeRecommendation.objects.create(
            user=user,
            category='weak_key',
            insight=f"You consistently make mistakes on: {keys_str}."
        )
        
    # Analyze Slowest Keys
    slowest_keys = KeyAnalytics.objects.filter(user=user, total_strokes__gt=20).order_by('-avg_reaction_ms')[:2]
    if slowest_keys.exists():
        keys_str = ", ".join([f"'{k.key_char}'" for k in slowest_keys])
        PracticeRecommendation.objects.create(
            user=user,
            category='reaction_time',
            insight=f"Your reaction time drops significantly when reaching for: {keys_str}."
        )
        
    # Trend analysis
    try:
        pattern = UserTypingPattern.objects.get(user=user)
        if pattern.avg_accuracy_overall > 0 and pattern.avg_accuracy_overall < 95.0:
            PracticeRecommendation.objects.create(
                user=user,
                category='trend',
                insight=f"Your rolling accuracy is {pattern.avg_accuracy_overall:.1f}%. Try slowing down by 10 WPM to build muscle memory."
            )
    except UserTypingPattern.DoesNotExist:
        pass
