from django.contrib import admin
from .models import SuspiciousActivityLog, UserSettings

@admin.register(SuspiciousActivityLog)
class SuspiciousActivityLogAdmin(admin.ModelAdmin):
    list_display = ('activity_type', 'user', 'ip_address', 'timestamp', 'is_reviewed')
    list_filter = ('activity_type', 'is_reviewed', 'timestamp')
    search_fields = ('user__username', 'ip_address')
    actions = ['mark_reviewed']
    readonly_fields = ('activity_type', 'user', 'ip_address', 'description', 'timestamp')
    
    def mark_reviewed(self, request, queryset):
        queryset.update(is_reviewed=True)
    mark_reviewed.short_description = "Mark selected logs as reviewed"

@admin.register(UserSettings)
class UserSettingsAdmin(admin.ModelAdmin):
    list_display = ('user', 'theme', 'audio_pack')
    search_fields = ('user__username',)
