from django.contrib import admin
from .models import MultiplayerRoom, RaceParticipant

@admin.register(MultiplayerRoom)
class MultiplayerRoomAdmin(admin.ModelAdmin):
    list_display = ('room_code', 'status', 'created_at', 'is_public')
    list_filter = ('status', 'created_at')
    search_fields = ('room_code',)

@admin.register(RaceParticipant)
class RaceParticipantAdmin(admin.ModelAdmin):
    list_display = ('user', 'room', 'wpm', 'placement', 'completed_at')
    list_filter = ('placement',)
    search_fields = ('user__username', 'room__room_code')
    readonly_fields = ('wpm', 'accuracy', 'placement')
