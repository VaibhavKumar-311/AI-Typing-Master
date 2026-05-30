from django.contrib import admin
from .models import CustomPractice, PracticeCollection

@admin.register(CustomPractice)
class CustomPracticeAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'language', 'created_at')
    list_filter = ('language', 'created_at')
    search_fields = ('title', 'user__username')
    readonly_fields = ('content',)
    
@admin.register(PracticeCollection)
class PracticeCollectionAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'created_at')
