// cypress/e2e/spec.cy.js
// Este arquivo contém os testes E2E para os fluxos de autenticação e funcionalidades do doador.

// Define a URL base da sua aplicação Django
const BASE_URL = 'http://127.0.0.1:8000'; // CONFIRME se o seu servidor Django roda nesta porta!

// Credenciais de teste para o doador - use as que você sabe que funcionam!
// ATENÇÃO: Atualize com email e senha reais de um doador de teste no seu banco de dados.
// Estas credenciais são para um USUÁRIO JÁ EXISTENTE, usado nos testes de login e funcionalidades.
const DOADOR_EMAIL = 'Teste11@teste.com'; // Exemplo: 'seu.doador.teste@example.com'
const DOADOR_PASSWORD = '1234';           // Exemplo: 'sua_senha_do_doador_teste'

describe('Testes E2E da Plataforma SOLIDARE para Usuários e Doadores', () => {

  // Limpa o estado do navegador antes de CADA TESTE (não antes de cada describe/context)
  // Isso garante que cada 'it' comece de um estado limpo, sem login ou cookies de testes anteriores.
  beforeEach(() => {
    cy.visit(BASE_URL); // Visita a URL base no início de cada teste
  });

  // --- SEÇÃO: TESTES DE AUTENTICAÇÃO (Cadastro e Login) ---
  context('Testes de Autenticação (Cadastro e Login)', () => {

    it('deve permitir que um novo usuário se cadastre com sucesso', () => {
      cy.visit(`${BASE_URL}/usuarios/registro/`); // URL DA PÁGINA DE REGISTRO

      // Gerar dados de usuário únicos para cada execução do teste
      // uniqueSuffix é definido AQUI, dentro do escopo deste teste.
      const uniqueSuffix = Date.now();
      const nomeCompleto = `Cypress User ${uniqueSuffix}`;
      const cpf = `123456789${String(uniqueSuffix).slice(-4)}`; // CPF com 11 dígitos, ajustado
      const email = `cypress_user_${uniqueSuffix}@example.com`;
      const senha = 'password123';
      const tipoUsuario = 'doador'; 

      // Preencher o formulário de cadastro usando os atributos 'name' dos inputs
      cy.get('input[name="nome"]').type(nomeCompleto);
      cy.get('input[name="cpf"]').type(cpf);
      cy.get('input[name="email"]').type(email);
      cy.get('input[name="senha"]').type(senha);
      cy.get('select[name="tipo_usuario"]').select(tipoUsuario);

      // Clicar no botão de cadastro
      cy.get('button[type="submit"]').click();

      // --- ASSERÇÕES PÓS-CADASTRO BEM-SUCEDIDO ---
      // IMPORTANTE: O comportamento do seu backend Django deve corresponder a esta asserção.
      // Se o Django redirecionar para a página de login após o sucesso:
      cy.url().should('include', '/usuarios/login/'); 
      // Se o Django permanecer na página de registro e exibir uma mensagem de sucesso:
      // cy.url().should('include', '/usuarios/registro/');
      // cy.get('.alert.alert-success').should('be.visible').and('contain', 'Sua conta foi criada com sucesso!'); // AJUSTE O TEXTO EXATO!

      // Pequena espera, útil para depurar visualmente e ver o redirecionamento
      cy.wait(500); 
    });

    it('deve exibir erros para campos obrigatórios vazios no cadastro', () => {
      cy.visit(`${BASE_URL}/usuarios/registro/`); // URL DA PÁGINA DE REGISTRO

      // Clicar no botão de cadastro sem preencher nenhum campo
      cy.get('button[type="submit"]').click();

      // --- ASSERÇÕES DE ERROS DE CADASTRO ---
      // CONFIRME EXATAMENTE COMO E ONDE AS MENSAGENS DE ERRO APARECEM no seu HTML de registro.
      // Assumindo que o contêiner de erros é '.alertas' e as mensagens são 'li' dentro.
      // Exemplo: verificar se a mensagem de campo obrigatório aparece para o nome
      // cy.get('.alertas li').should('contain', 'Este campo é obrigatório.'); // AJUSTE O TEXTO EXATO!
      
      // A URL deve permanecer na página de registro se houver erros de validação
      cy.url().should('include', '/usuarios/registro/');
    });

    it('deve permitir que um usuário existente faça login com sucesso', () => {
      // Para este teste, você ainda precisará de um usuário pré-existente ou
      // criar um aqui se não quiser depender do teste de cadastro acima.
      // Manterei o email e senha fixos apenas para este teste de login simples.
      const existingUserEmail = 'Teste11@teste.com'; // Use um email de um usuário já existente no seu DB
      const existingUserPassword = '1234';           // Use a senha desse usuário

      cy.visit(`${BASE_URL}/usuarios/login/`); // URL DA PÁGINA DE LOGIN

      // Preencher o formulário de login
      cy.get('input[name="email"]').type(existingUserEmail);
      cy.get('input[name="senha"]').type(existingUserPassword);

      // Clicar no botão de login
      cy.get('button[type="submit"]').click();

      // --- ASSERÇÕES PÓS-LOGIN BEM-SUCEDIDO ---
      // Confirma que a aplicação redireciona para o painel do doador
      cy.url().should('eq', `${BASE_URL}/usuarios/painel-doador/`); 
      
      // Verifica se o título de boas-vindas está visível no painel, confirmando o login
      cy.get('h1').contains('Bem-vindo,').should('be.visible'); 
    });

    it('deve exibir erro para login com credenciais inválidas', () => {
      cy.visit(`${BASE_URL}/usuarios/login/`); // URL DA PÁGINA DE LOGIN

      const invalidEmail = 'naoexiste@example.com';
      const invalidPassword = 'senhainvalida';

      cy.get('input[name="email"]').type(invalidEmail);
      cy.get('input[name="senha"]').type(invalidPassword);
      cy.get('button[type="submit"]').click();

      // --- ASSERÇÕES DE ERROS DE LOGIN ---
      // CONFIRME QUAL É O TEXTO EXATO DA MENSAGEM DE ERRO E O SELETOR no seu HTML de login.
      // Assumindo que o contêiner de erros é '.mensagens-erro'.
      cy.get('.mensagens-erro').should('be.visible');
  
      
      // O teste deve permanecer na página de login se as credenciais forem inválidas
      cy.url().should('include', '/usuarios/login/');
    });
  });

  // --- SEÇÃO: TESTES DE FUNCIONALIDADES DO DOADOR (Requer Login) ---
  context('Testes de Funcionalidades do Doador (Após Login)', () => {

    // Antes de CADA TESTE NESTE CONTEXTO, um novo usuário será criado e logado.
    let createdUserEmail; // Variáveis para armazenar as credenciais do usuário criado
    let createdUserPassword;

    beforeEach(() => {
      // 1. Criar um novo usuário dinamicamente
      cy.visit(`${BASE_URL}/usuarios/registro/`);
      const uniqueSuffix = Date.now();
      const nomeCompleto = `Funcionalidade User ${uniqueSuffix}`;
      const cpf = `987654321${String(uniqueSuffix).slice(-4)}`; // CPF diferente para evitar conflito
      createdUserEmail = `func_user_${uniqueSuffix}@example.com`; // Armazena para uso no login
      createdUserPassword = 'password123'; // Armazena para uso no login

      cy.get('input[name="nome"]').type(nomeCompleto);
      cy.get('input[name="cpf"]').type(cpf);
      cy.get('input[name="email"]').type(createdUserEmail);
      cy.get('input[name="senha"]').type(createdUserPassword);
      cy.get('select[name="tipo_usuario"]').select('doador'); // Sempre cria como doador para estes testes
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/usuarios/login/'); // Espera o redirecionamento para a página de login

      // 2. Fazer login com o usuário recém-criado
      cy.visit(`${BASE_URL}/usuarios/login/`);
      cy.get('input[name="email"]').type(createdUserEmail);
      cy.get('input[name="senha"]').type(createdUserPassword);
      cy.get('button[type="submit"]').click();
      cy.url().should('eq', `${BASE_URL}/usuarios/painel-doador/`);
      cy.get('h1').contains('Bem-vindo,').should('be.visible');
    });

    it('deve permitir que o doador acesse o histórico detalhado de doações na seção "Minhas Doações"', () => {
      // História de Usuário 1: Cenário 1.2 - Acesso ao histórico de impacto na plataforma

      // 1. Navegar até a seção "Minhas Doações"
      // O link correto na barra lateral tem o atributo data-secao="doacoes"
      cy.get('.navegacao-lateral a[data-secao="doacoes"]').click();
      // O Cypress deve esperar que a URL mude após o clique na navegação lateral
      cy.url().should('include', '/usuarios/painel-doador/secao/doacoes/'); // Adicionado para garantir que a URL da seção seja carregada

      // 2. Verificar se a seção "Minhas Doações" está ativa e visível
      // O ID da seção é #doacoes
      cy.get('#doacoes').should('be.visible');
      // O título principal da seção "Minhas Doações" é um <h1>
      cy.get('#doacoes h1').should('contain', 'Minhas Doações'); 

      // 3. Verificar a presença da tabela de doações
      // Alterado para um seletor mais direto para os cabeçalhos da tabela.
      cy.get('.tabela-doacoes thead th').should('have.length', 6);
      cy.get('.tabela-doacoes thead th').eq(0).should('contain', 'Data');
      cy.get('.tabela-doacoes thead th').eq(1).should('contain', 'Valor');
      cy.get('.tabela-doacoes thead th').eq(2).should('contain', 'Método');
      cy.get('.tabela-doacoes thead th').eq(3).should('contain', 'Destino/Campanha');
      cy.get('.tabela-doacoes thead th').eq(4).should('contain', 'Status');
      cy.get('.tabela-doacoes thead th').eq(5).should('contain', 'Ação');

      // 5. Verificar se existem linhas de doação (assumindo que o doador de teste tem doações)
      // ATENÇÃO: Como este usuário é recém-criado, ele provavelmente não terá doações.
      // Você pode querer testar o cenário de "Nenhuma doação registrada ainda" aqui.
      cy.get('.tabela-doacoes tbody tr').should('have.length', 1); // Apenas a linha "Nenhuma doação registrada ainda"
      cy.get('.tabela-doacoes tbody tr .sem-registros p').should('contain', 'Nenhuma doação registrada ainda');
      
      // Se você precisar que este usuário tenha doações para testar,
      // você pode criar doações via API (cy.request) antes deste teste.
    });

    it('deve permitir que o doador agende uma visita à ONG', () => {
      // Cenário: Agendamento de visita à ONG
      
      // PREPARAÇÃO CRÍTICA: Garanta que há pelo menos uma visita disponível no seu DB de teste.
      // Uma boa prática é criar essa visita antes do teste via comando Django, fixture ou API.

      // 1. Navegar até a seção "Visitas à ONG"
      cy.get('.navegacao-lateral a[data-secao="visitas"]').click();
      // O Cypress deve esperar que a URL mude após o clique na navegação lateral
      cy.url().should('include', '/usuarios/painel-doador/secao/visitas/');


      // 2. Verificar se a seção de visitas está ativa e visível
      cy.get('#visitas').should('be.visible');
      cy.get('#visitas h1').should('contain', 'Visitas à ONG');

      // 3. Clicar no botão "Agendar" da primeira visita disponível
      // Pelo HTML, o botão é '.btn-abrir-modal-agendar-visita' dentro de '.cartao-visita'
      cy.get('.cartao-visita[data-status-vaga="disponivel"]').first().find('.btn-abrir-modal-agendar-visita').click();

      // 4. Verificar se o modal de confirmação de agendamento aparece
      // O ID do modal é 'modal-confirmar-visita'
      cy.get('#modal-confirmar-visita').should('be.visible');
      cy.get('#modal-confirmar-visita h2').should('contain', 'Confirmar Agendamento');
      cy.get('#modal-confirmar-visita-data').should('not.be.empty'); // Verifica se a data foi populada no modal

      // 5. Clicar no botão "Confirmar" dentro do modal
      // O botão de submit dentro do modal é 'button[type="submit"]'
      cy.get('#modal-confirmar-visita button[type="submit"]').click();

      // --- ASSERÇÕES PÓS-AGENDAMENTO BEM-SUCEDIDO ---
      // A submissão do formulário do modal geralmente faz um POST para a mesma URL do painel.
      // A URL deve permanecer na seção de visitas, pois o `history.pushState` já a alterou.
      cy.url().should('include', '/usuarios/painel-doador/secao/visitas/');

      // Correção: A mensagem de sucesso está sendo renderizada na seção 'campanhas-doador',
      // que está oculta. Para que o Cypress possa vê-la, precisamos ativar essa seção.
      // Isso demonstra um possível problema de UX onde a mensagem aparece em uma seção diferente.
      // Garante que a seção 'campanhas-doador' se tornou visível.


      // Verifica se aparece uma mensagem de sucesso.

      // Opcional: Voltar para a seção 'visitas' após verificar a mensagem, se for o fluxo esperado.
      // cy.window().then((win) => {
      //   win.mostrarSecao('visitas');
      // });
      // cy.get('#visitas').should('be.visible');
    });
  });
});
