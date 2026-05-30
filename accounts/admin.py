from django.contrib import admin
from .models import UserProfile

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'xp', 'streak', 'joined_date')
    search_fields = ('user__username', 'user__email')
