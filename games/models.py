from django.db import models
from django.contrib.auth.models import User

class GameScore(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    game_type = models.CharField(max_length=50) # e.g. 'falling_words'
    score = models.IntegerField(default=0)
    accuracy = models.FloatField(default=0.0)
    highest_combo = models.IntegerField(default=0)
    level_reached = models.IntegerField(default=1)
    duration = models.IntegerField(default=0) # in seconds
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.game_type} - {self.score} by {self.user.username if self.user else 'Guest'}"
