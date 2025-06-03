from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.db.models import Sum, Count, F
from .models import Doacao
from django.contrib.auth.decorators import login_required
from campanhas.models import Campanha
from decimal import Decimal, InvalidOperation

@login_required 
def minhas_doacoes(request):
    if not request.user.is_authenticated:
        return redirect('usuarios:login')
    
    if request.GET.get('aceitar_todas') == '1':
        doacoes_a_aceitar = Doacao.objects.filter(doador=request.user, status='PENDENTE')
        
        campanhas_para_atualizar = {}

        for doacao_obj in doacoes_a_aceitar:
            doacao_obj.status = 'CONCLUIDO'
            if doacao_obj.campanha:
                if doacao_obj.campanha.id not in campanhas_para_atualizar:
                    campanhas_para_atualizar[doacao_obj.campanha.id] = Decimal('0.00')
                campanhas_para_atualizar[doacao_obj.campanha.id] += doacao_obj.valor

        ids_doacoes_aceitas = list(doacoes_a_aceitar.values_list('id', flat=True))
        if ids_doacoes_aceitas:
            Doacao.objects.filter(id__in=ids_doacoes_aceitas).update(status='CONCLUIDO')

            for campanha_id, valor_adicional in campanhas_para_atualizar.items():
                Campanha.objects.filter(id=campanha_id).update(
                    valor_arrecadado=F('valor_arrecadado') + valor_adicional
                )
            messages.success(request, "Todas as doações pendentes foram confirmadas!")
        else:
            messages.info(request, "Nenhuma doação pendente para confirmar.")
        return redirect('doacoes:minhas_doacoes')
    
    doacoes = Doacao.objects.filter(doador=request.user).select_related('campanha').order_by('-data_doacao')
    doacoes_concluidas = doacoes.filter(status='CONCLUIDO')
    total_doacoes_valor = doacoes_concluidas.aggregate(Sum('valor'))['valor__sum'] or Decimal('0.00')

    metodo_mais_usado_qs = doacoes.values('metodo').annotate(count=Count('metodo')).order_by('-count').first()
    metodo_mais_usado = dict(Doacao.METODO_PAGAMENTO).get(metodo_mais_usado_qs['metodo']) if metodo_mais_usado_qs else 'Nenhum'
    
    destino_mais_frequente_qs = doacoes.filter(campanha__isnull=True, destino__isnull=False).values('destino').annotate(
        count=Count('destino')
    ).order_by('-count').first()
    destino_mais_frequente = dict(Doacao.DESTINO_CHOICES).get(destino_mais_frequente_qs['destino']) if destino_mais_frequente_qs else 'Nenhum (ou campanhas)'

    context = {
        'doacoes': doacoes,
        'ultimas_doacoes': doacoes[:5],
        'total_doacoes': total_doacoes_valor, 
        'pessoas_impactadas': doacoes_concluidas.count() * 3, 
        'doacoes_concluidas_count': doacoes_concluidas.count(), 
        'media_doacoes': (total_doacoes_valor / doacoes_concluidas.count()) if doacoes_concluidas.count() > 0 else Decimal('0.00'),
        'metodo_mais_usado': metodo_mais_usado,
        'destino_mais_frequente': destino_mais_frequente,
        'destinos_disponiveis': Doacao.DESTINO_CHOICES, 
    }
    
    return render(request, 'doacoes/minhas_doacoes.html', context)

def nova_doacao(request):
    if not request.user.is_authenticated:
        return redirect('usuarios:login')
    
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

@login_required
def aceitar_doacao(request, doacao_id):
    if not request.user.is_authenticated:
        return redirect('usuarios:login')
    
    try:
        doacao = get_object_or_404(Doacao, id=doacao_id)

        if doacao.doador != request.user and not request.user.is_staff:
             messages.error(request, "Você não tem permissão para modificar esta doação.")
             return redirect('doacoes:minhas_doacoes')

        if doacao.status == 'PENDENTE':
            doacao.status = 'CONCLUIDO'
            doacao.save(update_fields=['status']) 

            if doacao.campanha:
                Campanha.objects.filter(id=doacao.campanha.id).update(
                    valor_arrecadado=F('valor_arrecadado') + doacao.valor
                )
            messages.success(request, "Doação confirmada com sucesso!")
        else:
            messages.warning(request, "Esta doação já foi processada.")
            
    except Doacao.DoesNotExist:
        messages.error(request, "Doação não encontrada")
    except Exception as e:
        messages.error(request, f"Erro ao confirmar doação: {str(e)}")

    if request.user.is_staff and request.user.tipo_usuario == 'gestor':
        return redirect(request.META.get('HTTP_REFERER', 'painel_gestor'))
    return redirect('doacoes:minhas_doacoes')

@login_required
def todas_as_doacoes(request):
    if not request.user.is_staff:
        return redirect('usuarios:login')

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