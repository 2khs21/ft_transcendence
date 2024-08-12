from django.contrib.auth.models import User #User 모델을 사용하기 위함
from django.contrib.auth.password_validation import validate_password
# 장고의 기본 패스워드 검증 도구

from rest_framework import serializers
from rest_framework.authtoken.models import Token # Token 모델
from rest_framework.validators import UniqueValidator # 이메일 중복 방지를 위한 도구

class RegisterSerializer(serializers.ModelSerializer):
		email = serializers.EmailField(
						required=True,
						validators=[UniqueValidator(queryset=User.objects.all())] # 이메일 중복 방지를 위한 도구
						)
		username = serializers.CharField(
						validators=[UniqueValidator(queryset=User.objects.all())] # 이름 중복 검사를 위한 도구
						)
		password = serializers.CharField(
			write_only=True,
			required=True,
			validators=[validate_password]
			)
		password2 = serializers.CharField(
			write_only=True,
			required=True,
			)
		
		class Meta:
				model = User
				fields = ('username', 'password', 'password2', 'email')

		def validate(self, data):
			if data['password'] != data['password2']:
				raise serializers.ValidationError({"password": "Password fields didn't match."})
				# raise : 클라이언트에 에러 메세지 보냄
			return data
		
		def create(self, validated_data):
			# CREATE 요청에 대해 create 메서드를 오버라이딩, 유저를 생성하고 토큰을 생성하게 함.
			user = User.objects.create_user(
				validated_data['username'],
				validated_data['email'],
				validated_data['password']
				)
			user.set_password(validated_data['password'])
			# 비밀번호를 해싱하여 저장
			user.save()
			token = Token.objects.create(user=user)
			# DRF의 기본 인증 방법 중 하나인 토큰 인증을 사용하기 위해 토큰을 생성합니다. 이 토큰은 이후 API 요청 시 사용자가 인증할 때 사용됩니다.
			# 새로 생성된 Token 인스턴스의 user 필드에 user 변수로 전달된 사용자 객체를 할당합니다.
			return user