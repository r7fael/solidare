from django.urls import path
from .views import criar_relatorio

urlpatterns = [
    path('criar-relatorio/', criar_relatorio, name='criar_relatorio'),
]