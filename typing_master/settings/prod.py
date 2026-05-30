from .base import *
import os
import dj_database_url

DEBUG = os.getenv('DEBUG', 'False') == 'True'

# Allow hosts via env
allowed = os.getenv('ALLOWED_HOSTS', '')
if allowed:
    ALLOWED_HOSTS = allowed.split(',')
else:
    ALLOWED_HOSTS = ['*']

# Security Settings for Production
SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT', 'False') == 'True'
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True

# HSTS settings (Uncomment when fully on HTTPS)
# SECURE_HSTS_SECONDS = 31536000
# SECURE_HSTS_INCLUDE_SUBDOMAINS = True
# SECURE_HSTS_PRELOAD = True

# CSRF Trusted origins
trusted = os.getenv('CSRF_TRUSTED_ORIGINS', '')
if trusted:
    CSRF_TRUSTED_ORIGINS = trusted.split(',')

# Whitenoise for static files
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Database
db_url = os.getenv('DATABASE_URL')
if db_url:
    DATABASES = {
        'default': dj_database_url.config(default=db_url, conn_max_age=600)
    }

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'ERROR',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'prod_errors.log'),
            'maxBytes': 1024 * 1024 * 5,  # 5 MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
        'typing_master': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        }
    },
}
