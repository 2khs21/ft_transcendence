#users/urls.py
from django.urls import path
from .views import RegisterView, LoginView, FollowUserView

urlpatterns = [
		path('register/', RegisterView.as_view(), name='register'),
		path('login/', LoginView.as_view(), name='login'),
		path('follow/', FollowUserView.as_view(), name='follow_user'),

]