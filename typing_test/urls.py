from django.urls import path
from . import views

urlpatterns = [
    path('', views.typing_test_view, name='typing_test'),
    path('api/get-paragraph/', views.get_paragraph, name='api_get_paragraph'),
    path('api/save-result/', views.save_result, name='api_save_result'),
    path('result/<int:result_id>/', views.result_view, name='result'),
    path('history/', views.history_view, name='history'),
    path('delete/<int:result_id>/', views.delete_result, name='delete_result'),
]
