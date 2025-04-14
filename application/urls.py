from django.urls import path
from . import views

urlpatterns = [
    path('painel-doador/', views.painel_doador, name='painel_doador'),
    path('painel-gestor/', views.painel_gestor, name='painel_gestor'),
]