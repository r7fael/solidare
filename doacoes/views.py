from django.shortcuts import render, redirect
from django.contrib import messages
from django.db.models import Sum, Count
from .models import Doacao
from django.contrib.auth.decorators import login_required

def minhas_doacoes(request):
    if not request.user.is_authenticated:
        return redirect('login')
    
    if request.GET.get('aceitar_todas') == '1':
        Doacao.objects.filter(doador=request.user, status='PENDENTE').update(status='CONCLUIDO')
        messages.success(request, "Todas as doações pendentes foram aceitas!")
        return redirect('doacoes:minhas_doacoes')
    
    doacoes = Doacao.objects.filter(doador=request.user)
    doacoes_concluidas = doacoes.filter(status='CONCLUIDO')
    total_doacoes = doacoes_concluidas.aggregate(Sum('valor'))['valor__sum'] or 0
    
    metodo_mais_usado = doacoes.values('metodo').annotate(
        count=Count('metodo')
    ).order_by('-count').first()
    metodo_mais_usado = dict(Doacao.METODO_PAGAMENTO).get(
        metodo_mais_usado['metodo']) if metodo_mais_usado else 'Nenhum'
    
    destino_mais_frequente = doacoes.values('destino').annotate(
        count=Count('destino')
    ).order_by('-count').first()
    destino_mais_frequente = dict(Doacao.DESTINO_CHOICES).get(
        destino_mais_frequente['destino']) if destino_mais_frequente else 'Nenhum'
    
    context = {
        'doacoes': doacoes.order_by('-id'),
        'ultimas_doacoes': doacoes.order_by('-id')[:5],
        'total_doacoes': total_doacoes,
        'pessoas_impactadas': doacoes_concluidas.count() * 3,
        'doacoes_concluidas': doacoes_concluidas.count(),
        'media_doacoes': total_doacoes / doacoes_concluidas.count() if doacoes_concluidas.count() > 0 else 0,
        'metodo_mais_usado': metodo_mais_usado,
        'destino_mais_frequente': destino_mais_frequente,
        'destinos_disponiveis': Doacao.DESTINO_CHOICES,
    }
    
    return render(request, 'doacoes/minhas_doacoes.html', context)

def nova_doacao(request):
    if not request.user.is_authenticated:
        return redirect('login')
    
    if request.method == 'POST':
        try:
            valor_str = request.POST['valor'].replace('.', '').replace(',', '.')
            valor = float(valor_str)
            
            Doacao.objects.create(
                doador=request.user,
                valor=valor,
                metodo=request.POST['metodo'],
                destino=request.POST['destino'],
                status='PENDENTE'
            )
            messages.success(request, "Doação registrada com sucesso!")
            return redirect('doacoes:minhas_doacoes')
            
        except ValueError:
            messages.error(request, "Valor inválido. Use o formato 1.234,56")
        except Exception as e:
            messages.error(request, f"Erro ao registrar doação: {str(e)}")
    
    return redirect('doacoes:minhas_doacoes')

def aceitar_doacao(request, doacao_id):
    if not request.user.is_authenticated:
        return redirect('login')
    
    try:
        doacao = Doacao.objects.get(id=doacao_id, doador=request.user)
        doacao.status = 'CONCLUIDO'
        doacao.save()
        messages.success(request, "Doação aceita com sucesso!")
    except Doacao.DoesNotExist:
        messages.error(request, "Doação não encontrada")
    
    return redirect('doacoes:minhas_doacoes')

@login_required
def todas_as_doacoes(request):
    if not request.user.is_staff:
        return redirect('login')

    doacoes = Doacao.objects.all()
    doacoes_concluidas = doacoes.filter(status='CONCLUIDO')
    total_doacoes = doacoes_concluidas.aggregate(Sum('valor'))['valor__sum'] or 0

    metodo_mais_usado = doacoes.values('metodo').annotate(
        count=Count('metodo')
    ).order_by('-count').first()
    metodo_mais_usado = dict(Doacao.METODO_PAGAMENTO).get(
        metodo_mais_usado['metodo']) if metodo_mais_usado else 'Nenhum'

    destino_mais_frequente = doacoes.values('destino').annotate(
        count=Count('destino')
    ).order_by('-count').first()
    destino_mais_frequente = dict(Doacao.DESTINO_CHOICES).get(
        destino_mais_frequente['destino']) if destino_mais_frequente else 'Nenhum'

    context = {
        'doacoes': doacoes.order_by('-id'),
        'ultimas_doacoes': doacoes.order_by('-id')[:5],
        'total_doacoes': total_doacoes,
        'pessoas_impactadas': doacoes_concluidas.count() * 3,
        'doacoes_concluidas': doacoes_concluidas.count(),
        'media_doacoes': total_doacoes / doacoes_concluidas.count() if doacoes_concluidas.count() > 0 else 0,
        'metodo_mais_usado': metodo_mais_usado,
        'destino_mais_frequente': destino_mais_frequente,
        'destinos_disponiveis': Doacao.DESTINO_CHOICES,
    }

    return render(request, 'doacoes/todas_as_doacoes.html', context)