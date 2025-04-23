from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Sum, Count
from .models import Usuario, Doador, Gestor
from doacoes.models import Doacao
from django.shortcuts import render
from mensagens.models import Mensagem
from beneficiarios.models import Beneficiario
from mensagens.models import Mensagem

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
            return redirect('login')

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
                return redirect('painel_doador')
            else:
                return redirect('painel_gestor')
        else:
            messages.error(request, "Credenciais inválidas", extra_tags='login')

    return render(request, 'usuarios/login.html')

@login_required
def painel_doador(request):
    doacoes = Doacao.objects.filter(doador=request.user).order_by('-id')
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
    
    mensagens_usuario = Mensagem.objects.filter(remetente=request.user).order_by('-id')
    beneficiarios_disponiveis = Beneficiario.objects.filter(ativo=True)
    
    if request.method == 'POST' and 'nova_mensagem' in request.POST:
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
            messages.success(request, 'Mensagem enviada com sucesso! Aguarde aprovação.')
        except Beneficiario.DoesNotExist:
            messages.error(request, 'Beneficiário selecionado não encontrado.')
        except Exception as e:
            messages.error(request, f'Erro ao enviar mensagem: {str(e)}')
        
        return redirect('usuarios:painel-doador')
    
    context = {
        'doacoes': doacoes,
        'ultimas_doacoes': doacoes[:5],
        'total_doacoes': total_doacoes,
        'pessoas_impactadas': doacoes_concluidas.count() * 3,
        'doacoes_concluidas': doacoes_concluidas.count(),
        'media_doacoes': total_doacoes / doacoes_concluidas.count() if doacoes_concluidas.count() > 0 else 0,
        'metodo_mais_usado': metodo_mais_usado,
        'destino_mais_frequente': destino_mais_frequente,
        'destinos_disponiveis': Doacao.DESTINO_CHOICES,
        'doacoes_pendentes': doacoes.filter(status='PENDENTE').exists(),
        
        'mensagens': mensagens_usuario,
        'beneficiarios_disponiveis': beneficiarios_disponiveis,
        'total_mensagens': mensagens_usuario.count(),
        'mensagens_aprovadas': mensagens_usuario.filter(status=Mensagem.STATUS_APROVADO).count(),
        'mensagens_pendentes': mensagens_usuario.filter(status=Mensagem.STATUS_AGUARDANDO).count()
    }
    
    return render(request, 'doadores/painel.html', context)

@login_required
def metricas_doador(request):
    return render(request, 'doadores/metricas.html')

@login_required
def painel_gestor(request):

    mensagens = Mensagem.objects.select_related('remetente').order_by('-id')
    doacoes = Doacao.objects.select_related('doador').order_by('-id')
    ultimas_doacoes = doacoes[:5] 
    
    doacoes_concluidas = doacoes.filter(status='CONCLUIDO')
    total_doacoes = doacoes_concluidas.aggregate(
        total=Sum('valor'),
        count=Count('id')
    )
    
    beneficiarios_ativos = Beneficiario.objects.filter(ativo=True)

    
    metodo_mais_usado = (
        doacoes.values('metodo')
        .annotate(count=Count('metodo'))
        .order_by('-count')
        .first()
    )
    
    destino_mais_frequente = (
        doacoes.values('destino')
        .annotate(count=Count('destino'))
        .order_by('-count')
        .first()
    )

    context = {
        'doacoes': doacoes,
        'ultimas_doacoes': ultimas_doacoes,
        'beneficiarios': Beneficiario.objects.all(),
        
        'total_doacoes': total_doacoes['total'] or 0,
        'quantidade_doacoes': total_doacoes['count'],
        'media_doacoes': (total_doacoes['total'] / total_doacoes['count']) if total_doacoes['count'] > 0 else 0,
        
        'pessoas_impactadas': total_doacoes['count'] * 3, 
        'doacoes_concluidas': total_doacoes['count'],
        'total_beneficiarios': beneficiarios_ativos.count(),
        
        'destinos_disponiveis': Doacao.DESTINO_CHOICES,
        'metodos_disponiveis': Doacao.METODO_PAGAMENTO,
        
        'metodo_mais_usado': metodo_mais_usado,
        'destino_mais_frequente': destino_mais_frequente,
        
        'relatorios': [],
        
        'mensagens': mensagens,
    }
    
    return render(request, 'gestores/painel.html', context)

def logout_usuario(request):
    logout(request)
    return redirect('login')