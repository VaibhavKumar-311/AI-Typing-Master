import random
from analytics.models import KeyAnalytics

def generate_adaptive_text(user):
    weak_keys = list(KeyAnalytics.objects.filter(user=user, total_strokes__gt=10).order_by('-mistakes')[:5])
    if not weak_keys:
        return "Complete more tests to unlock adaptive AI practice generation."
        
    weak_chars = [k.key_char for k in weak_keys]
    
    word_bank = ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog', 'algorithm', 'system', 'python', 'django', 'javascript', 'html', 'css', 'function', 'variable', 'string', 'array', 'object', 'database', 'network', 'protocol', 'interface']
    
    target_words = [w for w in word_bank if any(c in w for c in weak_chars)]
    if not target_words:
        target_words = word_bank
        
    practice_words = []
    for _ in range(40):
        practice_words.append(random.choice(target_words))
        
    return " ".join(practice_words)
