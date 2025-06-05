from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.exceptions import PermissionDenied, ValidationError
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from .models import Mensagem
from beneficiarios.models import Beneficiario
from usuarios.models import Usuario
from django.contrib import messages


def detalhes_mensagem(request, mensagem_id):
    mensagem = get_object_or_404(Mensagem, id=mensagem_id)
    
    if not (request.user == mensagem.remetente or 
            request.user.tipo_usuario == 'gestor' or
            (hasattr(request.user, 'beneficiario') and 
             request.user.beneficiario == mensagem.destinatario)):
        return render(request, '403.html', status=403)

    return render(request, 'mensagens/detalhes_mensagem.html', {
        'mensagem': mensagem
    })

@login_required
def painel_moderacao(request):
    if not request.user.is_gestor:
        messages.error(request, "Acesso restrito a gestores")
        return redirect('home')

    mensagens_pendentes = Mensagem.objects.filter(
        status=Mensagem.STATUS_AGUARDANDO
    ).select_related('remetente', 'destinatario__usuario').order_by('-data_envio')

    return render(request, 'mensagens/painel_moderacao.html', {
        'mensagens_pendentes': mensagens_pendentes
    })

@login_required
def aprovar_mensagem(request, mensagem_id):
    if not request.user.tipo_usuario == 'gestor':
        messages.error(request, "Apenas gestores podem aprovar mensagens")
        return redirect('usuarios:painel_gestor')

    if request.method == 'POST':
        mensagem = get_object_or_404(Mensagem, id=mensagem_id)
        try:
            mensagem.aprovar(request.user)
            messages.success(request, 'Mensagem aprovada com sucesso!')
        except ValidationError as e:
            messages.error(request, str(e))
    
    return redirect('usuarios:painel_gestor')

@login_required
def rejeitar_mensagem(request, mensagem_id):
    if not request.user.tipo_usuario == 'gestor':
        messages.error(request, "Apenas gestores podem rejeitar mensagens")
        return redirect('usuarios:painel_gestor')

    if request.method == 'POST':
        mensagem = get_object_or_404(Mensagem, id=mensagem_id)
        motivo_rejeicao = request.POST.get('motivo_rejeicao', '')
        
        try:
            mensagem.rejeitar(request.user, motivo_rejeicao)
            messages.success(request, 'Mensagem rejeitada com sucesso!')
        except ValidationError as e:
            messages.error(request, str(e))
    
    return redirect('usuarios:painel_gestor')

@login_required
def listar_mensagens(request):
    if request.user.tipo_usuario == 'doador':
        mensagens = Mensagem.objects.filter(remetente=request.user).order_by('-data_envio')
        beneficiarios = Beneficiario.objects.filter(ativo=True).select_related('usuario')
        return render(request, 'mensagens/listar_mensagens.html', {
            'mensagens': mensagens,
            'beneficiarios_disponiveis': beneficiarios,
            'secao': 'mensagens'
        })
    elif request.user.tipo_usuario == 'gestor':
        mensagens = Mensagem.objects.all().order_by('-data_envio')
        return render(request, 'mensagens/gestor/listar_mensagens.html', {
            'mensagens': mensagens,
            'secao': 'mensagens'
        })
    else:
        raise PermissionDenied("Você não tem permissão para acessar esta página")

@login_required
@require_http_methods(["POST"])
@csrf_exempt
def criar_mensagem(request):
    if request.user.tipo_usuario != 'doador':
        raise PermissionDenied("Apenas doadores podem enviar mensagens")

    destinatario_id = request.POST.get('destinatario')
    assunto = request.POST.get('assunto', '').strip()
    conteudo = request.POST.get('conteudo', '').strip()

    if not all([destinatario_id, assunto, conteudo]):
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({'success': False, 'error': 'Todos os campos são obrigatórios'}, status=400)
        messages.error(request, 'Todos os campos são obrigatórios')
        return redirect('application:painel')

    try:
        destinatario = Beneficiario.objects.get(id=destinatario_id, ativo=True)

        mensagem = Mensagem.objects.create(
            remetente=request.user,
            destinatario=destinatario,
            assunto=assunto,
            conteudo=conteudo,
            status=Mensagem.STATUS_AGUARDANDO
        )

        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'success': True,
                'mensagem': {
                    'id': mensagem.id,
                    'assunto': mensagem.assunto,
                    'conteudo': mensagem.conteudo,
                    'status': mensagem.status,
                    'status_display': mensagem.get_status_display(),
                    'data_envio': mensagem.data_envio.strftime("%d/%m/%Y %H:%M"),
                    'destinatario_nome': destinatario.usuario.get_full_name()
                }
            })

        messages.success(request, 'Mensagem enviada com sucesso! Aguarde aprovação.')
    except Beneficiario.DoesNotExist:
        error_msg = 'Beneficiário não encontrado'
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({'success': False, 'error': error_msg}, status=404)
        messages.error(request, error_msg)
    except Exception as e:
        error_msg = f'Erro ao enviar mensagem: {str(e)}'
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({'success': False, 'error': error_msg}, status=500)
        messages.error(request, error_msg)

    return redirect('usuarios:painel_doador')

@login_required
def visualizar_mensagem(request, pk):
    mensagem = get_object_or_404(Mensagem, pk=pk)

    if not (request.user == mensagem.remetente or 
            request.user.tipo_usuario == 'gestor' or
            (hasattr(request.user, 'beneficiario') and 
             request.user.beneficiario == mensagem.destinatario)):
        raise PermissionDenied("Você não tem permissão para ver esta mensagem")

    if (hasattr(request.user, 'beneficiario') and 
        request.user.beneficiario == mensagem.destinatario and
        not mensagem.lida):
        mensagem.lida = True
        mensagem.data_leitura = timezone.now()
        mensagem.save()

    return render(request, 'mensagens/visualizar_mensagem.html', {
        'mensagem': mensagem,
        'secao': 'mensagens'
    })

@login_required
def mensagens_beneficiario(request):
    if not hasattr(request.user, 'beneficiario'):
        raise PermissionDenied("Apenas beneficiários podem acessar esta página")

    mensagens = Mensagem.objects.filter(
        destinatario=request.user.beneficiario,
        status=Mensagem.STATUS_APROVADO
    ).select_related('remetente').order_by('-data_envio')

    nao_lidas = mensagens.filter(lida=False).count()

    return render(request, 'mensagens/beneficiario/mensagens.html', {
        'mensagens': mensagens,
        'nao_lidas': nao_lidas,
        'secao': 'mensagens'
    })

@login_required
@require_http_methods(["POST"])
@csrf_exempt
def verificar_ultima_mensagem(request):
    if request.user.tipo_usuario != 'doador':
        return JsonResponse({'error': 'Unauthorized'}, status=403)

    try:
        ultima_msg = Mensagem.objects.filter(remetente=request.user).order_by('-data_envio').first()

        if ultima_msg and (timezone.now() - ultima_msg.data_envio).seconds < 30:
            return JsonResponse({
                'exists': True,
                'mensagem': {
                    'id': ultima_msg.id,
                    'assunto': ultima_msg.assunto,
                    'status': ultima_msg.status,
                    'data_envio': ultima_msg.data_envio.strftime("%d/%m/%Y %H:%M")
                }
            })

        return JsonResponse({'exists': False})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)