"""
Django settings for transcendence_backend project.

Generated by 'django-admin startproject' using Django 4.2.8.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/4.2/ref/settings/
"""

from pathlib import Path
import os

# 42 OAuth 설정
FORTYTWO_CLIENT_ID = os.getenv('FORTYTWO_CLIENT_ID')
FORTYTWO_CLIENT_SECRET = os.getenv('FORTYTWO_CLIENT_SECRET')
FORTYTWO_REDIRECT_URI = os.getenv('FORTYTWO_REDIRECT_URI')
FORTYTWO_REDIRECT_URI = 'https://localhost:443/api/users/oauth/callback/'
print(f"FORTYTWO_CLIENT_ID: {FORTYTWO_CLIENT_ID}")  # 디버깅을 위한 출력
print(f"FORTYTWO_CLIENT_SECRET: {FORTYTWO_CLIENT_SECRET}")  # 디버깅을 위한 출력
print(f"FORTYTWO_REDIRECT_URI: {FORTYTWO_REDIRECT_URI}")  # 디버깅을 위한 출력
FORTYTWO_AUTH_URL = os.getenv('FORTYTWO_AUTH_URL')
FORTYTWO_TOKEN_URL = os.getenv('FORTYTWO_TOKEN_URL')
FORTYTWO_API_URL = os.getenv('FORTYTWO_API_URL')

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'DEBUG',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'WARNING',  # INFO 수준의 요청/응답 로그가 출력되지 않도록 설정
            'propagate': True,
        },
        'users': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}



# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-c)87kb0oh&wa((m(%wm6@xuno$mg-)1u2#%a&&5bqyw_j8q-8o'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['*']


# Application definition

INSTALLED_APPS = [
	'users', 
    'corsheaders',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
	'rest_framework',
    'rest_framework.authtoken',
    'rest_framework_simplejwt',
	'channels',
    'django.contrib.admin',
	'core',
    'chat',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

CORS_ALLOW_ALL_ORIGINS = True  # 개발 환경에서만 사용. 프로덕션에서는 특정 오리진만 허용하도록 설정

ROOT_URLCONF = 'transcendence_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'transcendence_backend.wsgi.application'


# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('POSTGRES_DB'),
        'USER': os.getenv('POSTGRES_USER'),
        'PASSWORD': os.getenv('POSTGRES_PASSWORD'),
        'HOST': 'db',
        'PORT': 5432,
    }
}


# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# 인증 방식을 토큰 기반으로
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
		'rest_framework_simplejwt.authentication.JWTAuthentication',

    ],
}

from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': True,
}
# Internationalization
# https://docs.djangoproject.com/en/4.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'Asia/Seoul'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.2/howto/static-files/

STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'static')

# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Channels
ASGI_APPLICATION = 'your_project.asgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('redis', 6379)],
        },
    },
}

CORS_ALLOW_CREDENTIALS = True

AUTH_USER_MODEL = 'users.User'

CSRF_COOKIE_NAME = 'csrftoken'
CSRF_HEADER_NAME = 'HTTP_X_CSRFTOKEN'
CSRF_COOKIE_SECURE = False # HTTP를 사용하는 경우
# CSRF_COOKIE_SECURE = True  # HTTPS를 사용하는 경우
CSRF_USE_SESSIONS = False  # 세션 대신 쿠키 사용
CORS_ALLOWED_ORIGINS = [
    "http://localhost:8080",  # 예시: 프론트엔드가 동작하는 로컬 호스트 주소
    "https://localhost:443",
    "https://example.com",    # 예시: 프로덕션 도메인
    # 다른 허용할 도메인들을 여기에 추가하세요.
]

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')


#### email
# Email configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.naver.com'
EMAIL_USE_TLS = True
EMAIL_PORT = 587
EMAIL_HOST_USER = '2khs21@naver.com'
EMAIL_HOST_PASSWORD = 'Rla1q2w3e4r!'
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER
EMAIL_DEBUG = True

