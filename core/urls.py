from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('settings/', views.settings_view, name='settings'),
    path('settings/api/sync/', views.sync_settings, name='sync_settings'),
    path('health/', views.health_check, name='health_check'),
]
