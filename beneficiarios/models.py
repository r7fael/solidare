from django.db import models
import uuid

class Beneficiario(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nome = models.CharField(max_length=100)
    idade = models.PositiveIntegerField()
    nome_responsavel = models.CharField(max_length=100, blank=True, null=True)
    telefone_responsavel = models.CharField(max_length=20, blank=True, null=True)
    email_responsavel = models.EmailField(blank=True, null=True)
    observacoes = models.TextField(blank=True)
    ativo = models.BooleanField(default=True)

    def __str__(self):
        return self.nome
