from django.urls import path
from . import views

app_name = 'relatorios'

urlpatterns = [
    path('impacto-doacoes/', views.relatorio_impacto_doacoes, name='relatorio_impacto_doacoes'),
    path('impacto-doacoes/exportar-pdf/', views.exportar_relatorio_impacto_pdf, name='exportar_relatorio_impacto_pdf'),
    path('criar-manual/', views.criar_relatorio_manual, name='criar_relatorio_manual'),
]