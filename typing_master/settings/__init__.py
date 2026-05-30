import os

# Default to dev settings if nothing is specified
if os.environ.get('DJANGO_ENV') == 'production':
    from .prod import *
else:
    from .dev import *
