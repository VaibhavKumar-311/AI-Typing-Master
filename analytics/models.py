from django.db import models
from django.contrib.auth.models import User

class KeyAnalytics(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='key_analytics')
    key_char = models.CharField(max_length=1)
    total_strokes = models.IntegerField(default=0)
    mistakes = models.IntegerField(default=0)
    avg_reaction_ms = models.FloatField(default=0.0)
    
    class Meta:
        unique_together = ('user', 'key_char')
        
    def __str__(self):
        return f"{self.user.username} - '{self.key_char}'"

class UserTypingPattern(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='typing_pattern')
    avg_wpm_overall = models.FloatField(default=0.0)
    avg_accuracy_overall = models.FloatField(default=0.0)
    trend_history_json = models.TextField(default="[]") 
    last_updated = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} Pattern"

class PracticeRecommendation(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recommendations')
    insight = models.CharField(max_length=255)
    category = models.CharField(max_length=50, default='weak_key')
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.username}: {self.insight[:30]}"
