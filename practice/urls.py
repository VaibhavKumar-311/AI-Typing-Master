from django.urls import path
from . import views

urlpatterns = [
    path('studio/', views.practice_studio, name='practice_studio'),
    path('upload/', views.upload_practice, name='upload_practice'),
    path('code/<int:pk>/', views.coding_mode, name='coding_mode'),
]
