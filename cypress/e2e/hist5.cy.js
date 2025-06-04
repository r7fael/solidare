// cypress/e2e/historia5_gestor.cy.js
// Este arquivo contém os testes para a "História de Usuário 5: Eu como gestor, gostaria de visualizar métricas de doações, engajamento de doadores, progresso e etc."

// Define a URL base da sua aplicação Django
const BASE_URL = 'http://127.0.0.1:8000'; // CONFIRME se o seu servidor Django roda nesta porta!

// --- SEÇÃO: TESTES PARA A HISTÓRIA DE USUÁRIO 5 (GESTOR - Métricas) ---
describe('História de Usuário 5: Visualização de Métricas para Gestores', () => {

  // Antes de CADA TESTE neste bloco, um novo usuário gestor será criado e logado.
  let createdGestorEmail;
  let createdGestorPassword;

  beforeEach(() => {
    // 1. Criar um novo usuário gestor dinamicamente
    cy.visit(`${BASE_URL}/usuarios/registro/`);
    const uniqueSuffix = Date.now();
    const nomeCompleto = `Gestor Metricas ${uniqueSuffix}`;
    const cpf = `111222333${String(uniqueSuffix).slice(-4)}`; // CPF único para gestor
    createdGestorEmail = `gestor.metrics.${uniqueSuffix}@example.com`;
    createdGestorPassword = 'gestorpassword123';

    cy.get('input[name="nome"]').type(nomeCompleto);
    cy.get('input[name="cpf"]').type(cpf);
    cy.get('input[name="email"]').type(createdGestorEmail);
    cy.get('input[name="senha"]').type(createdGestorPassword);
    cy.get('select[name="tipo_usuario"]').select('gestor'); // Seleciona o tipo de usuário 'gestor'
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/usuarios/login/'); // Espera redirecionamento para login

    cy.visit(`${BASE_URL}/usuarios/login/`); // Assumindo que o login é o mesmo
    cy.get('input[name="email"]').type(createdGestorEmail);
    cy.get('input[name="senha"]').type(createdGestorPassword);
    cy.get('button[type="submit"]').click();
    // ATENÇÃO: Ajustado para a URL correta do painel do gestor, incluindo '/usuarios/'
    cy.url().should('eq', `${BASE_URL}/usuarios/painel-gestor/`); 
    cy.get('h1').contains('Bem-vindo, Gestor').should('be.visible'); // Ajuste o título de boas-vindas do gestor
  });

  it('Cenário 5.1: deve permitir o acesso ao painel de métricas da ONG', () => {
    // Dado que um gestor deseja visualizar métricas sobre doações, engajamento e progresso dos programas,
    // Quando ele acessa o painel administrativo da plataforma,
    // Então ele pode visualizar gráficos e relatórios atualizados sobre esses dados.

    // Simula que a API de métricas retorna dados para gráficos e relatórios.
    // ATENÇÃO: Ajuste o endpoint `/api/gestor/metricas/*` para o URL real da sua API Django.
    cy.intercept('GET', `${BASE_URL}/api/gestor/metricas/*`, {
      statusCode: 200,
      body: {
        total_doacoes: 25000.00,
        doadores_ativos: 150,
        progresso_campanhas: [
          { nome: 'Campanha X', progresso: 80 },
          { nome: 'Campanha Y', progresso: 45 }
        ],
        grafico_dados: [100, 200, 150, 300] // Exemplo de dados para um gráfico
      }
    }).as('getMetricasGestor');

    // 1. Navegar até a seção de métricas no painel do gestor
    // ATENÇÃO: Verifique o HTML do seu painel do gestor para o seletor correto do link "Métricas".
    // Pode ser um 'data-secao', 'id', 'class' ou texto.
    // Exemplo: cy.get('.navegacao-lateral a[data-secao="metricas-gestor"]').click();
    // Exemplo: cy.get('#link-metricas-gestor').click();
    // Exemplo: cy.contains('.navegacao-lateral a', 'Métricas').click();
    cy.get('.navegacao-lateral a[data-secao="relatorios"]').click(); // <-- AJUSTE ESTE SELETOR!
    // Ajustado para a URL correta da seção, incluindo '/usuarios/'
    cy.url().should('include', '/usuarios/painel-gestor/secao/relatorios/'); 

    // Espera a requisição interceptada ser concluída


    // 2. Verificar se a seção de métricas está visível
    cy.get('#relatorios').should('be.visible');
    cy.get('#relatorios h1').should('contain', 'Relatórios'); // Ajuste o título se for diferente

    // 3. Verificar a presença de dados e elementos de visualização (gráficos, cards)
    // ATENÇÃO: Ajuste os seletores para os elementos que exibem suas métricas.
    

  it('Cenário 5.2: deve permitir a exportação de relatórios detalhados de métricas', () => {
    // Dado que um gestor precisa analisar métricas para tomada de decisões,
    // Quando ele seleciona um período e exporta um relatório detalhado,
    // Então ele recebe um arquivo com os dados organizados para análise e compartilhamento.

    // Simula a requisição de exportação do relatório de métricas.
    // ATENÇÃO: Ajuste o endpoint `/api/gestor/metricas/exportar/*` para o URL real da sua API Django.
    cy.intercept('POST', `${BASE_URL}/api/gestor/metricas/exportar/*`, {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // Para Excel
        'Content-Disposition': 'attachment; filename="relatorio_metricas_detalhado.xlsx"'
      },
      body: 'Mock Excel Content' // Conteúdo simulado do arquivo
    }).as('exportarMetricas');

    // 1. Navegar até a seção de métricas do gestor
    // ATENÇÃO: Verifique o HTML do seu painel do gestor para o seletor correto do link "Métricas".
    cy.get('.navegacao-lateral a[data-secao="metricas-gestor"]').click(); // <-- AJUSTE ESTE SELETOR!
    // Ajustado para a URL correta da seção, incluindo '/usuarios/'
    cy.url().should('include', '/usuarios/painel-gestor/secao/metricas-gestor/');

    // 2. Selecionar um período para o relatório
    // ATENÇÃO: Ajuste o seletor para o campo de seleção de período.
    cy.get('select[name="periodo_exportacao_metricas"]').select('anual');

    // 3. Clicar no botão de exportar
    // ATENÇÃO: Ajuste o seletor para o botão de exportação.
    // Alterado para clicar no botão com o texto "Gerar Relatório de Impacto em PDF"
    cy.contains('button', 'Gerar Relatório de Impacto em PDF').click(); 

    // Espera o download do arquivo
    cy.wait('@exportarMetricas').then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
      expect(interception.response.headers['content-type']).to.eq('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(interception.response.headers['content-disposition']).to.include('filename="relatorio_metricas_detalhado.xlsx"');
    });

    // Opcional: Verificar se alguma mensagem de sucesso de exportação aparece
    // cy.get('.alert.alert-success').should('contain', 'Relatório exportado com sucesso!');
  });

  it('Cenário 5.3: deve receber um aviso sobre erro no carregamento das métricas', () => {
    // Dado que um gestor tenta visualizar as métricas da ONG,
    // Quando ocorre uma falha no sistema ou na atualização dos dados,
    // Então ele recebe um aviso sobre o erro e é orientado a tentar novamente mais tarde ou entrar em contato com o suporte.

    // Simula que a API de métricas retorna um erro.
    cy.intercept('GET', `${BASE_URL}/api/gestor/metricas/*`, {
      statusCode: 500,
      body: {
        status: 'erro',
        mensagem: 'Falha ao carregar as métricas. Tente novamente mais tarde.'
      }
    }).as('getMetricasFalha');

    // 1. Navegar até a seção de métricas do gestor
    // ATENÇÃO: Verifique o HTML do seu painel do gestor para o seletor correto do link "Métricas".
    cy.get('.navegacao-lateral a[data-secao="metricas-gestor"]').click(); // <-- AJUSTE ESTE SELETOR!
    // Ajustado para a URL correta da seção, incluindo '/usuarios/'
    cy.url().should('include', '/usuarios/painel-gestor/secao/metricas-gestor/');

    // Espera a requisição interceptada ser concluída (com erro)
    cy.wait('@getMetricasFalha');

    // 2. Verificar se a seção de métricas está visível
    cy.get('#metricas-gestor').should('be.visible');

    // 3. Verificar se uma mensagem de erro é exibida
    // ATENÇÃO: Ajuste o seletor para onde as mensagens de erro são exibidas no seu painel.
    cy.get('.alert.alert-danger, .mensagens-erro').should('be.visible')
      .and('contain', 'Falha ao carregar as métricas. Tente novamente mais tarde.'); // AJUSTE O TEXTO EXATO DA MENSAGEM DE ERRO!

    // 4. Verificar que nenhum dado de métrica é exibido
    cy.get('.card-total-doacoes').should('not.exist');
    cy.get('.grafico-doacoes-placeholder').should('not.exist');
  });
});
});
