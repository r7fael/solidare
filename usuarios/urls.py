from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_usuario, name='login'),
    path('registro/', views.registrar_usuario, name='registro'),
    path('logout/', views.logout_usuario, name='logout'),
    path('painel-doador/', views.painel_doador, name='painel_doador'),
    path('painel-gestor/', views.painel_gestor, name='painel_gestor'),
    path('painel/metricas/', views.metricas_doador, name='metricas_doador'),
]