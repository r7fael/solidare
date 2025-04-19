from django.urls import path
from . import views

urlpatterns = [
    path('', views.listar_beneficiarios, name='listar_beneficiarios'),
    path('cadastrar-beneficiario/', views.cadastrar_beneficiario, name='cadastrar_beneficiario'),
    path('beneficiarios/editar/', views.editar_beneficiario, name='editar_beneficiario'),
]
