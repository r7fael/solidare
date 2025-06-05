from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import Campanha
from doacoes.models import Doacao 
from decimal import Decimal, InvalidOperation
from django.urls import reverse

@login_required
def listar_campanhas(request):
    if request.user.tipo_usuario != 'doador':
        messages.error(request, "Acesso restrito a doadores.")
        if request.user.is_authenticated and request.user.tipo_usuario == 'gestor':
            return redirect('usuarios:painel_gestor')
        return redirect('usuarios:login')

    secao_campanhas_doador = 'campanhas-doador'

    if request.method == 'POST':
        campanha_id_doacao = request.POST.get('campanha_id_doacao')
        
        valor_str_key = f'valor_campanha_{campanha_id_doacao}'
        metodo_pagamento_key = f'metodo_campanha_{campanha_id_doacao}'

        valor_str = request.POST.get(valor_str_key, '').replace('.', '').replace(',', '.')
        metodo_pagamento = request.POST.get(metodo_pagamento_key)

        if not campanha_id_doacao:
             messages.error(request, "ID da campanha não fornecido.")
             try:
                return redirect(reverse('usuarios:painel_doador_secao', kwargs={'secao_nome': secao_campanhas_doador}))
             except Exception:
                return redirect('usuarios:painel_doador')

        if not valor_str or not metodo_pagamento:
            messages.error(request, "Valor e método de pagamento são obrigatórios.")
        else:
            try:
                campanha_para_doar = get_object_or_404(Campanha, id=campanha_id_doacao, ativa=True)
                valor = Decimal(valor_str)

                if valor <= Decimal('0.00'):
                    messages.error(request, "O valor da doação deve ser positivo.")
                else:
                    Doacao.objects.create(
                        doador=request.user,
                        valor=valor,
                        metodo=metodo_pagamento,
                        campanha=campanha_para_doar,
                        status='PENDENTE',
                    )
                    messages.success(request, f"Sua intenção de doação de R${valor:.2f} para a campanha '{campanha_para_doar.nome}' foi registrada!")
            
            except (ValueError, InvalidOperation):
                messages.error(request, "Valor inválido. Use o formato 1.234,56")
            except Campanha.DoesNotExist:
                messages.error(request, "Campanha não encontrada ou não está ativa.")
            except Exception as e:
                messages.error(request, f"Erro ao registrar doação: {str(e)}")
        
        try:
            return redirect(reverse('usuarios:painel_doador_secao', kwargs={'secao_nome': secao_campanhas_doador}))
        except Exception:
            return redirect('usuarios:painel_doador')

    try:
        return redirect(reverse('usuarios:painel_doador_secao', kwargs={'secao_nome': secao_campanhas_doador}))
    except Exception:
        return redirect('usuarios:painel_doador')


@login_required
def criar_campanha(request):
    secao_campanhas_gestor = 'campanhas-gestor'

    if request.user.tipo_usuario != 'gestor':
        messages.error(request, "Apenas gestores podem criar campanhas.")
        return redirect('painel_doador' if request.user.tipo_usuario == 'doador' else 'login')

    if request.method == 'POST':
        nome = request.POST.get('nome')
        descricao = request.POST.get('descricao')
        meta_str = request.POST.get('meta_arrecadacao','0').replace('.', '').replace(',', '.')
        data_fim_str = request.POST.get('data_fim') 

        if not nome or not descricao or not meta_str:
            messages.error(request, "Nome, descrição e meta são obrigatórios.")
        else:
            try:
                meta = Decimal(meta_str)
                if meta <= Decimal('0.00'):
                    messages.error(request, "A meta de arrecadação deve ser positiva.")
                else:
                    nova_campanha = Campanha(
                        nome=nome,
                        descricao=descricao,
                        meta_arrecadacao=meta,
                        gestor_responsavel=request.user,
                        ativa=True 
                    )
                    if data_fim_str:
                        nova_campanha.data_fim = data_fim_str
                    
                    nova_campanha.save()
                    messages.success(request, f"Campanha '{nome}' criada com sucesso!")
            except (ValueError, InvalidOperation):
                messages.error(request, "Meta de arrecadação inválida.")
            except Exception as e:
                messages.error(request, f"Erro ao criar campanha: {e}")
        
        return redirect('campanhas:listar_campanhas_gestor')

    try:
        return redirect(reverse('usuarios:painel_gestor_secao', kwargs={'secao_nome': secao_campanhas_gestor}))
    except Exception:
        return redirect('usuarios:painel_gestor')


@login_required
def listar_campanhas_gestor(request):
    if not request.user.is_authenticated or request.user.tipo_usuario != 'gestor':
        messages.error(request, "Acesso restrito a gestores.")
        return redirect('login' if not request.user.is_authenticated else 'painel_doador')

    secao_campanhas_painel = 'campanhas-gestor' 
    try:
        url_painel_secao_campanhas = reverse('usuarios:painel_gestor_secao', kwargs={'secao_nome': secao_campanhas_painel})
        return redirect(url_painel_secao_campanhas)
    except Exception:
        messages.info(request, "Redirecionando para o painel do gestor.")
        return redirect('usuarios:painel_gestor')


@login_required
def editar_campanha(request, campanha_id):
    secao_campanhas_gestor = 'campanhas-gestor'

    if request.user.tipo_usuario != 'gestor':
        messages.error(request, "Acesso não permitido.")
        return redirect('painel_doador' if request.user.tipo_usuario == 'doador' else 'login')

    campanha = get_object_or_404(Campanha, id=campanha_id)
    if campanha.gestor_responsavel != request.user and not request.user.is_superuser:
        messages.error(request, "Você não tem permissão para editar esta campanha.")
        try:
            return redirect(reverse('usuarios:painel_gestor_secao', kwargs={'secao_nome': secao_campanhas_gestor}))
        except: return redirect('usuarios:painel_gestor')


    if request.method == 'POST':
        nome = request.POST.get('nome')
        descricao = request.POST.get('descricao')
        meta_str = request.POST.get('meta_arrecadacao','0').replace('.', '').replace(',', '.')
        data_fim_str = request.POST.get('data_fim')
        ativa = request.POST.get('ativa') == 'on' 

        if not nome or not descricao or not meta_str:
            messages.error(request, "Nome, descrição e meta são obrigatórios.")
        else:
            try:
                meta = Decimal(meta_str)
                if meta <= Decimal('0.00'):
                    messages.error(request, "A meta de arrecadação deve ser positiva.")
                else:
                    campanha.nome = nome
                    campanha.descricao = descricao
                    campanha.meta_arrecadacao = meta
                    campanha.ativa = ativa
                    if data_fim_str:
                        campanha.data_fim = data_fim_str
                    else:
                        campanha.data_fim = None
                    campanha.save()
                    messages.success(request, f"Campanha '{campanha.nome}' atualizada com sucesso!")
            except (ValueError, InvalidOperation):
                messages.error(request, "Meta de arrecadação inválida.")
            except Exception as e:
                messages.error(request, f"Erro ao atualizar campanha: {e}")
        
        return redirect('campanhas:listar_campanhas_gestor')
    
    try:
        return redirect(reverse('usuarios:painel_gestor_secao', kwargs={'secao_nome': secao_campanhas_gestor}))
    except Exception:
        return redirect('usuarios:painel_gestor')