from django.db import models
from django.contrib.auth import get_user_model

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
    ]
    
    doador = models.ForeignKey(User, on_delete=models.CASCADE, related_name='doacoes')
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    metodo = models.CharField(max_length=20, choices=METODO_PAGAMENTO)
    destino = models.CharField(max_length=20, choices=DESTINO_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDENTE')

    class Meta:
        verbose_name = 'Doação'
        verbose_name_plural = 'Doações'
        ordering = ['-id']

    def __str__(self):
        return f"Doação de {self.doador.username} - R${self.valor}"