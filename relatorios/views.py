from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from doacoes.models import Doacao
from django.db.models import Sum, Count, Value
from django.db.models.functions import Coalesce
from decimal import Decimal
from django.http import HttpResponse
from django.template.loader import get_template
from xhtml2pdf import pisa
from io import BytesIO
from django.utils import timezone

from .models import Relatorio


def render_to_pdf(template_src, context_dict={}):
    template = get_template(template_src)
    html = template.render(context_dict)
    result = BytesIO()
    pdf = pisa.pisaDocument(BytesIO(html.encode("UTF-8")), result, encoding='UTF-8')
    if not pdf.err:
        return result.getvalue()
    return None

def _get_dados_relatorio_impacto():
    doacoes_concluidas = Doacao.objects.filter(status='CONCLUIDO')
    if not doacoes_concluidas.exists():
        return None

    total_arrecadado_geral = doacoes_concluidas.aggregate(total=Coalesce(Sum('valor'), Value(Decimal('0.00'))))['total']
    numero_doacoes_concluidas = doacoes_concluidas.count()
    
    doadores_unicos_ids = doacoes_concluidas.values_list('doador_id', flat=True).distinct()
    numero_doadores_unicos = len(doadores_unicos_ids)

    media_por_doacao = (total_arrecadado_geral / numero_doacoes_concluidas) if numero_doacoes_concluidas > 0 else Decimal('0.00')

    dist_por_destino = doacoes_concluidas.filter(campanha__isnull=True, destino__isnull=False)\
        .values('destino')\
        .annotate(total_valor=Sum('valor'), qtd_doacoes=Count('id'))\
        .order_by('-total_valor')
    
    destinos_legiveis = dict(Doacao.DESTINO_CHOICES)
    dist_por_destino_fmt = [
        {'destino': destinos_legiveis.get(item['destino'], item['destino']), 
         'total_valor': item['total_valor'], 
         'qtd_doacoes': item['qtd_doacoes']}
        for item in dist_por_destino
    ]

    dist_por_campanha = doacoes_concluidas.filter(campanha__isnull=False)\
        .values('campanha__nome')\
        .annotate(total_valor=Sum('valor'), qtd_doacoes=Count('id'))\
        .order_by('-total_valor')
    
    dist_por_metodo = doacoes_concluidas.values('metodo')\
        .annotate(total_valor=Sum('valor'), qtd_doacoes=Count('id'))\
        .order_by('-total_valor')
    
    metodos_legiveis = dict(Doacao.METODO_PAGAMENTO)
    dist_por_metodo_fmt = [
        {'metodo': metodos_legiveis.get(item['metodo'], item['metodo']),
         'total_valor': item['total_valor'],
         'qtd_doacoes': item['qtd_doacoes']}
        for item in dist_por_metodo
    ]

    return {
        'total_arrecadado_geral': total_arrecadado_geral,
        'numero_doacoes_concluidas': numero_doacoes_concluidas,
        'numero_doadores_unicos': numero_doadores_unicos,
        'media_por_doacao': media_por_doacao,
        'dist_por_destino': dist_por_destino_fmt,
        'dist_por_campanha': dist_por_campanha,
        'dist_por_metodo': dist_por_metodo_fmt,
        'data_geracao_relatorio': timezone.now(),
    }

@login_required
def relatorio_impacto_doacoes(request):
    if request.user.tipo_usuario != 'gestor':
        messages.error(request, "Acesso restrito a gestores.")
        return redirect('painel_doador' if request.user.is_authenticated and request.user.tipo_usuario == 'doador' else 'login')

    dados_relatorio = _get_dados_relatorio_impacto()

    if dados_relatorio is None:
        messages.info(request, "Não há doações concluídas para gerar o relatório.")
        return redirect('usuarios:painel_gestor') 

    return render(request, 'relatorios/relatorio_impacto_doacoes.html', dados_relatorio)

@login_required
def exportar_relatorio_impacto_pdf(request):
    if request.user.tipo_usuario != 'gestor':
        messages.error(request, "Acesso restrito a gestores.")
        return redirect('painel_doador' if request.user.is_authenticated and request.user.tipo_usuario == 'doador' else 'login')

    dados_relatorio = _get_dados_relatorio_impacto()

    if dados_relatorio is None:
        messages.error(request, "Não há doações concluídas para exportar o relatório.")
        return redirect('usuarios:painel_gestor_secao', secao_nome='relatorios')
    
    context_pdf = {**dados_relatorio, 'exporting_for_pdf': True}
    
    pdf_content = render_to_pdf('relatorios/relatorio_impacto_doacoes_pdf.html', context_pdf)
    
    if pdf_content:
        response = HttpResponse(pdf_content, content_type='application/pdf')
        filename = f"relatorio_impacto_{timezone.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        messages.success(request, "PDF do Relatório de Impacto gerado com sucesso.")
        return response
    
    messages.error(request, "Ocorreu um erro ao gerar o PDF do relatório de impacto.")
    return redirect('usuarios:painel_gestor_secao', secao_nome='relatorios')

@login_required
def criar_relatorio_manual(request):
    if request.user.tipo_usuario != 'gestor':
        messages.error(request, "Acesso restrito a gestores.")
        return redirect('usuarios:login')

    if request.method == 'POST':
        titulo = request.POST.get('titulo')
        descricao = request.POST.get('descricao')
        status_relatorio = request.POST.get('status', 'pendente')

        if not titulo or not descricao:
            messages.error(request, "Título e descrição são obrigatórios para o relatório manual.")
        else:
            try:
                Relatorio.objects.create(
                    gestor=request.user,
                    titulo=titulo,
                    descricao=descricao,
                    status=status_relatorio
                )
                messages.success(request, f"Relatório manual '{titulo}' registrado com sucesso.")
            except Exception as e:
                messages.error(request, f"Erro ao registrar relatório manual: {e}")
        
        return redirect('usuarios:painel_gestor_secao', secao_nome='relatorios')

    return redirect('usuarios:painel_gestor_secao', secao_nome='relatorios')