// cypress/e2e/spec.cy.js  <-- Este é o nome do arquivo que você deve usar!

// Define a URL base da sua aplicação Django
const BASE_URL = 'http://127.0.0.1:8000'; // <<--- CONFIRME se o seu servidor Django roda nesta porta!

// Credenciais de teste para o doador - use as que você sabe que funcionam!
const DOADOR_EMAIL = 'Teste11@teste.com'; // <<--- ATUALIZE COM EMAIL REAL DO DOADOR DE TESTE
const DOADOR_PASSWORD = '1234';           // <<--- ATUALIZE COM SENHA REAL DO DOADOR DE TESTE

describe('Testes E2E da Plataforma SOLIDARE para Usuários e Doadores', () => {

  // Limpa o estado do navegador antes de CADA TESTE (não antes de cada describe/context)
  // Isso garante que cada 'it' comece de um estado limpo, sem login ou cookies de testes anteriores.
  beforeEach(() => {
    cy.visit(BASE_URL); // Visita a URL base no início de cada teste
  });

  // --- SEÇÃO: TESTES DE AUTENTICAÇÃO (Apenas Login) ---
  context('Testes de Autenticação (Apenas Login)', () => {

    it('deve permitir que um usuário existente faça login com sucesso', () => {
      cy.visit(`${BASE_URL}/usuarios/login/`);

      cy.get('input[name="email"]').type(DOADOR_EMAIL);
      cy.get('input[name="senha"]').type(DOADOR_PASSWORD);

      cy.get('button[type="submit"]').click();

      // CONFIRME: Para qual URL a aplicação redireciona após um login BEM-SUCEDIDO?
      // Você já confirmou que é o painel do doador.
      cy.url().should('eq', `${BASE_URL}/usuarios/painel-doador/`); 

      // Opcional: Verificar se o nome do usuário ou um elemento específico do painel aparece
      cy.get('h1').contains('Bem-vindo,').should('be.visible'); // Verifica se o título de boas-vindas está visível
    });

    it('deve exibir erro para login com credenciais inválidas', () => {
      cy.visit(`${BASE_URL}/usuarios/login/`);

      const invalidEmail = 'naoexiste@example.com';
      const invalidPassword = 'senhainvalida';

      cy.get('input[name="email"]').type(invalidEmail);
      cy.get('input[name="senha"]').type(invalidPassword);
      cy.get('button[type="submit"]').click();

      // CONFIRME: Qual é o TEXTO EXATO da mensagem de erro e onde ela aparece?
      cy.get('.mensagens-erro').should('be.visible');
      
      cy.url().should('include', '/usuarios/login/'); // Deve permanecer na página de login
    });
  });

  // --- SEÇÃO: TESTES DE FUNCIONALIDADES DO DOADOR (Requer Login) ---
  context('Testes de Funcionalidades do Doador (Após Login)', () => {

    // Antes de CADA TESTE NESTE CONTEXTO, faça o login.
    // Isso garante que cada teste comece com o usuário logado no painel.
    beforeEach(() => {
      cy.visit(`${BASE_URL}/usuarios/login/`);
      cy.get('input[name="email"]').type(DOADOR_EMAIL);
      cy.get('input[name="senha"]').type(DOADOR_PASSWORD);
      cy.get('button[type="submit"]').click();
      cy.url().should('eq', `${BASE_URL}/usuarios/painel-doador/`);
    });

    it('deve permitir que o doador acesse o histórico de impacto na seção Métricas', () => {
      // Cenário 2: Acesso ao histórico de impacto na plataforma
      cy.get('.navegacao-lateral a[data-secao="metricas"]').click();
      cy.get('#metricas').should('be.visible');
      cy.get('#metricas h1').should('contain', 'Seu Impacto em Números'); // Título exato da seção
      cy.get('#metricas h3').contains('Histórico de Doações').should('be.visible');
      cy.get('#metricas .tabela-metricas table').should('be.visible');
      // Opcional: Verificar se há linhas de dados na tabela (se já houver doações no BD de teste)
      // cy.get('#metricas .tabela-metricas tbody tr').should('have.length.greaterThan', 0);
    });

    it('deve permitir que o doador agende uma visita à ONG', () => {
      // Cenário 1: Agendamento de visita à ONG
      
      // PREPARAÇÃO CRÍTICA: Garanta que há pelo menos uma visita disponível no seu DB.
      // Crie uma via Django Admin (data futura, status='disponivel', vagas_restantes > 0).

      // 1. Navegar até a seção "Visitas à ONG"
      cy.get('.navegacao-lateral a[data-secao="visitas"]').click();

      // 2. Verificar se a seção de visitas está ativa e visível
      cy.get('#visitas').should('be.visible');
      cy.get('#visitas h1').should('contain', 'Visitas à ONG');

      // 3. Clicar no botão "Agendar" da primeira visita disponível
      cy.get('.lista-visitas .cartao-visita[data-status="disponivel"]').first().find('.btn-agendar').click();

      // 4. Verificar se o modal de confirmação de agendamento aparece
      cy.get('#modal-visita').should('be.visible');
      cy.get('#modal-texto').should('contain', 'Deseja confirmar seu agendamento para a visita em');

      // 5. Clicar no botão "Confirmar" dentro do modal
      cy.get('#btn-confirmar-visita').click();

      // --- ASSERÇÕES PÓS-AGENDAMENTO BEM-SUCEDIDO (CRÍTICO - VERIFIQUE MANUALMENTE!) ---
      // O que acontece após a confirmação?
      // O JS submete um formulário. O Django vai processar isso.

      // VERIFIQUE MANUALMENTE o comportamento do seu backend Django:
      // a) Para qual URL você é redirecionado após um agendamento bem-sucedido?
      //    Se permanecer no painel do doador (/usuarios/painel-doador/), mantenha a linha abaixo.
      //    Se for para outra URL (ex: /confirmacao-agendamento/), ajuste.
      cy.url().should('eq', `${BASE_URL}/usuarios/painel-doador/`);

      // b) Aparece alguma mensagem de sucesso na tela?
      //    Pelo HTML do painel, existe um 'div.mensagens-feedback' que pode conter mensagens.
      //    Se sim, qual é o TEXTO EXATO da mensagem de sucesso (ex: "Visita agendada com sucesso!")?
      //    Se não houver mensagem, remova as linhas abaixo.
      cy.get('.mensagens-feedback .alert-success', { timeout: 10000 }).should('be.visible');
      cy.get('.mensagens-feedback .alert-success').should('contain', 'Visita agendada com sucesso!'); // <<--- AJUSTE O TEXTO EXATO!

      // c) O status da visita no cartão muda no painel para "Você já está agendado"?
      //    Isso exigiria recarregar a página e/ou verificar o conteúdo do cartão.
      //    Por agora, focamos na URL e na mensagem de feedback.
    });

    // Você pode adicionar mais testes de funcionalidades do doador aqui
    // Ex: Testar Nova Doação, Minhas Mensagens, etc.
  });
});