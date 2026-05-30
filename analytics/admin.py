from django.contrib import admin
from .models import KeyAnalytics, UserTypingPattern, PracticeRecommendation

@admin.register(KeyAnalytics)
class KeyAnalyticsAdmin(admin.ModelAdmin):
    list_display = ('user', 'key_char', 'total_strokes', 'mistakes', 'avg_reaction_ms')
    list_filter = ('key_char',)
    search_fields = ('user__username',)
    readonly_fields = ('total_strokes', 'mistakes', 'avg_reaction_ms')

@admin.register(UserTypingPattern)
class UserTypingPatternAdmin(admin.ModelAdmin):
    list_display = ('user', 'avg_wpm_overall', 'avg_accuracy_overall', 'last_updated')
    search_fields = ('user__username',)
    readonly_fields = ('avg_wpm_overall', 'avg_accuracy_overall', 'trend_history_json')

@admin.register(PracticeRecommendation)
class PracticeRecommendationAdmin(admin.ModelAdmin):
    list_display = ('user', 'category', 'insight', 'created_at')
    list_filter = ('category', 'created_at')
    search_fields = ('user__username',)
