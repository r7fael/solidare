from django.urls import path
from . import views

app_name = 'doacoes'

urlpatterns = [
    path('minhas-doacoes/', views.minhas_doacoes, name='minhas_doacoes'),
    path('nova-doacao/', views.nova_doacao, name='nova_doacao'),
]