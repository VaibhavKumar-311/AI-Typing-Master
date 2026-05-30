from django.db import models
from django.contrib.auth.models import User

class UserSettings(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='settings')
    theme = models.CharField(max_length=20, default='dark')
    audio_pack = models.CharField(max_length=20, default='silent')
    caret_style = models.CharField(max_length=20, default='block')
    reduced_motion = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.user.username} Settings"

class SuspiciousActivityLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    activity_type = models.CharField(max_length=50)
    description = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_reviewed = models.BooleanField(default=False)
    
    def __str__(self):
        u = self.user.username if self.user else self.ip_address
        return f"[{self.activity_type}] {u}"
