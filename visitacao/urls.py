from django.urls import path
from . import views

app_name = 'visitacao'

urlpatterns = [
    path('', views.lista_visitas, name='lista_visitas'),
    path('nova/', views.nova_visita, name='nova_visita'),
    path('editar/<int:visita_id>/', views.editar_visita, name='editar_visita'),
    path('excluir/<int:visita_id>/', views.excluir_visita, name='excluir_visita'),
    path('agendar/<int:data_id>/<int:doador_id>/', views.agendar_visita, name='agendar_visita'),
]