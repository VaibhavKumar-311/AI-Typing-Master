from django.urls import path
from . import views

urlpatterns = [
    path('', views.games_home, name='games_home'),
    path('falling-words/', views.falling_words_view, name='falling_words'),
    path('zombie-typing/', views.zombie_typing_view, name='zombie_typing'),
    path('racing-typing/', views.racing_typing_view, name='racing_typing'),
    path('space-shooter/', views.space_shooter_view, name='space_shooter'),
    path('api/save-game-score/', views.save_game_score, name='api_save_game_score'),
]
