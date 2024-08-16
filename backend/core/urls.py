#core/urls.py
from django.urls import path
from .views import set_csrf_token  # 'set_csrf_token' 뷰를 import합니다.

urlpatterns = [
    path('set-csrf-token/', set_csrf_token, name='set_csrf_token'),
]