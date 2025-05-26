// cypress/e2e/spec.cy.js  <-- O NOME DO SEU ARQUIVO É ESSE!

// Define a URL base da sua aplicação Django
const BASE_URL = 'http://127.0.0.1:8000'; // <<--- CONFIRME se o seu servidor Django roda nesta porta!

describe('Fluxo de Autenticação (Cadastro e Login)', () => {

  // Antes de cada teste, vamos garantir que estamos na base URL (apenas para garantir um estado limpo)
  beforeEach(() => {
    cy.visit(BASE_URL);
  });

  context('Testes de Cadastro de Usuário', () => {

    it('deve permitir que um novo usuário se cadastre com sucesso', () => {
      cy.visit(`${BASE_URL}/usuarios/registro/`); // <<--- URL DA PÁGINA DE REGISTRO

      // Gerar dados de usuário únicos para cada execução do teste
      const uniqueSuffix = Date.now();
      const nomeCompleto = `Cypress User ${uniqueSuffix}`;
      const cpf = `123456789${String(uniqueSuffix).slice(-2)}-${String(uniqueSuffix).slice(-2)}`;
      const email = `cypress_user_${uniqueSuffix}@example.com`;
      const senha = 'password123';
      const tipoUsuario = 'doador'; // Ou 'gestor'

      // Preencher o formulário de cadastro usando os atributos 'name' dos inputs (verificado no seu HTML)
      cy.get('input[name="nome"]').type(nomeCompleto);
      cy.get('input[name="cpf"]').type(cpf);
      cy.get('input[name="email"]').type(email);
      cy.get('input[name="senha"]').type(senha);
      cy.get('select[name="tipo_usuario"]').select(tipoUsuario);

      // Clicar no botão de cadastro (verificado no seu HTML)
      cy.get('button[type="submit"]').click();

      // --- ASSERÇÕES PÓS-CADASTRO BEM-SUCEDIDO (CRÍTICO - VERIFIQUE MANUALMENTE!) ---
      // Você precisa CONFIRMAR o comportamento REAL da sua aplicação Django após um cadastro de SUCESSO.

      // 1. Onde sua aplicação redireciona após um cadastro BEM-SUCEDIDO?
      // NO SEU CASO, o teste anterior falhou porque ele ESPERAVA ir para /usuarios/login/
      // mas a aplicação FICOU em /usuarios/registro/.
      // ISSO INDICA QUE SEU BACKEND DJANGO NÃO ESTÁ REDIRECIONANDO APÓS O SUCESSO DO CADASTRO.
      // >>> Você PRECISA fazer seu backend Django redirecionar para 'usuarios/login/' (ou outra URL)
      // >>> OU, se a intenção é ficar na mesma página, mude a linha abaixo para '/usuarios/registro/'
      cy.url().should('include', '/usuarios/login/'); // <<--- ATENÇÃO AQUI!

      // 2. Existe alguma mensagem de sucesso na tela após o cadastro?
      // Se sim, qual é o TEXTO EXATO? E ela aparece em qual elemento?
      // EX: 'Sua conta foi criada com sucesso! Por favor, faça login.'
      // Se não houver mensagem visível, REMOVA a linha abaixo.
      
      cy.wait(500); // Pequena espera, útil para depurar visualmente
    });

    it('deve exibir erros para campos obrigatórios vazios no cadastro', () => {
      cy.visit(`${BASE_URL}/usuarios/registro/`); // <<--- URL DA PÁGINA DE REGISTRO

      // Clicar no botão de cadastro sem preencher nenhum campo
      cy.get('button[type="submit"]').click();

      // --- ASSERÇÕES DE ERROS DE CADASTRO (CRÍTICO - VERIFIQUE MANUALMENTE!) ---
      // Você precisa CONFIRMAR EXATAMENTE COMO E ONDE AS MENSAGENS DE ERRO APARECEM.

      // No seu HTML de registro, as mensagens de erro aparecem em '<div class="alertas">'.
      
      // Qual é o TEXTO EXATO da mensagem de "campo obrigatório"?
      // EX: "Este campo é obrigatório." ou "O campo 'Nome completo' é obrigatório."
      
      
      // A URL deve permanecer na página de registro se houver erros de validação
      cy.url().should('include', '/usuarios/registro/');
    });
  });

  context('Testes de Login de Usuário', () => {
    // --- PREPARAÇÃO CRÍTICA PARA O TESTE DE LOGIN ---
    // PARA QUE ESTE TESTE FUNCIONE, VOCÊ PRECISA TER UM USUÁRIO PRÉ-CADASTRADO
    // NO SEU BANCO DE DADOS DJANGO COM AS CREDENCIAIS ABAIXO.
    // Use 'python manage.py createsuperuser' no seu terminal ou cadastre um usuário manualmente.
    // >>> Depois, ATUALIZE AS VARIÁVEIS ABAIXO com as credenciais REAIS desse usuário.
    const existingUserEmail = 'Teste11@teste.com'; // <<--- ALTERE AQUI!
    const existingUserPassword = '1234';           // <<--- ALTERE AQUI!

    it('deve permitir que um usuário existente faça login com sucesso', () => {
      cy.visit(`${BASE_URL}/usuarios/login/`); // <<--- URL DA PÁGINA DE LOGIN

      // Preencher o formulário de login usando os atributos 'name' dos inputs (verificado no seu HTML)
      cy.get('input[name="email"]').type(existingUserEmail);
      cy.get('input[name="senha"]').type(existingUserPassword);

      // Clicar no botão de login
      cy.get('button[type="submit"]').click();

      // --- ASSERÇÕES PÓS-LOGIN BEM-SUCEDIDO (CRÍTICO - VERIFIQUE MANUALMENTE!) ---
      // Você precisa CONFIRMAR PARA QUAL URL SUA APLICAÇÃO REDIRECIONA APÓS UM LOGIN BEM-SUCEDIDO.
      // E SE EXISTE ALGUM ELEMENTO QUE INDIQUE QUE O USUÁRIO ESTÁ LOGADO.

      // Para onde sua aplicação redireciona após um login BEM-SUCEDIDO?
      // Se for para a página inicial (raiz do site: http://127.0.0.1:8000/), use 'eq':
      cy.url().should('eq', `${BASE_URL}/usuarios/painel-doador/`); 
      // Se for para outra URL (ex: /dashboard/, /home/), use 'include' ou 'eq' com a URL exata.
      // Ex: cy.url().should('include', '/dashboard/');

      // Se houver algum elemento na página que só aparece para usuários logados, adicione aqui uma asserção.
      // Ex: cy.contains(`Bem-vindo, ${existingUserEmail}`).should('be.visible');
      // Ex: cy.get('.navbar-logout-button').should('be.visible');
    });

    it('deve exibir erro para login com credenciais inválidas', () => {
      cy.visit(`${BASE_URL}/usuarios/login/`); // <<--- URL DA PÁGINA DE LOGIN

      const invalidEmail = 'naoexiste@example.com';
      const invalidPassword = 'senhainvalida';

      cy.get('input[name="email"]').type(invalidEmail);
      cy.get('input[name="senha"]').type(invalidPassword);
      cy.get('button[type="submit"]').click();

      // --- ASSERÇÕES DE ERROS DE LOGIN (CRÍTICO - VERIFIQUE MANUALMENTE!) ---
      // Você precisa CONFIRMAR QUAL É O TEXTO EXATO DA MENSAGEM DE ERRO E O SELETOR.

      // No seu HTML de login, as mensagens de erro aparecem em '<div class="mensagens-erro"><ul><li>'.
      cy.get('.mensagens-erro').should('be.visible');
      // Qual é o TEXTO EXATO da mensagem de erro para credenciais inválidas?
      // EX: "Email e/ou senha incorretos." ou "Por favor, insira um nome de usuário e uma senha corretos."
  
      
      // O teste deve permanecer na página de login se as credenciais forem inválidas
      cy.url().should('include', '/usuarios/login/');
    });
  });
  }
);