from django.db import models
from django.contrib.auth.models import User

class Paragraph(models.Model):
    DIFFICULTY_CHOICES = (
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
        ('expert', 'Expert'),
    )
    CATEGORY_CHOICES = (
        ('english', 'English'),
        ('coding', 'Coding'),
        ('numbers', 'Numbers'),
        ('symbols', 'Symbols'),
        ('ai_tech', 'AI/Tech'),
    )

    text = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='english')
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='medium')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_category_display()} - {self.get_difficulty_display()} ({self.id})"

class TypingTestResult(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='typing_results', null=True, blank=True)
    wpm = models.IntegerField()
    cpm = models.IntegerField()
    accuracy = models.FloatField()
    mistakes = models.IntegerField()
    duration = models.IntegerField() # In seconds
    category = models.CharField(max_length=20)
    difficulty = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        username = self.user.username if self.user else "Guest"
        return f"{username} - {self.wpm} WPM ({self.created_at.strftime('%Y-%m-%d %H:%M')})"
