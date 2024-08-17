#users/urls.py
from django.urls import path
from .views import RegisterView, LoginView, FollowUserView, UserProfileView, OtherUserProfileView

urlpatterns = [
		path('register/', RegisterView.as_view(), name='register'),
		path('login/', LoginView.as_view(), name='login'),

		path('follow/', FollowUserView.as_view(), name='follow_user'),

		path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('profile/<str:username>/', OtherUserProfileView.as_view(), name='other-user-profile'),
]