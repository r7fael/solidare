from django.urls import path
from . import views

app_name = 'mensagens'

urlpatterns = [
    path('', views.listar_mensagens, name='listar'),
    path('moderacao/', views.painel_moderacao, name='painel_moderacao'),
    path('aprovar/<int:mensagem_id>/', views.aprovar_mensagem, name='aprovar_mensagem'),
    path('rejeitar/<int:mensagem_id>/', views.rejeitar_mensagem, name='rejeitar_mensagem'),
    path('detalhes/<int:mensagem_id>/', views.detalhes_mensagem, name='detalhes_mensagem'),
    path('nova/', views.criar_mensagem, name='criar_mensagem'),
]