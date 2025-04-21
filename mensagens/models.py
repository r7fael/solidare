from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from usuarios.models import Usuario
from beneficiarios.models import Beneficiario

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
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='mensagens_enviadas',
        limit_choices_to={'tipo_usuario': 'doador'}
    )
    
    destinatario = models.ForeignKey(
        Beneficiario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='mensagens_recebidas'
    )
    
    assunto = models.CharField(max_length=200)
    conteudo = models.TextField()
    
    aprovador = models.ForeignKey(
        Usuario,
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
    data_envio = models.DateTimeField(default=timezone.now, verbose_name="Data de Envio")
    data_aprovacao = models.DateTimeField(null=True, blank=True)
    lida = models.BooleanField(default=False)
    data_leitura = models.DateTimeField(null=True, blank=True)

    def clean(self):
        if self.remetente and self.remetente.tipo_usuario != 'doador':
            raise ValidationError("O remetente deve ser um doador.")
        
        if self.aprovador and self.aprovador.tipo_usuario != 'gestor':
            raise ValidationError("O aprovador deve ser um gestor.")

    def aprovar(self, aprovador):
        if aprovador.tipo_usuario != 'gestor':
            raise ValidationError("Apenas gestores podem aprovar mensagens.")
        
        self.status = self.STATUS_APROVADO
        self.aprovador = aprovador
        self.data_aprovacao = timezone.now()
        self.save()
    
    def rejeitar(self, aprovador, motivo):
        if aprovador.tipo_usuario != 'gestor':
            raise ValidationError("Apenas gestores podem rejeitar mensagens.")
        if not motivo:
            raise ValidationError("Informe o motivo da rejeição.")
            
        self.status = self.STATUS_REJEITADO
        self.aprovador = aprovador
        self.motivo_rejeicao = motivo
        self.data_aprovacao = timezone.now()
        self.save()
    
    def marcar_como_lida(self):
        if not self.lida:
            self.lida = True
            self.data_leitura = timezone.now()
            self.save()
    
    def esta_aprovada(self):
        return self.status == self.STATUS_APROVADO
    
    def esta_pendente(self):
        return self.status == self.STATUS_AGUARDANDO
    
    def foi_lida(self):
        return self.lida

    def __str__(self):
        remetente_nome = self.remetente.nome if self.remetente else "Remetente Anônimo"
        destinatario_nome = self.destinatario.usuario.nome if self.destinatario else "Destinatário Anônimo"
        return f"{self.assunto} (De: {remetente_nome}, Para: {destinatario_nome})"

    class Meta:
        verbose_name = 'Mensagem'
        verbose_name_plural = 'Mensagens'
        ordering = ['-data_envio']
        permissions = [
            ('pode_aprovar', 'Pode aprovar mensagens'),
            ('pode_rejeitar', 'Pode rejeitar mensagens'),
        ]
