from django.db import transaction
from analytics.models import KeyAnalytics

def process_key_events(user, key_events):
    if not user.is_authenticated or not key_events:
        return
        
    key_stats = {}
    
    for event in key_events:
        expected = event.get('expected', '')
        if not expected or len(expected) > 1:
            continue
            
        expected = expected.lower() # normalize
        
        if expected not in key_stats:
            key_stats[expected] = {'total': 0, 'mistakes': 0, 'time': 0, 'correct_count': 0}
            
        key_stats[expected]['total'] += 1
        if not event.get('correct', False):
            key_stats[expected]['mistakes'] += 1
        else:
            key_stats[expected]['time'] += event.get('time_ms', 0)
            key_stats[expected]['correct_count'] += 1
            
    with transaction.atomic():
        for char, stats in key_stats.items():
            obj, created = KeyAnalytics.objects.get_or_create(user=user, key_char=char)
            
            obj.total_strokes += stats['total']
            obj.mistakes += stats['mistakes']
            
            if stats['correct_count'] > 0:
                current_avg_time = obj.avg_reaction_ms
                new_avg = stats['time'] / stats['correct_count']
                
                if current_avg_time == 0:
                    obj.avg_reaction_ms = new_avg
                else:
                    # Exponential moving average
                    obj.avg_reaction_ms = (current_avg_time * 0.8) + (new_avg * 0.2)
                    
            obj.save()
