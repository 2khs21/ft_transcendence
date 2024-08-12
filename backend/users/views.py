from django.contrib.auth.models import User #User 모델을 사용하기 위함
from rest_framework import generics

from .serializers import RegisterSerializer

class RegisterView(generics.CreateAPIView):
	# CreateAPIView : POST 요청에 대해 create 메서드를 호출하여 새로운 리소스를 생성
	queryset = User.objects.all()
	serializer_class = RegisterSerializer