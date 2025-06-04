// cypress/e2e/historia1_doador_atualizacoes.cy.js
// Este arquivo contém os testes para a "História de Usuário 1: Eu como doador, gostaria de receber atualizações de impacto regularmente."

// Define a URL base da sua aplicação Django
const BASE_URL = 'http://127.0.0.1:8000'; // CONFIRME se o seu servidor Django roda nesta porta!

describe('História de Usuário 1: Atualizações de Impacto para Doadores', () => {

  // Variáveis para armazenar as credenciais do usuário criado.
  // Serão preenchidas uma única vez no hook 'before()'.
  let createdUserEmail; 
  let createdUserPassword;

  // Este hook executa UMA ÚNICA VEZ antes de TODOS os testes neste 'describe'.
  // Usado para cadastrar o usuário apenas uma vez.
  before(() => {
    // 1. Cadastrar um novo usuário doador dinamicamente
    cy.visit(`${BASE_URL}/usuarios/registro/`);
    const uniqueSuffix = Date.now();
    const nomeCompleto = `Doador Teste ${uniqueSuffix}`;
    const cpf = `111222333${String(uniqueSuffix).slice(-4)}`; // CPF único
    createdUserEmail = `doador.teste.${uniqueSuffix}@example.com`; // Email único
    createdUserPassword = 'password123'; // Senha para o usuário criado

    cy.get('input[name="nome"]').type(nomeCompleto);
    cy.get('input[name="cpf"]').type(cpf);
    cy.get('input[name="email"]').type(createdUserEmail);
    cy.get('input[name="senha"]').type(createdUserPassword);
    cy.get('select[name="tipo_usuario"]').select('doador');
    cy.get('button[type="submit"]').click();
    
    // ATENÇÃO: Verifique o comportamento do seu backend Django após o registro.
    // Se ele redirecionar para a página de login:
    cy.url().should('include', '/usuarios/login/'); 
    // Se ele permanecer na página de registro e exibir uma mensagem de sucesso:
    // cy.url().should('include', '/usuarios/registro/');
    // cy.get('.alert.alert-success').should('be.visible').and('contain', 'Usuário cadastrado com sucesso!');
  });

  // Este hook executa ANTES DE CADA TESTE 'it'.
  // Usado para fazer login com o usuário já criado.
  beforeEach(() => {
    // 2. Fazer login com o usuário recém-cadastrado (cujas credenciais foram salvas no 'before()')
    cy.visit(`${BASE_URL}/usuarios/login/`);
    cy.get('input[name="email"]').type(createdUserEmail);
    cy.get('input[name="senha"]').type(createdUserPassword);
    cy.get('button[type="submit"]').click();
    cy.url().should('eq', `${BASE_URL}/usuarios/painel-doador/`);
    cy.get('h1').contains('Bem-vindo,').should('be.visible');
  });

  it('Cenário 1.1: deve exibir o histórico de doações na seção "Minhas Doações" como atualização de impacto', () => {
    // Dado que um doador realizou uma ou mais doações e deseja acompanhar o impacto,
    // Quando a ONG disponibiliza atualizações sobre o andamento dos programas e o impacto das doações,
    // Então o doador recebe notificações regulares com essas informações.
    // (Neste cenário, interpretamos "atualizações de impacto" como o histórico de doações visível na plataforma.)

    // 1. Navegar até a seção "Minhas Doações"
    cy.get('.navegacao-lateral a[data-secao="doacoes"]').click();
    cy.url().should('include', '/usuarios/painel-doador/secao/doacoes/');

    // 2. Verificar se a seção "Minhas Doações" está ativa e visível
    cy.get('#doacoes').should('be.visible');
    cy.get('#doacoes h1').should('contain', 'Minhas Doações');

    // 3. Verificar a presença da tabela de doações e seus cabeçalhos
    cy.get('.tabela-doacoes thead th').should('have.length', 6);
    cy.get('.tabela-doacoes thead th').eq(0).should('contain', 'Data');
    cy.get('.tabela-doacoes thead th').eq(1).should('contain', 'Valor');
    cy.get('.tabela-doacoes thead th').eq(2).should('contain', 'Método');
    cy.get('.tabela-doacoes thead th').eq(3).should('contain', 'Destino/Campanha');
    cy.get('.tabela-doacoes thead th').eq(4).should('contain', 'Status');
    cy.get('.tabela-doacoes thead th').eq(5).should('contain', 'Ação');

    // 4. Verificar se a mensagem de "Nenhuma doação registrada ainda" está visível
    // (Este doador é recém-criado e não terá doações, então esta asserção é apropriada.)
    cy.get('.tabela-doacoes tbody tr .sem-registros p').should('be.visible')
      .and('contain', 'Nenhuma doação registrada ainda');
  });

  it('Cenário 1.2: deve permitir que o doador acesse as métricas de impacto na plataforma', () => {
    // Dado que um doador deseja verificar o impacto de suas doações anteriores,
    // Quando ele acessa seu perfil na plataforma,
    // Então ele pode visualizar um histórico detalhado com dados sobre como sua contribuição foi utilizada.
    // (Neste cenário, interpretamos "histórico detalhado" como as métricas de impacto.)

    // 1. Navegar até a seção "Métricas"
    cy.get('.navegacao-lateral a[data-secao="metricas"]').click();
    cy.url().should('include', '/usuarios/painel-doador/secao/metricas/');

    // 2. Verificar se a seção de métricas está ativa e visível
    cy.get('#metricas').should('be.visible');
    cy.get('#metricas h1').should('contain', 'Seu Impacto em Números'); // Título exato da seção

    // 3. Verificar a presença dos cards de métricas
    cy.get('.metricas-simples').should('be.visible');
    cy.get('.metricas-simples .metrica-item').eq(0).should('contain', 'Método mais usado');
    cy.get('.metricas-simples .metrica-item').eq(1).should('contain', 'Destino preferido');
    cy.get('.metricas-simples .metrica-item').eq(2).should('contain', 'Média por doação');
  });

  it('Cenário 1.3: deve indicar falha no recebimento de atualizações de impacto (ausência da mensagem)', () => {
    // Dado que a ONG precisa enviar atualizações de impacto aos doadores,
    // Quando ocorre um erro no sistema de notificações,
    // Então o doador não recebe a atualização e pode precisar entrar em contato para obter informações.

    // Simula uma falha no backend ao tentar buscar as atualizações de impacto (mensagens),
    // retornando um corpo vazio.
    // ATENÇÃO: Ajuste o endpoint `/api/mensagens/doador/*` para o URL real da sua API Django.
    cy.intercept('GET', `${BASE_URL}/api/mensagens/doador/*`, {
      statusCode: 200, // Pode ser 200 com corpo vazio ou um status de erro como 500
      body: [] // Corpo vazio, sem mensagens de atualização
    }).as('getMensagensFalha');

    // 1. Navegar até a seção "Mensagens"
    cy.get('.navegacao-lateral a[data-secao="mensagens"]').click();
    cy.url().should('include', '/usuarios/painel-doador/secao/mensagens/');



    // 2. Verificar se a seção de mensagens está ativa e visível
    cy.get('#mensagens').should('be.visible');
    cy.get('#mensagens h1').should('contain', 'Minhas Mensagens');

    // 3. Verificar que NENHUMA mensagem de atualização de impacto aparece
    cy.get('.lista-mensagens .cartao-mensagem').should('not.exist');

    // 4. Verificar se a mensagem de "Nenhuma mensagem enviada ainda" está visível
    cy.get('.lista-mensagens .sem-mensagens p').should('be.visible')
      .and('contain', 'Nenhuma mensagem enviada ainda');
  });

});
