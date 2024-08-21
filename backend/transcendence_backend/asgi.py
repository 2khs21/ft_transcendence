import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'transcendence_backend.settings')

# Django 앱이 로드된 후에 chat.routing과 game.routing을 임포트합니다.
from chat.routing import websocket_urlpatterns as chat_websocket_urlpatterns
from game.routing import websocket_urlpatterns as game_websocket_urlpatterns

# 두 라우팅 파일의 웹소켓 패턴을 병합합니다.
websocket_urlpatterns = chat_websocket_urlpatterns + game_websocket_urlpatterns

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            websocket_urlpatterns
        )
    ),
})
