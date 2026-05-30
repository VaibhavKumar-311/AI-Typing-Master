from django.urls import path
from . import views

urlpatterns = [
    path('lobby/', views.lobby_view, name='multiplayer_lobby'),
    path('race/<str:room_code>/', views.race_view, name='multiplayer_race'),
    path('api/create-room/', views.create_room, name='api_create_room'),
    path('api/join-room/', views.join_room, name='api_join_room'),
    path('api/save-race-result/', views.save_race_result, name='api_save_race_result'),
]
