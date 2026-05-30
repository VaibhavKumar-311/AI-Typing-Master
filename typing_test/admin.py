from django.contrib import admin
from .models import TypingTestResult, Paragraph

@admin.register(TypingTestResult)
class TypingTestResultAdmin(admin.ModelAdmin):
    list_display = ('user', 'wpm', 'accuracy', 'category', 'difficulty', 'created_at')
    list_filter = ('category', 'difficulty', 'created_at')
    search_fields = ('user__username',)
    readonly_fields = ('wpm', 'cpm', 'accuracy', 'mistakes', 'duration')
    actions = ['flag_as_suspicious']
    
    def flag_as_suspicious(self, request, queryset):
        from core.models import SuspiciousActivityLog
        for obj in queryset:
            if obj.user:
                SuspiciousActivityLog.objects.create(
                    user=obj.user,
                    activity_type='admin_flag',
                    description=f'Admin flagged result {obj.id} ({obj.wpm} WPM)'
                )
        self.message_user(request, "Flagged selected results.")

@admin.register(Paragraph)
class ParagraphAdmin(admin.ModelAdmin):
    list_display = ('id', 'category', 'difficulty', 'is_active')
    list_filter = ('category', 'difficulty', 'is_active')
