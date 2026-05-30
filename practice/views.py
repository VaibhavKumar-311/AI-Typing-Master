from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.utils.html import escape
from .models import CustomPractice, PracticeCollection

@login_required
def practice_studio(request):
    practices = CustomPractice.objects.filter(user=request.user).order_by('-created_at')
    return render(request, 'practice/studio.html', {'practices': practices})

@login_required
@require_http_methods(["POST"])
def upload_practice(request):
    title = request.POST.get('title', 'Untitled')
    language = request.POST.get('language', 'plaintext')
    
    content = ""
    # Check if file upload
    if 'file' in request.FILES:
        f = request.FILES['file']
        if f.size > 20000:
            return redirect('practice_studio') # Too large
        content = f.read().decode('utf-8')
    else:
        content = request.POST.get('content', '')
        
    # Sanitize content slightly to prevent XSS (escaped during rendering too)
    content = escape(content)
        
    practice = CustomPractice.objects.create(
        user=request.user,
        title=title[:150],
        content=content,
        language=language
    )
    
    return redirect('coding_mode', pk=practice.pk)

@login_required
def coding_mode(request, pk):
    practice = get_object_or_404(CustomPractice, pk=pk, user=request.user)
    return render(request, 'practice/coding.html', {'practice': practice})
