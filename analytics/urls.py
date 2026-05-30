from django.urls import path
from . import views

urlpatterns = [
    path('', views.analytics_dashboard, name='analytics_dashboard'),
    path('api/save-metrics/', views.save_metrics, name='api_save_metrics'),
]
