from django.db import models
from usuarios.models import Usuario

class Doacao(models.Model):
    METODO_PAGAMENTO = [
        ('PIX', 'PIX'),
        ('BOLETO', 'Boleto'),
        ('CARTAO', 'Cartão de Crédito'),
        ('TRANSFERENCIA', 'Transferência Bancária'),
    ]
    
    STATUS_DOACAO = [
        ('PENDENTE', 'Pendente'),
        ('CONCLUIDO', 'Concluído'),
        ('CANCELADO', 'Cancelado'),
    ]
    
    DESTINO_DOACAO = [
        ('CURSOS', 'Cursos Profissionalizantes'),
        ('MATERIAL', 'Material Didático'),
        ('BOLSAS', 'Bolsas de Estudo'),
        ('OUTROS', 'Outros'),
    ]
    
    doador = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        related_name='doacoes'
    )
    
    valor = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Valor em reais"
    )
    
    metodo = models.CharField(
        max_length=20,
        choices=METODO_PAGAMENTO,
        help_text="Forma de pagamento"
    )
    
    destino = models.CharField(
        max_length=20,
        choices=DESTINO_DOACAO,
        help_text="Destino dos recursos"
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_DOACAO,
        default='PENDENTE',
        help_text="Status atual"
    )
    
    comprovante = models.FileField(
        upload_to='comprovantes/',
        blank=True,
        null=True,
        help_text="Comprovante digital"
    )
    
    observacao = models.TextField(
        blank=True,
        null=True,
        help_text="Informações adicionais"
    )

    class Meta:
        verbose_name = 'Doação'
        verbose_name_plural = 'Doações'
        ordering = ['-id'] 
    
    def __str__(self):
        return f"Doação #{self.id} - R${self.valor}"

    @property
    def metodo_display(self):
        return dict(self.METODO_PAGAMENTO).get(self.metodo, self.metodo)
    
    @property
    def destino_display(self):
        return dict(self.DESTINO_DOACAO).get(self.destino, self.destino)
    
    @property
    def status_display(self):
        return dict(self.STATUS_DOACAO).get(self.status, self.status)