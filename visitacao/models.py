from django.db import models
from django.core.validators import MinValueValidator
from datetime import date
from django.core.exceptions import ValidationError
from usuarios.models import Doador

class DataVisitacao(models.Model):
    STATUS_CHOICES = [
        ('disponivel', 'Disponível'),
        ('esgotado', 'Esgotado'),
    ]
    
    data = models.DateField(verbose_name="Data da Visitação")
    capacidade_maxima = models.PositiveIntegerField(
        verbose_name="Capacidade Máxima",
        validators=[MinValueValidator(1)],
        default=10
    )
    doadores_presentes = models.ManyToManyField(
        Doador,
        verbose_name="Doadores Agendados",
        blank=True,
        related_name='visitas_agendadas'
    )
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='disponivel'
    )

    class Meta:
        verbose_name = "Data de Visitação"
        verbose_name_plural = "Datas de Visitação"
        ordering = ['data']
        unique_together = ['data']

    def __str__(self):
        return f"Visitação em {self.data.strftime('%d/%m/%Y')} ({self.get_status_display()})"

    def clean(self):
        """Validações adicionais"""
        if self.data < date.today():
            raise ValidationError("A data de visitação não pode ser no passado.")

        if self.pk and self.doadores_presentes.count() > self.capacidade_maxima:
            raise ValidationError("Número de doadores excede a capacidade máxima.")

    def save(self, *args, **kwargs):
        self.atualizar_status()
        super().save(*args, **kwargs)

    def atualizar_status(self):
        if self.pk:
            if self.doadores_presentes.count() >= self.capacidade_maxima:
                self.status = 'esgotado'
            else:
                self.status = 'disponivel'