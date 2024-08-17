from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):

    ############### profile ###############
    status_message = models.CharField(max_length=100, blank=True)
    profile_image = models.ImageField(upload_to='profile_images/', blank=True, null=True) 
    
    def get_profile_image_url(self):
        if self.profile_image:
            return self.profile_image.url
        return 'images/default_image.png'  # 기본 이미지 경로
    
    ############### 팔로우 ###############
    following = models.ManyToManyField(
        'self', 
        symmetrical=False, 
        related_name='followers'
    )

    # related_name 충돌 해결을 위한 필드 재정의
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='custom_user_set',
        blank=True,
        verbose_name='groups',
        help_text='The groups this user belongs to.',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='custom_user_set',
        blank=True,
        verbose_name='user permissions',
        help_text='Specific permissions for this user.',
    )

    def follow(self, user):
        """주어진 사용자를 팔로우합니다."""
        if not self.is_following(user):
            self.following.add(user)

    def unfollow(self, user):
        """주어진 사용자를 언팔로우합니다."""
        self.following.remove(user)

    def is_following(self, user):
        """주어진 사용자를 팔로우하고 있는지 확인합니다."""
        return self.following.filter(pk=user.pk).exists()