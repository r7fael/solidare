from django.shortcuts import render, redirect, get_object_or_404
from django.db.models import Sum, Count, F
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import Usuario, Doador, Gestor
from doacoes.models import Doacao
from datetime import date
from decimal import Decimal, InvalidOperation
from mensagens.models import Mensagem
from beneficiarios.models import Beneficiario
from visitacao.models import DataVisitacao
from campanhas.models import Campanha

def registrar_usuario(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        senha = request.POST.get('senha')
        cpf = request.POST.get('cpf')
        nome = request.POST.get('nome')
        tipo = request.POST.get('tipo_usuario')

        try:
            usuario = Usuario.objects.create_user(
                email=email,
                password=senha,
                cpf=cpf,
                nome=nome,
                tipo_usuario=tipo
            )

            if tipo == 'doador':
                Doador.objects.create(usuario=usuario)
            elif tipo == 'gestor':
                Gestor.objects.create(usuario=usuario)

            login(request, usuario)
            return redirect('usuarios:login')

        except Exception as e:
            messages.error(request, f'Erro no cadastro: {str(e)}')
            return redirect('registro')

    return render(request, 'usuarios/registro.html')

def login_usuario(request):
    if request.method == 'POST':
        email = request.POST.get('email', '').strip()
        senha = request.POST.get('senha', '')

        if not email or not senha:
            messages.error(request, "Preencha todos os campos", extra_tags='login')
            return render(request, 'usuarios/login.html')

        usuario_autenticado = authenticate(request, username=email, password=senha)

        if usuario_autenticado is not None:
            login(request, usuario_autenticado)
            if usuario_autenticado.tipo_usuario == 'doador':
                return redirect('usuarios:painel_doador')
            else:
                return redirect('usuarios:painel_gestor')
        else:
            messages.error(request, "Credenciais inválidas", extra_tags='login')

    return render(request, 'usuarios/login.html')

@login_required
def painel_doador(request, secao_nome=None):
    doacoes_usuario = Doacao.objects.filter(doador=request.user).select_related('campanha').order_by('-data_doacao')
    doacoes_concluidas_usuario = doacoes_usuario.filter(status='CONCLUIDO')
    total_doado_usuario = doacoes_concluidas_usuario.aggregate(Sum('valor'))['valor__sum'] or Decimal('0.00')

    metodo_mais_usado_qs = doacoes_usuario.values('metodo').annotate(count=Count('metodo')).order_by('-count').first()
    metodo_mais_usado_display = dict(Doacao.METODO_PAGAMENTO).get(metodo_mais_usado_qs['metodo']) if metodo_mais_usado_qs else 'Nenhum'
    
    destino_mais_frequente_qs = doacoes_usuario.filter(campanha__isnull=True, destino__isnull=False).values('destino').annotate(count=Count('destino')).order_by('-count').first()
    destino_mais_frequente_display = dict(Doacao.DESTINO_CHOICES).get(destino_mais_frequente_qs['destino']) if destino_mais_frequente_qs else 'Nenhum (ou campanhas)'

    mensagens_usuario = Mensagem.objects.filter(remetente=request.user).select_related('destinatario').order_by('-data_envio')
    beneficiarios_disponiveis = Beneficiario.objects.filter(ativo=True)

    visitas_disponiveis = DataVisitacao.objects.filter(data__gte=date.today()).annotate(
        vagas_ocupadas=Count('doadores_presentes')
    ).annotate(
        vagas_restantes=F('capacidade_maxima') - F('vagas_ocupadas')
    ).order_by('data')

    visitas_agendadas_usuario = DataVisitacao.objects.filter(
        doadores_presentes=request.user.doador,
        data__gte=date.today()
    ).order_by('data')
    
    campanhas_ativas = Campanha.objects.filter(ativa=True).order_by('-data_inicio')
    metodos_pagamento_doacao = Doacao.METODO_PAGAMENTO


    if request.method == 'POST':
        action = request.POST.get('action')
        if action == 'nova_mensagem_painel':
            destinatario_id = request.POST.get('destinatario')
            assunto = request.POST.get('assunto')
            conteudo = request.POST.get('conteudo')
            try:
                destinatario = Beneficiario.objects.get(id=destinatario_id, ativo=True)
                Mensagem.objects.create(
                    remetente=request.user,
                    destinatario=destinatario,
                    assunto=assunto,
                    conteudo=conteudo,
                    status=Mensagem.STATUS_AGUARDANDO
                )
                messages.success(request, 'Mensagem enviada com sucesso! Aguarde aprovação.', extra_tags='mensagem_feedback')
            except Beneficiario.DoesNotExist:
                messages.error(request, 'Beneficiário selecionado não encontrado.', extra_tags='mensagem_feedback')
            except Exception as e:
                messages.error(request, f'Erro ao enviar mensagem: {str(e)}', extra_tags='mensagem_feedback')
            return redirect('usuarios:painel_doador_secao', secao_nome='mensagens')

        elif action == 'agendar_visita_painel':
            visita_id = request.POST.get('visita_id_form')
            try:
                visita = DataVisitacao.objects.get(id=visita_id, data__gte=date.today())
                if visita.doadores_presentes.count() >= visita.capacidade_maxima:
                    messages.error(request, 'Esta visita já está com todas as vagas preenchidas.')
                elif request.user.doador in visita.doadores_presentes.all():
                    messages.warning(request, 'Você já está agendado para esta visita.')
                else:
                    visita.doadores_presentes.add(request.user.doador)
                    visita.atualizar_status() 
                    visita.save()
                    messages.success(request, f'Visita agendada com sucesso para {visita.data.strftime("%d/%m/%Y")}!')
            except DataVisitacao.DoesNotExist:
                messages.error(request, 'Visita não encontrada ou data já passou.')
            except Exception as e:
                messages.error(request, f'Erro ao agendar visita: {str(e)}')
            return redirect('usuarios:painel_doador_secao', secao_nome='visitas')
    
    context = {
        'doacoes': doacoes_usuario,
        'ultimas_doacoes': doacoes_usuario[:5],
        'total_doacoes': total_doado_usuario,
        'pessoas_impactadas': doacoes_concluidas_usuario.count() * 3,
        'doacoes_concluidas': doacoes_concluidas_usuario.count(),
        'media_doacoes': (total_doado_usuario / doacoes_concluidas_usuario.count()) if doacoes_concluidas_usuario.count() > 0 else Decimal('0.00'),
        'metodo_mais_usado': metodo_mais_usado_display,
        'destino_mais_frequente': destino_mais_frequente_display,
        'destinos_disponiveis': Doacao.DESTINO_CHOICES,
        'doacoes_pendentes': doacoes_usuario.filter(status='PENDENTE').exists(),
        'mensagens': mensagens_usuario,
        'beneficiarios_disponiveis': beneficiarios_disponiveis,
        'total_mensagens': mensagens_usuario.count(),
        'mensagens_aprovadas': mensagens_usuario.filter(status=Mensagem.STATUS_APROVADO).count(),
        'mensagens_pendentes': mensagens_usuario.filter(status=Mensagem.STATUS_AGUARDANDO).count(),
        'visitas_disponiveis': visitas_disponiveis,
        'visitas_agendadas': visitas_agendadas_usuario,
        'total_visitas_agendadas': visitas_agendadas_usuario.count(),
        'campanhas_ativas': campanhas_ativas,
        'metodos_pagamento_doacao': metodos_pagamento_doacao,
        'secao_ativa': secao_nome or 'inicio'
    }
    
    return render(request, 'doadores/painel.html', context)

@login_required
def metricas_doador(request):
    return render(request, 'doadores/metricas.html')

@login_required
def painel_gestor(request, secao_nome=None):
    mensagens_todas = Mensagem.objects.select_related('remetente', 'destinatario').order_by('-data_envio')
    doacoes_todas = Doacao.objects.select_related('doador', 'campanha').order_by('-data_doacao')
    ultimas_doacoes_geral = doacoes_todas[:5] 
    
    doacoes_concluidas_geral = doacoes_todas.filter(status='CONCLUIDO')
    agregado_doacoes_geral = doacoes_concluidas_geral.aggregate(
        total=Sum('valor', default=Decimal('0.00')),
        count=Count('id')
    )
    
    beneficiarios_ativos = Beneficiario.objects.filter(ativo=True)
    todos_beneficiarios = Beneficiario.objects.all()
    visitas_todas = DataVisitacao.objects.all().order_by('data').annotate(
        num_doadores=Count('doadores_presentes')
    )
    
    metodo_mais_usado_geral_qs = doacoes_todas.values('metodo').annotate(count=Count('metodo')).order_by('-count').first()
    metodo_mais_usado_geral_display = dict(Doacao.METODO_PAGAMENTO).get(metodo_mais_usado_geral_qs['metodo']) if metodo_mais_usado_geral_qs else 'Nenhum'
    
    destino_mais_frequente_geral_qs = doacoes_todas.filter(campanha__isnull=True, destino__isnull=False).values('destino').annotate(count=Count('destino')).order_by('-count').first()
    destino_mais_frequente_geral_display = dict(Doacao.DESTINO_CHOICES).get(destino_mais_frequente_geral_qs['destino']) if destino_mais_frequente_geral_qs else 'Nenhum (ou campanhas)'

    todas_as_campanhas = Campanha.objects.all().order_by('-data_inicio')

    context = {
        'doacoes': doacoes_todas,
        'ultimas_doacoes': ultimas_doacoes_geral,
        'beneficiarios': todos_beneficiarios,
        'total_doacoes': agregado_doacoes_geral['total'],
        'quantidade_doacoes': agregado_doacoes_geral['count'],
        'media_doacoes': (agregado_doacoes_geral['total'] / agregado_doacoes_geral['count']) if agregado_doacoes_geral['count'] > 0 else Decimal('0.00'),
        'pessoas_impactadas': agregado_doacoes_geral['count'] * 3, 
        'doacoes_concluidas': agregado_doacoes_geral['count'],
        'total_beneficiarios': beneficiarios_ativos.count(),
        'destinos_disponiveis': Doacao.DESTINO_CHOICES,
        'metodos_disponiveis': Doacao.METODO_PAGAMENTO,
        'metodo_mais_usado': metodo_mais_usado_geral_display,
        'destino_mais_frequente': destino_mais_frequente_geral_display,
        'relatorios': [],
        'mensagens': mensagens_todas,
        'visitas': visitas_todas,
        'todas_as_campanhas': todas_as_campanhas,
        'secao_ativa': secao_nome or 'inicio'
    }
    
    return render(request, 'gestores/painel.html', context)

def logout_usuario(request):
    logout(request)
    return redirect('usuarios:login')