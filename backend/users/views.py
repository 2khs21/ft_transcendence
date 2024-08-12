from django.contrib.auth.models import User #User 모델을 사용하기 위함
from rest_framework import generics, status
from rest_framework.response import Response

from .serializers import RegisterSerializer, LoginSerializer

class RegisterView(generics.CreateAPIView):
	# CreateAPIView : POST 요청에 대해 create 메서드를 호출하여 새로운 리소스를 생성
	queryset = User.objects.all()
	serializer_class = RegisterSerializer

# class LoginView(generics.GenericAPIView):
# 	serializer_class = LoginSerializer

# 	def post(self, request):
# 		serializer = self.get_serializer(data=request.data)
# 		serializer.is_valid(raise_exception=True)
# 		token = serializer.validated_data['token'] #validate()의 리턴값인 Token을 받아옴.
# 		return Response({"token": token.key}, status=status.HTTP_200_OK)
	
class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data['token']  # validate()의 리턴값인 토큰 키를 받아옴.
        return Response({"token": token}, status=status.HTTP_200_OK)