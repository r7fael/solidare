from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.utils import timezone
from datetime import datetime
from .models import DataVisitacao
from usuarios.models import Doador
from django.core.exceptions import ValidationError

def lista_visitas(request):
    visitas = DataVisitacao.objects.all().prefetch_related('doadores_presentes').order_by('data')
    return render(request, 'gestores/painel.html', {'visitas': visitas})


def nova_visita(request):
    if request.method == 'POST':
        try:
            data_str = request.POST.get('data')
            capacidade = int(request.POST.get('capacidade_maxima', 0))

            if not data_str or capacidade <= 0:
                messages.error(request, 'Preencha todos os campos corretamente!')
                return redirect('usuarios:painel_gestor')

            data_obj = datetime.strptime(data_str, '%Y-%m-%d').date()

            visita = DataVisitacao(
                data=data_obj,
                capacidade_maxima=capacidade
            )

            visita.full_clean()

            visita.save()
            
            messages.success(request, 'Visitação agendada com sucesso!')
            return redirect('usuarios:painel_gestor')
            
        except ValueError:
            messages.error(request, 'Valores inválidos fornecidos.')
            return redirect('usuarios:painel_gestor')
        except ValidationError as e:
            messages.error(request, f'Dados inválidos: {", ".join(e.messages)}')
            return redirect('usuarios:painel_gestor')
        except Exception as e:
            messages.error(request, f'Erro ao agendar visita: {str(e)}')
            return redirect('usuarios:painel_gestor')
    
    return redirect('usuarios:painel_gestor')

def agendar_visita(request, data_id, doador_id):
    visita = get_object_or_404(DataVisitacao, pk=data_id)
    doador = get_object_or_404(Doador, pk=doador_id)
    
    if visita.status == 'esgotado':
        messages.error(request, 'Esta visita já está com todas as vagas preenchidas.')
    elif visita.doadores_presentes.filter(id=doador.id).exists():
        messages.warning(request, 'Você já está agendado para esta visita.')
    else:
        visita.doadores_presentes.add(doador)
        
        if visita.doadores_presentes.count() >= visita.capacidade_maxima:
            visita.status = 'esgotado'
            visita.save()
        
        messages.success(request, f'Doador {doador.nome} agendado com sucesso para {visita.data}!')
    
    return redirect('usuarios:painel_doador')

def editar_visita(request, visita_id):
    visita = get_object_or_404(DataVisitacao, pk=visita_id)
    
    if request.method == 'POST':
        try:
            data = request.POST.get('data')
            capacidade = int(request.POST.get('capacidade_maxima'))

            data_obj = datetime.strptime(data, '%Y-%m-%d').date()

            if data_obj < timezone.now().date():
                messages.error(request, 'Não é possível agendar visitas para datas passadas.')
                return redirect('usuarios:painel_gestor')

            if DataVisitacao.objects.filter(data=data_obj).exclude(id=visita.id).exists():
                messages.error(request, 'Já existe outra visita agendada para esta data.')
                return redirect('usuarios:painel_gestor')
                
            visita.data = data_obj
            visita.capacidade_maxima = capacidade
            
            if visita.doadores_presentes.count() >= capacidade:
                visita.status = 'esgotado'
            else:
                visita.status = 'disponivel'
                
            visita.save()
            
            messages.success(request, 'Visitação atualizada com sucesso!')
            return redirect('usuarios:painel_gestor')
            
        except ValueError as e:
            messages.error(request, f'Erro ao processar os dados: {str(e)}')
            return redirect('usuarios:painel_gestor')
    
    return redirect('usuarios:painel_gestor')

def excluir_visita(request, visita_id):
    visita = get_object_or_404(DataVisitacao, pk=visita_id)
    
    if request.method == 'POST':
        visita.delete()
        messages.success(request, 'Visitação excluída com sucesso!')
    
    return redirect('usuarios:painel_gestor')

def agendar_doador(request, visita_id, doador_id):
    visita = get_object_or_404(DataVisitacao, pk=visita_id)
    doador = get_object_or_404(Doador, pk=doador_id)
    
    if visita.status == 'esgotado':
        messages.error(request, 'Esta visita já está com todas as vagas preenchidas.')
    elif visita.doadores_presentes.filter(id=doador.id).exists():
        messages.warning(request, 'Este doador já está agendado para esta visita.')
    else:
        visita.doadores_presentes.add(doador)
        
        if visita.doadores_presentes.count() >= visita.capacidade_maxima:
            visita.status = 'esgotado'
            visita.save()
        
        messages.success(request, 'Doador agendado com sucesso!')
    
    return redirect('usuarios:painel_gestor')