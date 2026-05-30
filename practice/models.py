from django.db import models
from django.contrib.auth.models import User
from django.utils.html import escape

class PracticeCollection(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='collections')
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.name}"

class CustomPractice(models.Model):
    LANGUAGE_CHOICES = (
        ('plaintext', 'Plain Text'),
        ('python', 'Python'),
        ('javascript', 'JavaScript'),
        ('html', 'HTML'),
        ('css', 'CSS'),
        ('sql', 'SQL'),
        ('json', 'JSON'),
        ('bash', 'Bash/Shell'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='custom_practices')
    collection = models.ForeignKey(PracticeCollection, on_delete=models.SET_NULL, null=True, blank=True, related_name='practices')
    title = models.CharField(max_length=150)
    content = models.TextField()
    language = models.CharField(max_length=20, choices=LANGUAGE_CHOICES, default='plaintext')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def save(self, *args, **kwargs):
        # Extremely basic sanitization. Real sanitization is handled during rendering.
        # But we still enforce an absolute size limit here.
        if len(self.content) > 20000:
            self.content = self.content[:20000]
        super().save(*args, **kwargs)
        
    def __str__(self):
        return self.title
