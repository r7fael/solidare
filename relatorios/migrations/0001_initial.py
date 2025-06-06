# Generated by Django 5.1.6 on 2025-04-19 19:14

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Relatorio',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('titulo', models.CharField(max_length=255)),
                ('descricao', models.TextField()),
                ('data_envio', models.DateTimeField(auto_now_add=True)),
                ('status', models.CharField(choices=[('pendente', 'Pendente'), ('aprovado', 'Aprovado'), ('revisao', 'Em Revisão')], default='pendente', max_length=20)),
                ('gestor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='relatorios', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
