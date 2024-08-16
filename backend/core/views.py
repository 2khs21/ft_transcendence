#core/view.py
from django.http import JsonResponse
from django.middleware.csrf import get_token

def set_csrf_token(request):
    """
    Generates a new CSRF token and returns it as JSON.
    """
    csrf_token = get_token(request)
    return JsonResponse({'csrfToken': csrf_token})