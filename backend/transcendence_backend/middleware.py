# transcendence_backend/middleware.py

from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from urllib.parse import parse_qs
from django.utils.functional import LazyObject

class LazyAnonymousUser(LazyObject):
    def _setup(self):
        from django.contrib.auth.models import AnonymousUser
        self._wrapped = AnonymousUser()

lazy_anonymous_user = LazyAnonymousUser()

@database_sync_to_async
def get_user(token_key):
    from rest_framework_simplejwt.tokens import AccessToken
    from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

    try:
        access_token = AccessToken(token_key)
        User = get_user_model()
        user = User.objects.get(id=access_token['user_id'])
        return user
    except (InvalidToken, TokenError, User.DoesNotExist):
        return lazy_anonymous_user

class JWTAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        if scope["type"] == "websocket":
            query_string = scope['query_string'].decode()
            query_params = parse_qs(query_string)
            token = query_params.get('token', [None])[0]

            if token:
                scope['user'] = await get_user(token)
            else:
                scope['user'] = lazy_anonymous_user
        
        return await self.inner(scope, receive, send)