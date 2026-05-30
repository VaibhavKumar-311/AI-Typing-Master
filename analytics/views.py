from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from analytics.services.weak_key_detector import process_key_events
from analytics.services.recommendation_engine import generate_recommendations
from analytics.services.adaptive_generator import generate_adaptive_text
from analytics.models import UserTypingPattern, KeyAnalytics, PracticeRecommendation
import json

@login_required
def analytics_dashboard(request):
    pattern = UserTypingPattern.objects.filter(user=request.user).first()
    recommendations = PracticeRecommendation.objects.filter(user=request.user)
    
    for rec in recommendations:
        rec.category_display = rec.category.replace('_', ' ').title()
        
    key_stats = KeyAnalytics.objects.filter(user=request.user, total_strokes__gt=5).order_by('-mistakes')[:10]
    
    adaptive_text = None
    if request.GET.get('generate'):
        adaptive_text = generate_adaptive_text(request.user)
        
    context = {
        'pattern': pattern,
        'recommendations': recommendations,
        'key_stats': key_stats,
        'adaptive_text': adaptive_text
    }
    return render(request, 'analytics/dashboard.html', context)

@login_required
@require_http_methods(["POST"])
def save_metrics(request):
    try:
        data = json.loads(request.body)
        key_events = data.get('key_events', [])
        wpm = data.get('wpm', 0)
        accuracy = data.get('accuracy', 0)
        
        # 1. Update pattern
        pattern, _ = UserTypingPattern.objects.get_or_create(user=request.user)
        if pattern.avg_wpm_overall == 0:
            pattern.avg_wpm_overall = wpm
            pattern.avg_accuracy_overall = accuracy
        else:
            pattern.avg_wpm_overall = (pattern.avg_wpm_overall * 0.8) + (wpm * 0.2)
            pattern.avg_accuracy_overall = (pattern.avg_accuracy_overall * 0.8) + (accuracy * 0.2)
        pattern.save()
        
        # 2. Process keystrokes
        process_key_events(request.user, key_events)
        
        # 3. Regenerate recommendations deterministically
        generate_recommendations(request.user)
        
        return JsonResponse({'status': 'success'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
