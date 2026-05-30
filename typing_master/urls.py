from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({"status": "ok"}, status=200)

urlpatterns = [
    path('health/', health_check, name='health'),
    path('admin/', admin.site.urls),
    path('accounts/', include('accounts.urls')),
    path('dashboard/', include('dashboard.urls')),
    path('typing/', include('typing_test.urls')),
    path('leaderboards/', include('leaderboards.urls')),
    path('games/', include('games.urls')),
    path('multiplayer/', include('multiplayer.urls')),
    path('analytics/', include('analytics.urls')),
    path('practice/', include('practice.urls')),
    path('', include('core.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
