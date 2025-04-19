from django.urls import path
from . import views

app_name = 'doacoes'

urlpatterns = [
    path('minhas-doacoes/', views.minhas_doacoes, name='minhas_doacoes'),
    path('nova-doacao/', views.nova_doacao, name='nova_doacao'),
    path('aceitar-doacao/<int:doacao_id>/', views.aceitar_doacao, name='aceitar_doacao'),
    path('todas/', views.todas_as_doacoes, name='todas_as_doacoes'),
]