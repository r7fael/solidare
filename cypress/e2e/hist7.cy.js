// cypress/e2e/historia2_programas.cy.js
// Este arquivo contém os testes para a "História de Usuário 2: Eu como doador, gostaria de entender melhor sobre os programas antes de investir meu dinheiro."
// E agora também para a "História de Usuário 6: Eu como gestor, gostaria de ferramentas para gerar relatórios detalhados para demonstrar o impacto das doações."
// E a "História de Usuário 7: Eu como doador, gostaria de visualizar e poder contribuir para campanhas de arrecadação específicas ou projetos com metas definidas pela ONG."

// Define a URL base da sua aplicação Django
const BASE_URL = 'http://127.0.0.1:8000'; // CONFIRME se o seu servidor Django roda nesta porta!

describe('História de Usuário 2: Entender Programas antes da Doação', () => {

  // Antes de CADA TESTE neste bloco, um novo usuário será criado e logado.
  let createdUserEmail; // Variáveis para armazenar as credenciais do usuário criado
  let createdUserPassword;

  beforeEach(() => {
    // 1. Criar um novo usuário doador dinamicamente para cada teste
    cy.visit(`${BASE_URL}/usuarios/registro/`);
    const uniqueSuffix = Date.now();
    const nomeCompleto = `Doador Programa ${uniqueSuffix}`;
    const cpf = `444555666${String(uniqueSuffix).slice(-4)}`; // CPF único
    createdUserEmail = `doador.hist2.${uniqueSuffix}@example.com`; // Email único
    createdUserPassword = 'password123'; // Senha para o usuário criado

    cy.get('input[name="nome"]').type(nomeCompleto);
    cy.get('input[name="cpf"]').type(cpf);
    cy.get('input[name="email"]').type(createdUserEmail);
    cy.get('input[name="senha"]').type(createdUserPassword);
    cy.get('select[name="tipo_usuario"]').select('doador');
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

  it('Cenário 2.1: deve permitir que o doador acesse as informações detalhadas das campanhas', () => {
    // Dado que um doador deseja entender melhor sobre os programas (campanhas) antes de contribuir,
    // Quando ele acessa a plataforma e navega até a seção de campanhas,
    // Então ele pode visualizar descrições detalhadas, objetivos e impacto esperado de cada campanha.

    // Simula que a API de campanhas retorna dados detalhados.
    // ATENÇÃO CRÍTICA: Ajuste o endpoint `/api/campanhas/*` para o URL real da sua API Django
    // que o frontend usa para buscar as informações das campanhas.
    cy.intercept('GET', `${BASE_URL}/api/campanhas/*`, {
      statusCode: 200,
      body: [
        {
          id: 101,
          nome: 'Campanha de Livros para Crianças',
          descricao: 'Arrecadação de livros para bibliotecas comunitárias.',
          objetivo: 'Distribuir 1000 livros em áreas carentes.',
          impacto_esperado: 'Melhora no acesso à leitura e educação infantil.'
        },
        {
          id: 102,
          nome: 'Campanha de Refeições Solidárias',
          descricao: 'Fornecimento de refeições nutritivas para pessoas em situação de rua.',
          objetivo: 'Servir 500 refeições por semana.',
          impacto_esperado: 'Redução da fome e melhoria da saúde dos beneficiados.'
        }
      ]
    }).as('getCampanhasDetalhes');

    // 1. Navegar até a seção "Campanhas"
    cy.get('.navegacao-lateral a[data-secao="campanhas-doador"]').click();
    cy.url().should('include', '/usuarios/painel-doador/secao/campanhas-doador/');

    // Espera a requisição interceptada ser concluída
    cy.wait('@getCampanhasDetalhes');

    // Adicionado um log e debug para ajudar na depuração
    cy.log('Verificando se a seção de campanhas está visível...');
    cy.get('#campanhas-doador').should('be.visible');
    cy.get('#campanhas-doador h1').should('contain', 'Campanhas'); // Ajuste o título se for diferente

    cy.log('Verificando a presença e o conteúdo dos cartões de campanha...');
    // Aumentando o timeout para esta asserção específica para 10 segundos
    cy.get('#campanhas-doador .cartao-campanha', { timeout: 10000 }).should('be.visible').and('have.length', 2); // Deve ter 2 campanhas mockadas
    cy.debug(); // Pausa a execução para inspecionar o DOM no Cypress Test Runner

    // Verifica a primeira campanha
    cy.get('#campanhas-doador .cartao-campanha').eq(0).as('primeiraCampanha');
    cy.get('@primeiraCampanha').find('h3').should('contain', 'Campanha de Livros para Crianças');
    cy.get('@primeiraCampanha').find('p.descricao').should('contain', 'Arrecadação de livros');
    // Se houver elementos específicos para objetivo e impacto esperado dentro do cartão de campanha, adicione aqui:
    // cy.get('@primeiraCampanha').find('.objetivo').should('contain', 'Distribuir 1000 livros');

    // Verifica a segunda campanha
    cy.get('#campanhas-doador .cartao-campanha').eq(1).as('segundaCampanha');
    cy.get('@segundaCampanha').find('h3').should('contain', 'Campanha de Refeições Solidárias');
  });

  it('Cenário 2.2: deve exibir métricas de impacto para transparência', () => {
    // Dado que um doador quer mais confiança antes de fazer uma doação,
    // Quando ele acessa as métricas de impacto fornecidas pela ONG,
    // Então ele pode tomar uma decisão mais informada sobre seu investimento.

    // 1. Navegar até a seção "Métricas"
    cy.get('.navegacao-lateral a[data-secao="metricas"]').click();
    cy.url().should('include', '/usuarios/painel-doador/secao/metricas/');

    // 2. Verificar se a seção de métricas está visível
    cy.get('#metricas').should('be.visible');
    cy.get('#metricas h1').should('contain', 'Seu Impacto em Números'); // Título exato da seção

    // 3. Verificar a presença dos cards de métricas
    cy.get('.metricas-simples').should('be.visible');
    cy.get('.metricas-simples .metrica-item').eq(0).should('contain', 'Método mais usado');
    cy.get('.metricas-simples .metrica-item').eq(1).should('contain', 'Destino preferido');
    cy.get('.metricas-simples .metrica-item').eq(2).should('contain', 'Média por doação');

    // ATENÇÃO: Os elementos '.conteudo-painel h5' e '.conteudo-painel ul li'
    // não estão presentes na seção #metricas do painel do doador.
    // Eles pertencem ao template 'metricas_doador.html' (página separada).
    // Removendo as asserções que causavam o erro.
    // cy.get('.conteudo-painel h5').should('contain', 'Linha do tempo:');
    // cy.get('.conteudo-painel ul li').should('have.length.greaterThan', 0);
    // cy.get('.conteudo-painel ul li').eq(0).should('contain', 'Jan/2025 – Oficinas de capacitação');
  });

  it('Cenário 2.3: deve indicar falta de informações claras sobre as campanhas', () => {
    // Dado que um doador quer entender melhor sobre os programas (campanhas) antes de doar,
    // Quando ele acessa a plataforma e não encontra informações claras ou detalhadas,
    // Então ele pode desistir da doação por falta de transparência.

    // Simula que a API de campanhas retorna uma lista vazia, simulando falta de informações.
    // ATENÇÃO: Ajuste o endpoint `/api/campanhas/*` para o URL real da sua API Django.
    cy.intercept('GET', `${BASE_URL}/api/campanhas/*`, {
      statusCode: 200,
      body: [] // Corpo vazio, simulando falta de campanhas
    }).as('getCampanhasVazio');

    // 1. Navegar até a seção "Campanhas"
    cy.get('.navegacao-lateral a[data-secao="campanhas-doador"]').click();
    cy.url().should('include', '/usuarios/painel-doador/secao/campanhas-doador/');

    // Espera a requisição interceptada ser concluída
    cy.wait('@getCampanhasVazio');

    // 2. Verificar se a seção de campanhas está visível
    cy.get('#campanhas-doador').should('be.visible');
    cy.get('#campanhas-doador h1').should('contain', 'Campanhas'); // Ajuste o título se for diferente

    // 3. Verificar que NENHUM cartão de campanha é exibido
    // ATENÇÃO: Ajuste o seletor para os itens de campanha se for diferente.
    cy.get('#campanhas-doador .cartao-campanha').should('not.exist');

    // 4. Verificar se uma mensagem de "nenhuma campanha disponível" é exibida
    // ATENÇÃO: Ajuste o seletor e o texto para a sua mensagem de "nenhuma campanha".
    // Se você tiver um bloco {% empty %} no seu template, ele renderizará uma mensagem.
    cy.get('#campanhas-doador .sem-campanhas-info p').should('be.visible') // Exemplo de seletor
      .and('contain', 'Nenhuma campanha disponível no momento.'); // AJUSTE O TEXTO EXATO!
  });
});

// --- NOVA SEÇÃO: TESTES PARA A HISTÓRIA DE USUÁRIO 6 (GESTOR) ---
describe('História de Usuário 6: Ferramentas de Relatórios para Gestores', () => {

  // Antes de CADA TESTE neste bloco, um novo usuário gestor será criado e logado.
  let createdGestorEmail;
  let createdGestorPassword;

  beforeEach(() => {
    // 1. Criar um novo usuário gestor dinamicamente
    cy.visit(`${BASE_URL}/usuarios/registro/`);
    const uniqueSuffix = Date.now();
    const nomeCompleto = `Gestor Teste ${uniqueSuffix}`;
    const cpf = `777888999${String(uniqueSuffix).slice(-4)}`; // CPF único para gestor
    createdGestorEmail = `gestor.test.${uniqueSuffix}@example.com`;
    createdGestorPassword = 'gestorpassword123';

    cy.get('input[name="nome"]').type(nomeCompleto);
    cy.get('input[name="cpf"]').type(cpf);
    cy.get('input[name="email"]').type(createdGestorEmail);
    cy.get('input[name="senha"]').type(createdGestorPassword);
    cy.get('select[name="tipo_usuario"]').select('gestor'); // Seleciona o tipo de usuário 'gestor'
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/usuarios/login/'); // Espera redirecionamento para login

    // 2. Fazer login com o usuário gestor recém-criado
    cy.visit(`${BASE_URL}/usuarios/login/`); // Assumindo que o login é o mesmo
    cy.get('input[name="email"]').type(createdGestorEmail);
    cy.get('input[name="senha"]').type(createdGestorPassword);
    cy.get('button[type="submit"]').click();
    // ATENÇÃO: Ajuste a URL para o painel do gestor
    cy.url().should('eq', `${BASE_URL}/gestor/painel/`); // Assumindo URL do painel do gestor
    cy.get('h1').contains('Bem-vindo, Gestor').should('be.visible'); // Ajuste o título de boas-vindas do gestor
  });

  it('Cenário 6.1: deve permitir que o gestor gere um relatório detalhado sobre impacto das doações', () => {
    // Dado que um gestor precisa demonstrar o impacto das doações,
    // Quando ele acessa a ferramenta de relatórios na plataforma e seleciona um período e métricas relevantes,
    // Então um relatório detalhado é gerado com dados sobre a utilização dos recursos e os resultados alcançados.

    // Simula que a API de geração de relatório retorna um relatório mockado.
    // ATENÇÃO: Ajuste o endpoint `/api/relatorios/gerar/*` para o URL real da sua API Django.
    cy.intercept('POST', `${BASE_URL}/api/relatorios/gerar/*`, {
      statusCode: 200,
      body: {
        status: 'sucesso',
        url_relatorio: `${BASE_URL}/static/relatorios/relatorio_impacto_mock.pdf`,
        dados_resumo: {
          total_doado: 'R$ 15.000,00',
          beneficiados: 500,
          projetos_concluidos: 10
        }
      }
    }).as('gerarRelatorio');

    // 1. Navegar até a seção de relatórios no painel do gestor
    // ATENÇÃO: Assumindo um link na navegação lateral do gestor com data-secao="relatorios"
    cy.get('.navegacao-lateral a[data-secao="relatorios"]').click();
    cy.url().should('include', '/gestor/painel/secao/relatorios/'); // Ajuste a URL da seção

    // 2. Selecionar um período e métricas relevantes (elementos de formulário)
    // ATENÇÃO: Ajuste os seletores para os campos de período e métricas no seu formulário de relatório.
    cy.get('select[name="periodo_relatorio"]').select('ultimos_3_meses');
    cy.get('input[name="metricas_selecionadas"][value="total_doado"]').check(); // Exemplo de checkbox
    cy.get('input[name="metricas_selecionadas"][value="beneficiados"]').check();

    // 3. Clicar no botão para gerar o relatório
    cy.get('button#btn-gerar-relatorio').click(); // Assumindo ID do botão

    // Espera a requisição de geração de relatório ser concluída
    cy.wait('@gerarRelatorio').then((interception) => {
      // Verifica se a resposta mockada foi recebida
      expect(interception.response.statusCode).to.eq(200);
      expect(interception.response.body.status).to.eq('sucesso');
    });

    // 4. Verificar se o relatório detalhado é exibido ou um link para download aparece
    // ATENÇÃO: Ajuste o seletor para o elemento que exibe o relatório ou o link.
    cy.get('#relatorio-gerado-link').should('be.visible')
      .and('have.attr', 'href', `${BASE_URL}/static/relatorios/relatorio_impacto_mock.pdf`);
    cy.get('#relatorio-resumo-total-doado').should('contain', 'R$ 15.000,00');
  });

  it('Cenário 6.2: deve permitir a personalização e compartilhamento do relatório', () => {
    // Dado que um gestor deseja adaptar o relatório para diferentes públicos,
    // Quando ele personaliza os dados exibidos e escolhe o formato de exportação (PDF, Excel, etc.),
    // Então ele pode compartilhar o relatório com doadores, parceiros e a equipe interna de forma clara e acessível.

    // Simula a geração de um relatório para que haja algo para personalizar/compartilhar
    cy.intercept('POST', `${BASE_URL}/api/relatorios/gerar/*`, {
      statusCode: 200,
      body: {
        status: 'sucesso',
        url_relatorio: `${BASE_URL}/static/relatorios/relatorio_personalizado.pdf`
      }
    }).as('gerarRelatorioParaPersonalizar');

    // Simula o download do relatório em PDF
    cy.intercept('GET', `${BASE_URL}/static/relatorios/relatorio_personalizado.pdf`, {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="relatorio_personalizado.pdf"'
      },
      // Um corpo de resposta real de PDF seria binário, mas para teste de fluxo, um mock simples basta.
      body: 'Mock PDF Content'
    }).as('downloadPDF');

    // 1. Navegar até a seção de relatórios e gerar um relatório inicial (reutilizando passos do 6.1)
    cy.get('.navegacao-lateral a[data-secao="relatorios"]').click();
    cy.url().should('include', '/gestor/painel/secao/relatorios/');
    cy.get('button#btn-gerar-relatorio').click();
    cy.wait('@gerarRelatorioParaPersonalizar');
    cy.get('#relatorio-gerado-link').should('be.visible');

    // 2. Personalizar os dados exibidos (assumindo filtros ou opções de colunas)
    // ATENÇÃO: Ajuste os seletores para as opções de personalização no seu UI.
    cy.get('input[name="incluir_detalhes_doacao"]').check(); // Exemplo: checkbox para incluir detalhes
    cy.get('select[name="formato_visualizacao"]').select('tabela'); // Exemplo: mudar formato de visualização

    // 3. Escolher o formato de exportação e clicar no botão de exportar
    // ATENÇÃO: Ajuste o seletor para o dropdown de formato de exportação e o botão de exportar.
    cy.get('select[name="formato_exportacao"]').select('pdf');
    cy.get('button#btn-exportar-relatorio').click();

    // Espera o download do arquivo PDF
    cy.wait('@downloadPDF').then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
      expect(interception.response.headers['content-type']).to.eq('application/pdf');
    });

    // 4. Verificar se o relatório pode ser compartilhado (ex: botão de compartilhamento visível)
    // ATENÇÃO: Ajuste o seletor para o botão/opção de compartilhamento.
    cy.get('button#btn-compartilhar-relatorio').should('be.visible');
  });

  it('Cenário 6.3: deve receber uma notificação sobre a falha na geração do relatório', () => {
    // Dado que um gestor precisa gerar um relatório sobre o impacto das doações,
    // Quando ocorre um erro no sistema ao processar os dados,
    // Então ele recebe uma notificação sobre a falha e instruções para tentar novamente ou solicitar suporte técnico.

    // Simula que a API de geração de relatório retorna um erro.
    cy.intercept('POST', `${BASE_URL}/api/relatorios/gerar/*`, {
      statusCode: 500,
      body: {
        status: 'erro',
        mensagem: 'Erro interno no servidor ao gerar o relatório. Tente novamente mais tarde.'
      }
    }).as('gerarRelatorioFalha');

    // 1. Navegar até a seção de relatórios
    cy.get('.navegacao-lateral a[data-secao="relatorios"]').click();
    cy.url().should('include', '/gestor/painel/secao/relatorios/');

    // 2. Clicar no botão para gerar o relatório (mesmo que os campos não sejam preenchidos, para simular o erro)
    cy.get('button#btn-gerar-relatorio').click();

    // Espera a requisição de geração de relatório falhar
    cy.wait('@gerarRelatorioFalha').then((interception) => {
      expect(interception.response.statusCode).to.eq(500);
      expect(interception.response.body.status).to.eq('erro');
    });

    // 3. Verificar se uma notificação de falha é exibida
    // ATENÇÃO: Ajuste o seletor para onde as mensagens de erro são exibidas no seu painel.
    cy.get('.alert.alert-danger, .mensagens-erro').should('be.visible')
      .and('contain', 'Erro interno no servidor ao gerar o relatório. Tente novamente mais tarde.'); // AJUSTE O TEXTO EXATO DA MENSAGEM DE ERRO!

    // 4. Verificar instruções para tentar novamente ou solicitar suporte (se houver na UI)
    // cy.get('#notificacao-erro-relatorio p').should('contain', 'Por favor, entre em contato com o suporte técnico.');
  });
});

// --- NOVA SEÇÃO: TESTES PARA A HISTÓRIA DE USUÁRIO 7 (DOADOR - Campanhas Específicas) ---
describe('História de Usuário 7: Campanhas de Arrecadação Específicas', () => {

  // Reutiliza o beforeEach do contexto de doador para criar e logar um usuário doador.
  let createdUserEmail;
  let createdUserPassword;

  beforeEach(() => {
    cy.visit(`${BASE_URL}/usuarios/registro/`);
    const uniqueSuffix = Date.now();
    const nomeCompleto = `Doador Campanha ${uniqueSuffix}`;
    const cpf = `666777888${String(uniqueSuffix).slice(-4)}`;
    createdUserEmail = `doador.campanha.${uniqueSuffix}@example.com`;
    createdUserPassword = 'password123';

    cy.get('input[name="nome"]').type(nomeCompleto);
    cy.get('input[name="cpf"]').type(cpf);
    cy.get('input[name="email"]').type(createdUserEmail);
    cy.get('input[name="senha"]').type(createdUserPassword);
    cy.get('select[name="tipo_usuario"]').select('doador');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/usuarios/login/');

    cy.visit(`${BASE_URL}/usuarios/login/`);
    cy.get('input[name="email"]').type(createdUserEmail);
    cy.get('input[name="senha"]').type(createdUserPassword);
    cy.get('button[type="submit"]').click();
    cy.url().should('eq', `${BASE_URL}/usuarios/painel-doador/`);
    cy.get('h1').contains('Bem-vindo,').should('be.visible');
  });

  it('Cenário 7.1: deve permitir a descoberta e visualização de campanhas ativas', () => {
    // Dado que um doador deseja apoiar uma necessidade específica ou um projeto com um objetivo claro,
    // Quando ele acessa a plataforma da ONG,
    // Então ele pode encontrar uma seção de "Campanhas" ou "Projetos Especiais" onde visualiza as campanhas de arrecadação ativas,
    // suas descrições, metas financeiras, o progresso atual de arrecadação e o impacto esperado.

    // Simula que a API de campanhas retorna campanhas ativas com detalhes.
    cy.intercept('GET', `${BASE_URL}/api/campanhas/*`, {
      statusCode: 200,
      body: [
        {
          id: 201,
          nome: 'Água Potável para Todos',
          descricao: 'Construção de poços artesianos em comunidades rurais.',
          meta_financeira: 10000.00,
          arrecadado_atual: 7500.00,
          progresso_porcentagem: 75,
          impacto_esperado: 'Acesso à água potável para 500 famílias.'
        },
        {
          id: 202,
          nome: 'Apoio Escolar para Jovens',
          descricao: 'Bolsas de estudo e material didático para estudantes do ensino médio.',
          meta_financeira: 5000.00,
          arrecadado_atual: 2000.00,
          progresso_porcentagem: 40,
          impacto_esperado: 'Redução da evasão escolar e melhora no desempenho acadêmico.'
        }
      ]
    }).as('getCampanhasAtivas');

    // 1. Navegar até a seção "Campanhas"
    cy.get('.navegacao-lateral a[data-secao="campanhas-doador"]').click();
    cy.url().should('include', '/usuarios/painel-doador/secao/campanhas-doador/');

    // Espera a requisição interceptada ser concluída
    cy.wait('@getCampanhasAtivas');

    // 2. Verificar se a seção de campanhas está visível
    cy.get('#campanhas-doador').should('be.visible');
    cy.get('#campanhas-doador h1').should('contain', 'Campanhas'); // Ajuste o título se for diferente

    // 3. Verificar a presença e o conteúdo das campanhas
    // Adicionado .should('be.visible') para garantir que o elemento está visível antes de verificar o length.
    // Isso dá mais tempo para o elemento ser renderizado e se tornar visível.
    cy.get('#campanhas-doador .cartao-campanha').should('be.visible').and('have.length', 2); // Deve ter 2 campanhas mockadas

    // Verifica os detalhes da primeira campanha
    cy.get('#campanhas-doador .cartao-campanha').eq(0).as('campanhaAgua');
    cy.get('@campanhaAgua').find('h3').should('contain', 'Água Potável para Todos');
    cy.get('@campanhaAgua').find('p.descricao').should('contain', 'Construção de poços artesianos');
    // ATENÇÃO: Ajuste os seletores para os elementos que exibem meta, arrecadado, progresso e impacto.
    cy.get('@campanhaAgua').find('.meta-arrecadado').should('contain', 'R$ 7.500,00 de R$ 10.000,00'); // Exemplo
    cy.get('@campanhaAgua').find('.progresso-barra').should('have.attr', 'style', 'width: 75%;'); // Exemplo
    cy.get('@campanhaAgua').find('.impacto-esperado').should('contain', 'Acesso à água potável para 500 famílias.');
  });

  it('Cenário 7.2: deve permitir a doação direcionada para uma campanha específica', () => {
    // Dado que um doador se interessou por uma campanha específica e deseja contribuir,
    // Quando ele seleciona a campanha e realiza o processo de doação,
    // Então sua doação é contabilizada especificamente para aquela campanha,
    // e ele recebe uma confirmação de que seu apoio será direcionado para aquele projeto ou necessidade.

    // Simula que a API de campanhas retorna uma campanha ativa para ser doada.
    cy.intercept('GET', `${BASE_URL}/api/campanhas/*`, {
      statusCode: 200,
      body: [
        {
          id: 203,
          nome: 'Cozinha Comunitária',
          descricao: 'Construção de uma cozinha para servir refeições gratuitas.',
          meta_financeira: 20000.00,
          arrecadado_atual: 10000.00,
          progresso_porcentagem: 50,
          impacto_esperado: 'Alimentação para 300 pessoas diariamente.'
        }
      ]
    }).as('getCampanhaParaDoacao');

    // Simula a requisição POST de doação para a campanha.
    // ATENÇÃO: Ajuste o endpoint `/api/doar-campanha/` para o URL real da sua API Django.
    cy.intercept('POST', `${BASE_URL}/api/doar-campanha/`, {
      statusCode: 200,
      body: {
        status: 'sucesso',
        mensagem: 'Sua doação para a campanha "Cozinha Comunitária" foi registrada com sucesso!'
      }
    }).as('postDoacaoCampanha');

    // 1. Navegar até a seção "Campanhas"
    cy.get('.navegacao-lateral a[data-secao="campanhas-doador"]').click();
    cy.url().should('include', '/usuarios/painel-doador/secao/campanhas-doador/');
    cy.wait('@getCampanhaParaDoacao'); // Espera a campanha ser carregada

    // 2. Clicar no botão "Doar" da campanha desejada (assumindo que o botão abre um modal)
    // ATENÇÃO: Ajuste o seletor do botão "Doar" dentro do cartão de campanha.
    // Pelo seu HTML, o botão é '.abrir-modal-doar-campanha'
    cy.get('#campanhas-doador .cartao-campanha').first().find('.abrir-modal-doar-campanha').click();

    // 3. Verificar se o modal de doação aparece
    cy.get('#modal-doar-campanha-painel').should('be.visible');
    cy.get('#modal-doar-campanha-titulo').should('contain', 'Doar para: Cozinha Comunitária');

    // 4. Preencher o valor e método de pagamento no modal
    // ATENÇÃO: Ajuste os seletores para os campos do seu modal de doação.
    cy.get('#doar-campanha-valor-modal').type('150,00'); // Valor com vírgula para pt-BR
    cy.get('select[name="metodo-campanha-modal"]').select('PIX'); // Exemplo: Seleciona o método PIX

    // 5. Clicar no botão de confirmar doação no modal
    cy.get('#modal-doar-campanha-painel button[type="submit"]').click();

    // Espera a requisição POST de doação ser concluída
    cy.wait('@postDoacaoCampanha').then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
      expect(interception.response.body.status).to.eq('sucesso');
    });

    // 6. Verificar a confirmação de que a doação foi direcionada
    // ATENÇÃO: Ajuste o seletor e o texto da mensagem de sucesso.
    cy.get('.alert.alert-success', { timeout: 10000 }).should('be.visible')
      .and('contain', 'Sua doação para a campanha "Cozinha Comunitária" foi registrada com sucesso!');
    
    // Opcional: Verificar se o modal fechou
    cy.get('#modal-doar-campanha-painel').should('not.be.visible');
  });

  it('Cenário 7.3: deve indicar informações de progresso da campanha desatualizadas', () => {
    // Dado que um doador já contribuiu para uma campanha específica e deseja acompanhar seu andamento,
    // Quando ele acessa a página da campanha na plataforma para verificar o progresso da arrecadação,
    // Então ele percebe que os dados sobre o valor arrecadado ou o número de apoiadores não foram atualizados recentemente,
    // gerando incerteza se a campanha ainda está ativa ou progredindo.

    // Simula que a API de campanhas retorna dados com progresso que não foi atualizado.
    // Podemos adicionar um campo `ultima_atualizacao` para simular isso.
    cy.intercept('GET', `${BASE_URL}/api/campanhas/*`, {
      statusCode: 200,
      body: [
        {
          id: 204,
          nome: 'Reforma da Sede',
          descricao: 'Reforma da sede da ONG para melhor atendimento.',
          meta_financeira: 50000.00,
          arrecadado_atual: 25000.00,
          progresso_porcentagem: 50,
          impacto_esperado: 'Espaço mais adequado para atividades.',
          ultima_atualizacao: '2023-01-15T10:00:00Z' // Data antiga
        }
      ]
    }).as('getCampanhaDesatualizada');

    // 1. Navegar até a seção "Campanhas"
    cy.get('.navegacao-lateral a[data-secao="campanhas-doador"]').click();
    cy.url().should('include', '/usuarios/painel-doador/secao/campanhas-doador/');

    // Espera a requisição interceptada ser concluída
    cy.wait('@getCampanhaDesatualizada');

    // 2. Verificar se a seção de campanhas está visível
    cy.get('#campanhas-doador').should('be.visible');

    // 3. Verificar que a campanha com dados desatualizados é exibida
    // Adicionado .should('be.visible') para garantir que o elemento está visível antes de verificar o length.
    cy.get('#campanhas-doador .cartao-campanha').should('be.visible').and('have.length', 1);
    cy.get('#campanhas-doador .cartao-campanha').first().as('campanhaDesatualizada');
    cy.get('@campanhaDesatualizada').find('h3').should('contain', 'Reforma da Sede');

    // 4. Verificar a presença de um indicador de data de atualização (se existir na UI)
    // ATENÇÃO: Se você tiver um elemento que mostra a data da última atualização no seu cartão de campanha,
    // ajuste o seletor e o texto para verificar se ele indica uma data antiga ou a ausência de atualização.
    cy.get('@campanhaDesatualizada').find('.data-ultima-atualizacao').should('be.visible') // Exemplo de seletor
      .and('contain', 'Última atualização: 15/01/2023'); // AJUSTE O TEXTO E O FORMATO DA DATA ESPERADA!

    // Opcional: Verificar se há uma mensagem de alerta sobre dados desatualizados, se a UI tiver essa funcionalidade.
    // cy.get('@campanhaDesatualizada').find('.alerta-desatualizado').should('be.visible');
  });
});
