from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.http import require_POST
from .models import Beneficiario
from django.contrib import messages
from django.views.decorators.csrf import csrf_protect

def listar_beneficiarios(request):
    beneficiarios = Beneficiario.objects.all()
    return render(request, 'application/gestor_beneficiarios.html', {
        'beneficiarios': beneficiarios
    })


def cadastrar_beneficiario(request):
    if request.method == 'POST':
        try:
            Beneficiario.objects.create(
                nome=request.POST['nome'],
                idade=request.POST['idade'],
                nome_responsavel=request.POST.get('nome_responsavel'),
                telefone_responsavel=request.POST.get('telefone_responsavel'),
                email_responsavel=request.POST.get('email_responsavel'),
                observacoes=request.POST.get('observacoes', ''),
                ativo=request.POST.get('ativo', 'off') == 'on'
            )
            return redirect('usuarios:painel_gestor')
        except Exception as e:
            return redirect('usuarios:painel_gestor')
    
    return redirect('usuarios:painel_gestor')


@csrf_protect
@require_POST
def editar_beneficiario(request):
    try:
        beneficiario_id = request.POST.get('beneficiario_id')
        if not beneficiario_id:
            messages.error(request, 'ID do beneficiário não fornecido')
            return redirect('usuarios:painel_gestor')
            
        beneficiario = get_object_or_404(Beneficiario, id=beneficiario_id)
        
        beneficiario.nome = request.POST.get('nome', beneficiario.nome)
        beneficiario.idade = request.POST.get('idade', beneficiario.idade)
        beneficiario.nome_responsavel = request.POST.get('nome_responsavel', beneficiario.nome_responsavel)
        beneficiario.telefone_responsavel = request.POST.get('telefone_responsavel', beneficiario.telefone_responsavel)
        beneficiario.email_responsavel = request.POST.get('email_responsavel', beneficiario.email_responsavel)
        beneficiario.observacoes = request.POST.get('observacoes', beneficiario.observacoes)
        beneficiario.ativo = request.POST.get('ativo') == 'true'
        
        beneficiario.save()
        messages.success(request, 'Beneficiário atualizado com sucesso!')
    except Exception as e:
        messages.error(request, f'Erro ao atualizar beneficiário: {str(e)}')
    
    return redirect('usuarios:painel_gestor')
