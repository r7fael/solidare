from django.urls import path
from . import views

app_name = 'mensagens'

urlpatterns = [
    path('', views.listar_mensagens, name='listar'),
    path('nova/', views.criar_mensagem, name='nova_mensagem'),
    path('aprovar/', views.aprovar_mensagens, name='aprovar'),
    path('visualizar/<int:mensagem_id>/', views.visualizar_mensagem, name='visualizar'),
    path('beneficiario/', views.mensagens_beneficiario, name='beneficiario'),
]