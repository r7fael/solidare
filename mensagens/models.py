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
        limit_choices_to={'tipo_usuario': 'doador'},
        verbose_name="Remetente"
    )
    
    destinatario = models.ForeignKey(
        Beneficiario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='mensagens_recebidas',
        verbose_name="Destinatário"
    )
    
    assunto = models.CharField(max_length=200, verbose_name="Assunto")
    conteudo = models.TextField(verbose_name="Conteúdo")
    
    aprovador = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='mensagens_aprovadas',
        limit_choices_to={'tipo_usuario': 'gestor'},
        verbose_name="Aprovador"
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_AGUARDANDO,
        verbose_name="Status"
    )
    
    motivo_rejeicao = models.TextField(
        null=True, 
        blank=True,
        verbose_name="Motivo da Rejeição"
    )
    data_envio = models.DateTimeField(default=timezone.now, verbose_name="Data de Envio")
    data_aprovacao = models.DateTimeField(null=True, blank=True, verbose_name="Data de Aprovação")
    lida = models.BooleanField(default=False, verbose_name="Lida?")
    data_leitura = models.DateTimeField(null=True, blank=True, verbose_name="Data de Leitura")

    def clean(self):
        """Validações adicionais para o modelo"""
        errors = {}

        if self.remetente and self.remetente.tipo_usuario != 'doador':
            errors['remetente'] = "O remetente deve ser um doador."
        
        if self.aprovador and self.aprovador.tipo_usuario != 'gestor':
            errors['aprovador'] = "O aprovador deve ser um gestor."

        if self.status == self.STATUS_REJEITADO and not self.motivo_rejeicao:
            errors['motivo_rejeicao'] = "É necessário informar o motivo da rejeição."
        
        if errors:
            raise ValidationError(errors)

    def aprovar(self, aprovador):
        if aprovador.tipo_usuario != 'gestor':
            raise ValidationError({"aprovador": "Apenas gestores podem aprovar mensagens."})
        
        self.status = self.STATUS_APROVADO
        self.aprovador = aprovador
        self.data_aprovacao = timezone.now()
        self.save()
    
    def rejeitar(self, aprovador, motivo):
        if aprovador.tipo_usuario != 'gestor':
            raise ValidationError({"aprovador": "Apenas gestores podem rejeitar mensagens."})
        if not motivo:
            raise ValidationError({"motivo_rejeicao": "Informe o motivo da rejeição."})
            
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
    
    @property
    def esta_aprovada(self):
        return self.status == self.STATUS_APROVADO
    
    @property
    def esta_pendente(self):
        return self.status == self.STATUS_AGUARDANDO
    
    @property
    def foi_lida(self):
        return self.lida

    def get_nome_destinatario(self):
        if self.destinatario:
            return self.destinatario.nome
        return "Todos"

    def __str__(self):
        remetente_nome = self.remetente.nome if self.remetente else "Remetente Anônimo"
        return f"{self.assunto} (De: {remetente_nome}, Para: {self.get_nome_destinatario()})"

    class Meta:
        verbose_name = 'Mensagem'
        verbose_name_plural = 'Mensagens'
        ordering = ['-data_envio']
        permissions = [
            ('pode_aprovar', 'Pode aprovar mensagens'),
            ('pode_rejeitar', 'Pode rejeitar mensagens'),
        ]