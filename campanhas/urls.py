from django.urls import path
from . import views

app_name = 'campanhas'

urlpatterns = [
    path('', views.listar_campanhas, name='listar_campanhas'),
    path('gestao/nova/', views.criar_campanha, name='criar_campanha'),
    path('gestao/', views.listar_campanhas_gestor, name='listar_campanhas_gestor'),
    path('gestao/editar/<int:campanha_id>/', views.editar_campanha, name='editar_campanha'),
]