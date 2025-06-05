// cypress/e2e/historia5_gestor.cy.js
// Este arquivo contém os testes para a "História de Usuário 5: Eu como gestor, gostaria de visualizar métricas de doações, engajamento de doadores, progresso e etc."

// Define a URL base da sua aplicação Django
const BASE_URL = 'http://127.0.0.1:8000'; // CONFIRME se o seu servidor Django roda nesta porta!

// Função utilitária para gerar CPF (simplificada, para fins de teste)
function gerarCPFValidoSimples() {
  const n = 9;
  const randomiza = () => Math.floor(Math.random() * n);
  const num = Array(9).fill(0).map(randomiza);
  
  let d1 = num.reduce((acc, val, idx) => acc + (val * (10 - idx)), 0) % 11;
  d1 = d1 < 2 ? 0 : 11 - d1;

  let d2 = num.reduce((acc, val, idx) => acc + (val * (11 - idx)), 0) + (d1 * 2);
  d2 = d2 % 11;
  d2 = d2 < 2 ? 0 : 11 - d2;
  
  return `${num.join('')}${d1}${d2}`;
}

// --- SEÇÃO: TESTES PARA A HISTÓRIA DE USUÁRIO 5 (GESTOR - Métricas) ---
describe('História de Usuário 5: Visualização de Métricas para Gestores', () => {

  let createdGestorEmail;
  let createdGestorPassword;

  beforeEach(() => {
    // 1. Criar um novo usuário gestor dinamicamente
    cy.visit(`${BASE_URL}/usuarios/registro/`);
    const uniqueSuffix = Date.now();
    const nomeCompleto = `Gestor Metricas ${uniqueSuffix}`;
    const cpf = gerarCPFValidoSimples(); // CPF único e válido para gestor
    createdGestorEmail = `gestor.metrics.${uniqueSuffix}@example.com`;
    createdGestorPassword = 'gestorpassword123';

    cy.get('input[name="nome"]').type(nomeCompleto);
    cy.get('input[name="cpf"]').type(cpf);
    cy.get('input[name="email"]').type(createdGestorEmail);
    cy.get('input[name="senha"]').type(createdGestorPassword);
    cy.get('select[name="tipo_usuario"]').select('gestor');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/usuarios/login/');

    cy.visit(`${BASE_URL}/usuarios/login/`);
    cy.get('input[name="email"]').type(createdGestorEmail);
    cy.get('input[name="senha"]').type(createdGestorPassword);
    cy.get('button[type="submit"]').click();
    cy.url().should('eq', `${BASE_URL}/usuarios/painel-gestor/`); 
    // ATENÇÃO: Ajuste o texto de boas-vindas se for diferente para o gestor.
    cy.get('h1').should('contain', 'Bem-vindo,').and('contain', 'Gestor').should('be.visible');
  });

  it('Cenário 5.1: deve permitir o acesso ao painel de métricas da ONG e interagir com relatórios', () => {
  // Dado que um gestor deseja visualizar métricas sobre doações, engajamento e progresso dos programas,
  // Quando ele acessa o painel administrativo da plataforma,
  // Então ele pode visualizar gráficos e relatórios atualizados sobre esses dados e interagir com eles.

  // Simula que a API de métricas retorna dados para gráficos e relatórios.
  // ATENÇÃO: Ajuste o endpoint `/api/gestor/metricas/*` para o URL real da sua API Django.
  cy.intercept('GET', `${BASE_URL}/api/gestor/metricas/*`, {
    statusCode: 200,
    body: {
      total_doacoes: 25000.00,
      doadores_ativos: 150,
      progresso_campanhas: [
        { nome: 'Campanha X', progresso: 80, id_seletor_css: 'campanha-x-progresso' }, // Adicionado para facilitar seleção
        { nome: 'Campanha Y', progresso: 45, id_seletor_css: 'campanha-y-progresso' }  // Adicionado para facilitar seleção
      ],
      grafico_dados: [100, 200, 150, 300] // Exemplo de dados para um gráfico
    }
  }).as('getMetricasGestor');

  // 1. Navegar até a seção de métricas/relatórios no painel do gestor
  // ATENÇÃO: Verifique o HTML do seu painel do gestor para o seletor correto do link "Métricas" ou "Relatórios".
  cy.get('.navegacao-lateral a[data-secao="relatorios"]').click(); // <-- AJUSTE ESTE SELETOR CONFORME SUA APLICAÇÃO!
  
  // Verifica se a URL mudou para a seção correta
  cy.url().should('include', '/usuarios/painel-gestor/secao/relatorios/'); 

  // Espera a requisição interceptada ser concluída ANTES de prosseguir
  cy.wait('@getMetricasGestor');

  // 2. Verificar se a seção de métricas/relatórios está visível e com o título esperado
  // ATENÇÃO: Ajuste o seletor '#relatorios' se o ID do container principal da seção for diferente.
  cy.get('#relatorios').should('be.visible');
  cy.get('#relatorios h1').should('contain', 'Relatórios'); // Ajuste o título se for diferente

  // 3. Verificar a presença de dados e elementos de visualização (gráficos, cards)
  // ATENÇÃO: Ajuste os seletores abaixo para os elementos REAIS que exibem suas métricas.
  // Estes são exemplos baseados no mock da API.
  cy.get('.metricas-card[data-metric="total_doacoes"] .valor') // Ex: <div class="metricas-card" data-metric="total_doacoes"><span class="valor">25000.00</span></div>
    .should('be.visible')
    .and('contain', '25000.00');
    
  cy.get('.metricas-card[data-metric="doadores_ativos"] .valor') // Ex: <div class="metricas-card" data-metric="doadores_ativos"><span class="valor">150</span></div>
    .should('be.visible')
    .and('contain', '150');

  // Exemplo para progresso de campanhas (ajuste os seletores)
  cy.get('.progresso-campanha[data-campanha="campanha-x-progresso"] .percentual') // Ex: <div class="progresso-campanha" data-campanha="campanha-x-progresso"><span class="percentual">80%</span></div>
    .should('be.visible')
    .and('contain', '80%');
    
  // cy.get('.grafico-principal-metricas').should('be.visible'); // Ex: Se você tem um canvas ou div para o gráfico principal

  // 4. Clicar no botão "Gerar Relatório de Impacto em PDF" CONFORME SOLICITADO
  cy.contains('button', 'Gerar Relatório de Impacto em PDF').should('be.visible').click();

  // ATENÇÃO: Após clicar em "Gerar Relatório de Impacto em PDF",
  // adicione asserções para o que deve acontecer em seguida neste cenário.
  // Exemplos:
  // - Um modal específico para o relatório PDF aparece?
  //   cy.get('#modal-relatorio-pdf-preview').should('be.visible');
  // - A página navega para uma nova visualização do relatório?
  //   cy.url().should('include', '/painel-gestor/relatorios/impacto-pdf-preview');
  // - Alguma mensagem de "Gerando relatório..." é exibida?
  //   cy.get('.status-geracao-relatorio').should('contain', 'Gerando relatório, aguarde...');
  // (O download efetivo do arquivo é testado mais a fundo no Cenário 5.2)
  cy.log('Botão "Gerar Relatório de Impacto em PDF" clicado. Adicione asserções para o resultado esperado aqui.');

});

  it('Cenário 5.2: deve permitir a exportação de relatórios detalhados de métricas', () => {
    // Dado que um gestor precisa analisar métricas para tomada de decisões,
    // Quando ele seleciona um período e exporta um relatório detalhado,
    // Então ele recebe um arquivo com os dados organizados para análise e compartilhamento.

    cy.intercept('POST', `${BASE_URL}/api/gestor/metricas/exportar/*`, {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="relatorio_metricas_detalhado.xlsx"'
      },
      body: 'Mock Excel Content' 
    }).as('exportarMetricas');

    // 1. Navegar até a seção de métricas/relatórios do gestor
    // ATENÇÃO: Ajuste o seletor. Pode ser o mesmo do Cenário 5.1.
    cy.get('.navegacao-lateral a[data-secao="relatorios"]').click(); 
    // ATENÇÃO: Ajuste a URL da seção se for diferente ou mais específica para exportação.
    cy.url().should('include', '/usuarios/painel-gestor/secao/relatorios/');

    // 2. Selecionar um período para o relatório (se aplicável antes de clicar no botão de exportar)
    // ATENÇÃO: Ajuste o seletor para o campo de seleção de período, se houver.
    // cy.get('select[name="periodo_exportacao_metricas"]').select('anual'); // Exemplo

    // 3. Clicar no botão de exportar
    // ATENÇÃO: Se este for o mesmo botão do cenário 5.1, o nome pode ser o mesmo.
    // Ou pode ser um botão diferente especificamente para exportar formatos como Excel/CSV.
    cy.contains('Gerar Relatório de Impacto em PDF').click();
 // Ou outro botão como 'Exportar para Excel'

   
    });

    // Opcional: Verificar se alguma mensagem de sucesso de exportação aparece
    // cy.get('.alert.alert-success').should('contain', 'Relatório exportado com sucesso!');
  });

  it('Cenário 5.3: deve receber um aviso sobre erro no carregamento das métricas', () => {
    // Dado que um gestor tenta visualizar as métricas da ONG,
    // Quando ocorre uma falha no sistema ou na atualização dos dados,
    // Então ele recebe um aviso sobre o erro e é orientado.

    cy.intercept('GET', `${BASE_URL}/api/gestor/metricas/*`, {
      statusCode: 500,
      body: {
        status: 'erro',
        mensagem: 'Falha ao carregar as métricas. Tente novamente mais tarde.'
      }
    }).as('getMetricasFalha');

    // 1. Navegar até a seção de métricas/relatórios do gestor
    // ATENÇÃO: Ajuste o seletor.
    cy.get('.navegacao-lateral', { timeout: 10000 }).should('exist');


    // ATENÇÃO: Ajuste a URL da seção.
    cy.url().should('include', '/usuarios/painel-gestor/secao/relatorios/');



    // 2. Verificar se a seção principal ainda está visível (mesmo com erro)
    // ATENÇÃO: Ajuste o seletor.
    cy.get('#relatorios-ou-metricas-container').should('exist');


    // 3. Verificar se uma mensagem de erro é exibida
    // ATENÇÃO: Ajuste o seletor para onde as mensagens de erro são exibidas.
    cy.get('.alert.alert-danger, .mensagens-erro').should('be.visible')
      .and('contain', 'Falha ao carregar as métricas. Tente novamente mais tarde.'); // AJUSTE O TEXTO EXATO

    // 4. Verificar que nenhum dado de métrica é exibido (ou placeholders de erro são mostrados)
    // ATENÇÃO: Ajuste os seletores para os locais onde os dados apareceriam.
    cy.get('.metricas-card-total-doacoes .valor').should('not.exist'); // Ou verificar se contém um placeholder de erro
    cy.get('.grafico-principal-metricas').should('not.exist'); // Ou verificar se contém um placeholder de erro
  });
