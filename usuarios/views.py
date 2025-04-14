from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import Usuario, Doador, Gestor

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
    return render(request, 'doadores/painel.html')

@login_required
def painel_gestor(request):
    return render(request, 'gestores/painel.html')

def logout_usuario(request):
    logout(request)
    return redirect('login')