from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.exceptions import PermissionDenied
from .models import Mensagem
from beneficiarios.models import Beneficiario
from usuarios.models import Usuario

@login_required
def listar_mensagens(request):
    if request.user.tipo_usuario == 'doador':
        mensagens = Mensagem.objects.filter(remetente=request.user).order_by('-id')
        context = {
            'mensagens': mensagens,
            'beneficiarios_disponiveis': Beneficiario.objects.filter(ativo=True)
        }
        return render(request, 'mensagens/listar_mensagens.html', context)
    else:
        raise PermissionDenied

@login_required
def criar_mensagem(request):
    if request.user.tipo_usuario != 'doador':
        raise PermissionDenied

    if request.method == 'POST':
        destinatario_id = request.POST.get('destinatario')
        assunto = request.POST.get('assunto')
        conteudo = request.POST.get('conteudo')

        try:
            destinatario = Beneficiario.objects.get(id=destinatario_id, ativo=True)
            nova_mensagem = Mensagem.objects.create(
                remetente=request.user,
                destinatario=destinatario,
                assunto=assunto,
                conteudo=conteudo,
                status=Mensagem.STATUS_AGUARDANDO
            )
            messages.success(request, 'Mensagem enviada com sucesso! Aguarde aprovação.')
            return redirect('mensagens:listar')
        except Beneficiario.DoesNotExist:
            messages.error(request, 'Beneficiário selecionado não encontrado.')
        except Exception as e:
            messages.error(request, f'Erro ao enviar mensagem: {str(e)}')

    return redirect('mensagens:listar')

@login_required
def aprovar_mensagens(request):
    if request.user.tipo_usuario != 'gestor':
        raise PermissionDenied

    mensagens_pendentes = Mensagem.objects.filter(status=Mensagem.STATUS_AGUARDANDO).order_by('-id')

    if request.method == 'POST':
        mensagem_id = request.POST.get('mensagem_id')
        acao = request.POST.get('acao')
        motivo = request.POST.get('motivo', '')

        try:
            mensagem = Mensagem.objects.get(id=mensagem_id)
            if acao == 'aprovar':
                mensagem.aprovar(request.user)
                messages.success(request, 'Mensagem aprovada com sucesso!')
            elif acao == 'rejeitar':
                mensagem.rejeitar(request.user, motivo)
                messages.success(request, 'Mensagem rejeitada com sucesso!')
        except Mensagem.DoesNotExist:
            messages.error(request, 'Mensagem não encontrada.')
        except Exception as e:
            messages.error(request, f'Erro ao processar mensagem: {str(e)}')

        return redirect('mensagens:aprovar')

    context = {
        'mensagens_pendentes': mensagens_pendentes
    }
    return render(request, 'mensagens/aprovar_mensagens.html', context)

@login_required
def visualizar_mensagem(request, mensagem_id):
    mensagem = get_object_or_404(Mensagem, id=mensagem_id)
    
    if not (request.user == mensagem.remetente or 
            request.user.tipo_usuario == 'gestor'):
        raise PermissionDenied

    context = {
        'mensagem': mensagem
    }
    return render(request, 'mensagens/visualizar_mensagem.html', context)

@login_required
def mensagens_beneficiario(request):
    if not hasattr(request.user, 'beneficiario'):
        raise PermissionDenied

    mensagens = Mensagem.objects.filter(
        destinatario=request.user.beneficiario,
        status=Mensagem.STATUS_APROVADO
    ).order_by('-id')

    context = {
        'mensagens': mensagens
    }
    return render(request, 'mensagens/mensagens_beneficiario.html', context)