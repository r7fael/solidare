# Generated by Django 5.1.6 on 2025-06-05 21:43

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('campanhas', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='campanha',
            name='imagem_destaque',
            field=models.ImageField(blank=True, help_text='Imagem que aparecerá no card da campanha.', null=True, upload_to='campanhas_imagens/'),
        ),
    ]
