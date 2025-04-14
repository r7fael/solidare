from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager

class UsuarioManager(BaseUserManager):
    def create_user(self, email, password=None, tipo_usuario=None, **extra_fields):
        if not email:
            raise ValueError("O email é obrigatório")
        if not tipo_usuario:
            raise ValueError("O tipo de usuário é obrigatório")

        email = self.normalize_email(email)
        usuario = self.model(email=email, tipo_usuario=tipo_usuario, **extra_fields)
        usuario.set_password(password)
        usuario.save(using=self._db)
        return usuario

    def create_superuser(self, email, password, tipo_usuario='gestor', **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, tipo_usuario, **extra_fields)

class Usuario(AbstractBaseUser, PermissionsMixin):
    TIPOS = (
        ('doador', 'Doador'),
        ('gestor', 'Gestor'),
    )

    email = models.EmailField(unique=True)
    cpf = models.CharField(max_length=14, unique=True)
    nome = models.CharField(max_length=150)
    tipo_usuario = models.CharField(max_length=10, choices=TIPOS)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['cpf', 'nome', 'tipo_usuario']

    objects = UsuarioManager()

    groups = models.ManyToManyField('auth.Group', blank=True, related_name='usuario_groups')
    user_permissions = models.ManyToManyField('auth.Permission', blank=True, related_name='usuario_permissions')

    def __str__(self):
        return self.nome

class Doador(models.Model):
    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE)
    ocupacao = models.CharField(max_length=100, blank=True)
    interesses = models.TextField(blank=True)

    def __str__(self):
        return f'Doador: {self.usuario.nome}'

class Gestor(models.Model):
    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE)
    setor_responsavel = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f'Gestor: {self.usuario.nome}'