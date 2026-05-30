from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver



class UserProfile(models.Model):
    user         = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar       = models.ImageField(upload_to='avatars/', blank=True, null=True)
    bio          = models.TextField(max_length=500, blank=True)
    xp           = models.IntegerField(default=0)
    level        = models.IntegerField(default=1)
    streak       = models.IntegerField(default=0)
    avg_wpm      = models.FloatField(default=0)
    avg_accuracy = models.FloatField(default=0)
    joined_date  = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"
        
    def get_level(self):
        from accounts.services.xp_service import get_level as calculate_level
        return calculate_level(self.xp)

class UserStreak(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='streak_data')
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    last_activity_date = models.DateField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.user.username} - Streak: {self.current_streak}"

class XPTransaction(models.Model):
    TRANSACTION_TYPES = (
        ('TEST_COMPLETION', 'Test Completion'),
        ('STREAK_BONUS', 'Streak Bonus'),
        ('MANUAL', 'Manual Adjustment'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='xp_transactions')
    amount = models.IntegerField()
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES, default='TEST_COMPLETION')
    reference_id = models.CharField(max_length=50, null=True, blank=True, help_text="ID of the related record (e.g. test_id) to prevent duplicates")
    description = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} | {self.amount} XP | {self.transaction_type}"

# Ensure UserStreak is created alongside UserProfile
@receiver(post_save, sender=User)
def create_user_streak(sender, instance, created, **kwargs):
    if created:
        UserStreak.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_streak(sender, instance, **kwargs):
    if hasattr(instance, 'streak_data'):
        instance.streak_data.save()

@receiver(post_save, sender=User)
def create_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.get_or_create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()
