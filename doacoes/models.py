from django.db import models
from django.contrib.auth import get_user_model
from campanhas.models import Campanha
from django.utils import timezone

User = get_user_model()

class Doacao(models.Model):
    METODO_PAGAMENTO = [
        ('PIX', 'PIX'),
        ('BOLETO', 'Boleto'),
        ('CARTAO', 'Cartão de Crédito'),
    ]
    
    STATUS_CHOICES = [
        ('PENDENTE', 'Pendente'),
        ('CONCLUIDO', 'Concluído'),
    ]
    
    DESTINO_CHOICES = [
        ('EDUCACAO', 'Educação'),
        ('SAUDE', 'Saúde'),
        ('ALIMENTOS', 'Alimentação'),
        ('GERAL', 'Geral/Outros'),
    ]
    
    doador = models.ForeignKey(User, on_delete=models.CASCADE, related_name='doacoes')
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    metodo = models.CharField(max_length=20, choices=METODO_PAGAMENTO)
    
    destino = models.CharField(max_length=20, choices=DESTINO_CHOICES, null=True, blank=True) 

    campanha = models.ForeignKey(Campanha, on_delete=models.SET_NULL, null=True, blank=True, related_name='doacoes_campanha')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDENTE')
    data_doacao = models.DateTimeField(default=timezone.now) 

    class Meta:
        verbose_name = 'Doação'
        verbose_name_plural = 'Doações'
        ordering = ['-data_doacao'] 

    def __str__(self):
        if self.campanha:
            return f"Doação de {self.doador.nome} para {self.campanha.nome} - R${self.valor}"
        return f"Doação de {self.doador.nome} - R${self.valor} para {self.get_destino_display() or 'N/A'}"