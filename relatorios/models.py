from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Relatorio(models.Model):
    STATUS_CHOICES = [
        ('pendente', 'Pendente'),
        ('aprovado', 'Aprovado'),
        ('revisao', 'Em Revisão'),
    ]

    gestor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='relatorios')
    titulo = models.CharField(max_length=255)
    descricao = models.TextField()
    data_envio = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pendente')

    def __str__(self):
        return f'{self.titulo} - {self.status}'
