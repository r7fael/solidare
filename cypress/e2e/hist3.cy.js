// cypress/e2e/historia1_doador.cy.js
// Este arquivo contém os testes para a "História de Usuário 1: Eu como doador, gostaria de receber atualizações de impacto regularmente."

// Define a URL base da sua aplicação Django
const BASE_URL = 'http://127.0.0.1:8000'; // CONFIRME se o seu servidor Django roda nesta porta!

describe('História de Usuário 1: Atualizações de Impacto para Doadores', () => {

  // Antes de CADA TESTE neste bloco, um novo usuário será criado e logado.
  let createdUserEmail; // Variáveis para armazenar as credenciais do usuário criado
  let createdUserPassword;

  beforeEach(() => {
    // 1. Criar um novo usuário doador dinamicamente para cada teste
    cy.visit(`${BASE_URL}/usuarios/registro/`);
    const uniqueSuffix = Date.now();
    const nomeCompleto = `Doador Teste ${uniqueSuffix}`;
    const cpf = `111222333${String(uniqueSuffix).slice(-4)}`; // CPF único
    createdUserEmail = `doador.hist1.${uniqueSuffix}@example.com`; // Email único
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

  it('Cenário 1.1: deve exibir uma atualização de impacto na seção de mensagens', () => {
    // Dada que um doador realizou uma ou mais doações e deseja acompanhar o impacto,
    // Quando a ONG disponibiliza atualizações sobre o andamento dos programas e o impacto das doações,
    // Então o doador recebe notificações regulares com essas informações.

    // Simula que a ONG enviou uma atualização de impacto como uma mensagem para o doador.
    // ATENÇÃO CRÍTICA: Ajuste o endpoint `/api/mensagens/doador/*` para o URL real da sua API Django
    // que o frontend usa para buscar as mensagens do doador.
    // Você pode verificar isso nas ferramentas de desenvolvedor do navegador (aba Network)
    // ao navegar para a seção de mensagens da sua aplicação.
    cy.intercept('GET', `${BASE_URL}/api/mensagens/doador/*`, {
      statusCode: 200,
      body: [
        {
          id: 1,
          destinatario: { nome: 'ONG Solidare' },
          assunto: 'Atualização de Impacto: Junho 2024',
          conteudo: 'Sua doação ajudou 100 pessoas neste mês! Veja o relatório completo.',
          data_envio: '2024-06-01T10:00:00Z',
          status: 'APROVADO'
        }
      ]
    }).as('getMensagensComAtualizacao');

    // 1. Navegar até a seção "Mensagens"
    cy.get('.navegacao-lateral a[data-secao="mensagens"]').click();
    cy.url().should('include', '/usuarios/painel-doador/secao/mensagens/');

    // Espera a requisição interceptada ser concluída


    // 2. Verificar se a seção de mensagens está ativa e visível
    cy.get('#mensagens').should('be.visible');
    cy.get('#mensagens h1').should('contain', 'Minhas Mensagens');

    // 3. Verificar a presença e o conteúdo da mensagem de atualização de impacto
    // Adicionado .should('be.visible') para garantir que o elemento está visível antes de verificar o length.
    // Isso dá mais tempo para o elemento ser renderizado e se tornar visível.
    cy.get('.lista-mensagens .cartao-mensagem').should('be.visible').and('have.length', 1);
    cy.get('.lista-mensagens .cartao-mensagem .cabecalho-mensagem h3').should('contain', 'Para: ONG Solidare');
    cy.get('.lista-mensagens .cartao-mensagem .corpo-mensagem h4').should('contain', 'Atualização de Impacto: Junho 2024');
    cy.get('.lista-mensagens .cartao-mensagem .corpo-mensagem p').should('contain', 'Sua doação ajudou 100 pessoas neste mês!');
    cy.get('.lista-mensagens .cartao-mensagem .status-mensagem').should('contain', 'Aprovada');
  });

  it('Cenário 1.2: deve permitir que o doador acesse o histórico detalhado de doações na plataforma', () => {
    // Dado que um doador deseja verificar o impacto de suas doações anteriores,
    // Quando ele acessa seu perfil na plataforma,
    // Então ele pode visualizar um histórico detalhado com dados sobre como sua contribuição foi utilizada.

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
    // (já que o usuário é recém-criado e não tem doações)
    cy.get('.tabela-doacoes tbody tr').should('have.length', 1);
    cy.get('.tabela-doacoes tbody tr .sem-registros p').should('contain', 'Nenhuma doação registrada ainda');
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

    // Espera a requisição interceptada ser concluída


    // 2. Verificar se a seção de mensagens está ativa e visível
    cy.get('#mensagens').should('be.visible');
    cy.get('#mensagens h1').should('contain', 'Minhas Mensagens');

    // 3. Verificar que NENHUMA mensagem de atualização de impacto aparece
    cy.get('.lista-mensagens .cartao-mensagem').should('not.exist');

    // 4. Verificar se a mensagem de "Nenhuma mensagem enviada ainda" está visível
    cy.get('.lista-mensagens .sem-mensagens p').should('be.visible')
      .and('contain', 'Nenhuma mensagem enviada ainda');
  });

  it('deve permitir que o doador envie uma nova mensagem', () => {
    // 1. Navegar até a seção "Mensagens"
    cy.get('.navegacao-lateral a[data-secao="mensagens"]').click();
    cy.url().should('include', '/usuarios/painel-doador/secao/mensagens/');

    // 2. Clicar no botão "Nova Mensagem" para exibir o formulário
    cy.get('#btn-nova-mensagem-form').click();
    cy.get('#formulario-nova-mensagem').should('be.visible');

    // 3. Preencher o formulário de nova mensagem
    const assuntoMensagem = `Mensagem de Teste ${Date.now()}`;
    const conteudoMensagem = `Este é o conteúdo da mensagem de teste enviada em ${new Date().toLocaleString()}.`;

    // Seleciona o primeiro beneficiário disponível no dropdown.
    // ATENÇÃO: Certifique-se de que há pelo menos um beneficiário disponível no seu DB de teste.
    cy.get('select[name="destinatario"]').select(1); // Seleciona a segunda opção (índice 1) ou use .select('valor_do_id_do_beneficiario')
    cy.get('input[name="assunto"]').type(assuntoMensagem);
    cy.get('textarea[name="conteudo"]').type(conteudoMensagem);

    // 4. Clicar no botão "Enviar Mensagem"
    cy.get('#formulario-nova-mensagem button[type="submit"]').click();

    // --- ASSERÇÕES PÓS-ENVIO BEM-SUCEDIDO ---
    // A submissão do formulário de mensagem geralmente faz um POST para a mesma URL do painel.

    // Verifica se a URL permanece na seção de mensagens
    cy.url().should('include', '/usuarios/painel-doador/secao/mensagens/');

    // Verifica se aparece uma mensagem de sucesso.
    // ATENÇÃO: Ajuste o seletor e o texto da mensagem conforme seu sistema.
    // As mensagens de feedback do Django no seu painel estão em `.alert.alert-success` ou similar.
    
    // Opcional: Verificar se a mensagem recém-enviada aparece na lista de mensagens.
    // Isso pode exigir uma pequena espera para a UI renderizar a nova mensagem,
    // ou uma nova interceptação se a lista for carregada via API.
    cy.get('.lista-mensagens .cartao-mensagem').should('have.length.greaterThan', 0); // Garante que há mensagens
    cy.get('.lista-mensagens .cartao-mensagem').first().should('contain', assuntoMensagem);
    cy.get('.lista-mensagens .cartao-mensagem').first().should('contain', 'Aguardando Aprovação'); // Ou o status inicial esperado
  });

});
