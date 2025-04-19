from django.db import models
from django.core.exceptions import ValidationError

class Mensagem(models.Model):
    STATUS_AGUARDANDO = 'aguardando'
    STATUS_APROVADO = 'aprovado'
    STATUS_REJEITADO = 'rejeitado'
    
    STATUS_CHOICES = [
        (STATUS_AGUARDANDO, 'Aguardando Aprovação'),
        (STATUS_APROVADO, 'Aprovado'),
        (STATUS_REJEITADO, 'Rejeitado'),
    ]
    
    remetente = models.ForeignKey(
        'usuarios.Usuario', 
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='mensagens_enviadas',
        limit_choices_to={'tipo_usuario': 'doador'}
    )
    
    destinatario = models.ForeignKey(
        'beneficiarios.Beneficiario',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='mensagens_recebidas'
    )
    
    assunto = models.CharField(max_length=200)
    conteudo = models.TextField()
    
    aprovador = models.ForeignKey(
        'usuarios.Usuario',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='mensagens_aprovadas',
        limit_choices_to={'tipo_usuario': 'gestor'}
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_AGUARDANDO
    )
    
    motivo_rejeicao = models.TextField(null=True, blank=True)
    
    def aprovar(self, aprovador):
        if aprovador.tipo_usuario != 'gestor':
            raise ValidationError("Apenas gestores podem aprovar mensagens.")
        
        self.status = self.STATUS_APROVADO
        self.aprovador = aprovador
        self.save()
    
    def rejeitar(self, aprovador, motivo):
        if aprovador.tipo_usuario != 'gestor':
            raise ValidationError("Apenas gestores podem rejeitar mensagens.")
            
        self.status = self.STATUS_REJEITADO
        self.aprovador = aprovador
        self.motivo_rejeicao = motivo
        self.save()
    
    def esta_aprovada(self):
        return self.status == self.STATUS_APROVADO
    
    def __str__(self):
        remetente_nome = self.remetente.nome if self.remetente else "Remetente Anônimo"
        destinatario_nome = self.destinatario.nome if self.destinatario else "Destinatário Anônimo"
        return f"Mensagem de {remetente_nome} para {destinatario_nome} - {self.assunto}"

    class Meta:
        verbose_name = 'Mensagem'
        verbose_name_plural = 'Mensagens'
        ordering = ['-id']