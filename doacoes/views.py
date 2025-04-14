from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from .models import Doacao
from django.db.models import Sum

@login_required
def minhas_doacoes(request):
    if not request.user.tipo_usuario == 'doador':
        messages.error(request, "Acesso restrito a doadores")
        return redirect('pagina_inicial')
    
    doacoes = Doacao.objects.filter(doador=request.user).order_by('-id')
    total_doacoes = doacoes.filter(status='CONCLUIDO').aggregate(Sum('valor'))['valor__sum'] or 0
    ultimas_doacoes = doacoes[:5]
    
    context = {
        'doacoes': doacoes,
        'ultimas_doacoes': ultimas_doacoes,
        'total_doacoes': total_doacoes,
        'pessoas_impactadas': doacoes.filter(status='CONCLUIDO').count() * 3,
        'taxa_empregabilidade': 85,
    }
    return render(request, 'doacoes/minhas_doacoes.html', context)

@login_required
def nova_doacao(request):
    if not request.user.tipo_usuario == 'doador':
        messages.error(request, "Acesso restrito a doadores")
        return redirect('pagina_inicial')
    
    if request.method == 'POST':
        try:
            valor = float(request.POST.get('valor', '0').replace(',', '.'))
            Doacao.objects.create(
                doador=request.user,
                valor=valor,
                metodo=request.POST.get('metodo'),
                destino=request.POST.get('destino')
            )
            messages.success(request, "Doação registrada com sucesso!")
        except ValueError:
            messages.error(request, "Valor inválido")
    
    return redirect('minhas_doacoes')