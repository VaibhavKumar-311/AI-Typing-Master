from django.db import models
from django.contrib.auth.models import User

class MultiplayerRoom(models.Model):
    room_code = models.CharField(max_length=10, unique=True)
    is_public = models.BooleanField(default=True)
    status = models.CharField(
        max_length=20, 
        choices=[('WAITING', 'Waiting'), ('IN_PROGRESS', 'In Progress'), ('FINISHED', 'Finished')],
        default='WAITING'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Room {self.room_code} ({self.status})"

class RaceParticipant(models.Model):
    room = models.ForeignKey(MultiplayerRoom, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    wpm = models.IntegerField(default=0)
    accuracy = models.FloatField(default=0.0)
    placement = models.IntegerField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.user.username} in {self.room.room_code}"
