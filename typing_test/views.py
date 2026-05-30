import json
from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from .models import Paragraph, TypingTestResult
import random
from django.core.paginator import Paginator

def typing_test_view(request):
    # Pass retry params if any
    context = {
        'retry_category': request.GET.get('category', 'english'),
        'retry_difficulty': request.GET.get('difficulty', 'medium'),
        'retry_duration': request.GET.get('duration', '60')
    }
    return render(request, 'typing_test/test.html', context)

@require_http_methods(["GET"])
def get_paragraph(request):
    difficulty = request.GET.get('difficulty', 'medium')
    category = request.GET.get('category', 'english')
    
    paragraphs = Paragraph.objects.filter(difficulty=difficulty, category=category, is_active=True)
    if paragraphs.exists():
        paragraph = random.choice(paragraphs)
        text = paragraph.text
    else:
        text = "This is a placeholder paragraph because the database has no active paragraphs for this category and difficulty. Typing is a great skill that can improve your productivity and make you a better programmer. Remember to always use the correct fingers for each key."
        
    return JsonResponse({'text': text})

from django_ratelimit.decorators import ratelimit

@ratelimit(key='ip', rate='30/m', method='POST', block=True)
@require_http_methods(["POST"])
def save_result(request):
    try:
        data = json.loads(request.body)
        user = request.user if request.user.is_authenticated else None
        
        raw_wpm = float(data.get('wpm', 0))
        if raw_wpm > 300.0:
            if user:
                from core.models import SuspiciousActivityLog
                SuspiciousActivityLog.objects.create(
                    user=user,
                    activity_type='impossible_wpm',
                    description=f'Submitted WPM: {raw_wpm}'
                )
        
        # Validation / Anti-cheat clamps
        wpm = min(raw_wpm, 300.0)
        cpm = min(float(data.get('cpm', 0)), 1500.0)
        accuracy = max(0.0, min(float(data.get('accuracy', 0.0)), 100.0))
        mistakes = max(0, int(data.get('mistakes', 0)))
        duration = max(1, int(data.get('duration', 0)))
        
        result = TypingTestResult.objects.create(
            user=user,
            wpm=wpm,
            cpm=cpm,
            accuracy=accuracy,
            mistakes=mistakes,
            duration=duration,
            category=data.get('category', 'english'),
            difficulty=data.get('difficulty', 'medium')
        )
        
        if user:
            from accounts.services.xp_service import award_xp_for_test
            awarded, xp_earned, leveled_up = award_xp_for_test(user, data, result.id)
            return JsonResponse({
                'status': 'success', 
                'result_id': result.id,
                'xp_earned': xp_earned if awarded else 0,
                'leveled_up': leveled_up if awarded else False
            })
            
        return JsonResponse({'status': 'success', 'result_id': result.id})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)

def result_view(request, result_id):
    result = get_object_or_404(TypingTestResult, id=result_id)
    
    # Calculate performance message
    if result.wpm > 80 and result.accuracy > 95:
        message = "Exceptional speed and precision!"
    elif result.wpm > 60 and result.accuracy > 95:
        message = "Excellent consistency and accuracy."
    elif result.wpm > 80 and result.accuracy < 90:
        message = "High speed, but accuracy needs improvement."
    elif result.accuracy < 90:
        message = "Focus on accuracy before speed."
    else:
        message = "Solid performance. Keep practicing!"
        
    xp_earned = 0
    current_level = 'Beginner'
    
    if result.user:
        from accounts.models import XPTransaction
        from accounts.services.xp_service import get_level
        tx = XPTransaction.objects.filter(user=result.user, reference_id=str(result.id)).first()
        if tx:
            xp_earned = tx.amount
        if hasattr(result.user, 'profile'):
            current_level = get_level(result.user.profile.xp)
    else:
        # Guest mockup
        xp_earned = int(result.wpm * (result.accuracy / 100))
        
    correct_chars = result.cpm # Approximate
    leveled_up = request.GET.get('leveled_up') == '1'
    
    context = {
        'result': result,
        'message': message,
        'xp_earned': xp_earned,
        'correct_chars': correct_chars,
        'leveled_up': leveled_up,
        'current_level': current_level
    }
    return render(request, 'typing_test/result.html', context)

@login_required
def history_view(request):
    results = TypingTestResult.objects.filter(user=request.user).order_by('-created_at')
    
    # Filtering
    category = request.GET.get('category')
    difficulty = request.GET.get('difficulty')
    if category:
        results = results.filter(category=category)
    if difficulty:
        results = results.filter(difficulty=difficulty)
        
    paginator = Paginator(results, 10) # 10 per page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    return render(request, 'typing_test/history.html', {'page_obj': page_obj})

@login_required
@require_http_methods(["POST"])
def delete_result(request, result_id):
    result = get_object_or_404(TypingTestResult, id=result_id, user=request.user)
    result.delete()
    return redirect('history')
