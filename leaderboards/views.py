from django.shortcuts import render
from django.core.paginator import Paginator
from .services import get_leaderboard_data

def leaderboard_view(request):
    category = request.GET.get('category', 'wpm')
    timeframe = request.GET.get('timeframe', 'all-time')
    
    # Validation
    if category not in ['wpm', 'accuracy', 'xp']:
        category = 'wpm'
    if timeframe not in ['all-time', 'weekly', 'monthly']:
        timeframe = 'all-time'
        
    # Fetch ranked data
    data = get_leaderboard_data(category, timeframe)
    
    # Pagination
    paginator = Paginator(data, 10) # 10 per page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # Extract Top 3 for Podium if on page 1
    top_3 = []
    if page_obj.number == 1:
        top_3 = data[:3]
        
    context = {
        'page_obj': page_obj,
        'category': category,
        'timeframe': timeframe,
        'top_3': top_3,
    }
    return render(request, 'leaderboards/leaderboard.html', context)
