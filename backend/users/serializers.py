from django.contrib.auth.models import User #User 모델을 사용하기 위함
from django.contrib.auth.password_validation import validate_password
# 장고의 기본 패스워드 검증 도구

from rest_framework import serializers
from rest_framework.authtoken.models import Token # Token 모델
from rest_framework.validators import UniqueValidator # 이메일 중복 방지를 위한 도구
from django.contrib.auth import authenticate
# Django의 기본 authenticate 함수
# 우리가 설정한 DefaultAuthBackend인 TokenAuth 방식으로 유저를 인증해줌

from django.contrib.auth import get_user_model
User = get_user_model()  # 현재 프로젝트의 User 모델을 가져옵니다.

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
		
# class LoginSerializer(serializers.Serializer):
# 		username = serializers.CharField(required=True)
# 		password = serializers.CharField(required=True, write_only=True)
# 		# write_only=True : 클라이언트->서버 역직력화는 가능, 서버->클라이언트 방향의 직렬화는 불가능
		
# 		def validate(self, data):
# 			user = authenticate(username=data['username'], password=data['password'])
# 			if user:
# 				token = Token.objects.get(user=user) # 토큰에서 유저 찾아 응답
# 				return token
# 			else:
# 				raise serializers.ValidationError(
# 					{"error":"Unable to log in with provided credentials."}
# 					)

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)
    
    def validate(self, data):
        user = authenticate(username=data['username'], password=data['password'])
        if user:
            token = Token.objects.get(user=user)
            return {"token": token.key}  # 토큰 키를 딕셔너리로 반환
        else:
            raise serializers.ValidationError(
                {"error": "Unable to log in with provided credentials."}
            )
				
class FollowSerializer(serializers.Serializer):
    username = serializers.CharField()

    def validate_username(self, value):
        """
        입력된 username이 실제로 존재하는지 검증합니다.
        """
        try:
            User.objects.get(username=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("User does not exist")
        return value