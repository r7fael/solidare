from django.db import models
from django.conf import settings 
from decimal import Decimal

class Campanha(models.Model):
    nome = models.CharField(max_length=200)
    descricao = models.TextField()
    meta_arrecadacao = models.DecimalField(max_digits=10, decimal_places=2)
    valor_arrecadado = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    data_inicio = models.DateField(auto_now_add=True)
    data_fim = models.DateField(null=True, blank=True)
    gestor_responsavel = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        limit_choices_to={'tipo_usuario': 'gestor'},
        related_name='campanhas_criadas'
    )
    ativa = models.BooleanField(default=True)
    
    def __str__(self):
        return self.nome

    @property
    def progresso(self):
        if self.meta_arrecadacao > 0:
            progresso_decimal = (self.valor_arrecadado / self.meta_arrecadacao) * Decimal('100.0')
            return min(progresso_decimal, Decimal('100.0'))
        return Decimal('0.0')

    @property
    def faltando_para_meta(self):
        faltando = self.meta_arrecadacao - self.valor_arrecadado
        return max(faltando, Decimal('0.00'))

    class Meta:
        verbose_name = "Campanha"
        verbose_name_plural = "Campanhas"
        ordering = ['-data_inicio']