from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Sum, Count
from .models import Usuario, Doador, Gestor
from doacoes.models import Doacao

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
            messages.error(request, "Preencha todos os campos")
            return render(request, 'usuarios/login.html')
        
        try:
            usuario = Usuario.objects.get(email=email)
        except Usuario.DoesNotExist:
            usuario = None

        usuario = authenticate(request, username=email, password=senha)
        
        if usuario is not None:
            login(request, usuario)
            return redirect('painel_doador' if usuario.tipo_usuario == 'doador' else 'painel_gestor')
        else:
            messages.error(request, "Credenciais inválidas")
    
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
        'doacoes_pendentes': doacoes.filter(status='PENDENTE').exists()
    }
    
    return render(request, 'doadores/painel.html', context)

@login_required
def metricas_doador(request):
    return render(request, 'doadores/metricas.html')

@login_required
def painel_gestor(request):
    return render(request, 'gestores/painel.html')

def logout_usuario(request):
    logout(request)
    return redirect('login')