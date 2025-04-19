from django.shortcuts import redirect
from relatorios.models import Relatorio

def criar_relatorio(request):
    if request.method == 'POST':
        titulo = request.POST.get('titulo')
        descricao = request.POST.get('descricao')

        Relatorio.objects.create(
            gestor=request.user,
            titulo=titulo,
            descricao=descricao,
        )

        return redirect('gestores/painel.html')