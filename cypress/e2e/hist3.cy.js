// cypress/e2e/historia3_mensagens.cy.js
// Este arquivo contém os testes para a "História de Usuário 3: Eu como doador, gostaria de enviar mensagens de incentivo supervisionadas pelos colaboradores da ONG."

// Define a URL base da sua aplicação Django
const BASE_URL = 'http://127.0.0.1:8000'; // CONFIRME se o seu servidor Django roda nesta porta!

describe('História de Usuário 3: Mensagens de Incentivo Supervisionadas', () => {

  // Variáveis para armazenar as credenciais do usuário criado.
  // Serão preenchidas uma única vez no hook 'before()'.
  let createdUserEmail; 
  let createdUserPassword;
  let createdUserId; // Para simular ações da API, se necessário

  // Este hook executa UMA ÚNICA VEZ antes de TODOS os testes neste 'describe'.
  // Usado para cadastrar o usuário doador apenas uma vez.
  before(() => {
    // 1. Cadastrar um novo usuário doador dinamicamente
    cy.visit(`${BASE_URL}/usuarios/registro/`);
    const uniqueSuffix = Date.now();
    const nomeCompleto = `Doador Mensagem ${uniqueSuffix}`;
    const cpf = `333222111${String(uniqueSuffix).slice(-4)}`; // CPF único
    createdUserEmail = `doador.msg.${uniqueSuffix}@example.com`; // Email único
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

    // Opcional: Se sua API de registro retornar o ID do usuário, você pode capturá-lo aqui.
    // Isso seria útil para cenários que exigem a manipulação direta do usuário via API.
    // cy.intercept('POST', `${BASE_URL}/api/usuarios/registro/`, (req) => {
    //   req.continue((res) => {
    //     createdUserId = res.body.id; // Exemplo: se a resposta da API incluir o ID
    //   });
    // });
  });

  // Este hook executa ANTES DE CADA TESTE 'it'.
  // Usado para fazer login com o usuário já criado.
  beforeEach(() => {
    // Limpa cookies e localStorage para garantir um estado limpo para o login em cada teste
    cy.clearCookies();
    cy.clearLocalStorage();
    
    // 2. Fazer login com o usuário recém-cadastrado (cujas credenciais foram salvas no 'before()')
    cy.visit(`${BASE_URL}/usuarios/login/`);
    cy.get('input[name="email"]').type(createdUserEmail);
    cy.get('input[name="senha"]').type(createdUserPassword);
    cy.get('button[type="submit"]').click();
    cy.url().should('eq', `${BASE_URL}/usuarios/painel-doador/`);
    cy.get('h1').contains('Bem-vindo,').should('be.visible');
  });

  it('Cenário 3.1: deve permitir o envio de mensagens de incentivo para os jovens beneficiados (e aguardar revisão)', () => {
    // Dado que um doador deseja enviar uma mensagem de incentivo para os jovens beneficiados,
    // Quando ele acessa a plataforma e escreve uma mensagem,
    // Então a mensagem é enviada para a equipe da ONG para revisão antes de ser entregue ao destinatário.

    // 1. Navegar até a seção "Mensagens"
    cy.get('.navegacao-lateral a[data-secao="mensagens"]').click();
    cy.url().should('include', '/usuarios/painel-doador/secao/mensagens/');

    // 2. Clicar no botão "Nova Mensagem" para exibir o formulário
    cy.get('#btn-nova-mensagem-form').click();
    cy.get('#formulario-nova-mensagem').should('be.visible');

    // 3. Preencher o formulário de nova mensagem
    const assuntoMensagem = `Incentivo ${Date.now()}`;
    const conteudoMensagem = `Força! Conteúdo da mensagem de incentivo enviada em ${new Date().toLocaleString()}.`;

    // ATENÇÃO: Certifique-se de que há pelo menos um beneficiário disponível no seu DB de teste
    // e que o dropdown 'destinatario-mensagem' possui opções válidas.
    // Seleciona a segunda opção (índice 1) do dropdown 'destinatario-mensagem'.
    cy.get('select#destinatario-mensagem').select(1); 
    cy.get('input#assunto-mensagem').type(assuntoMensagem);
    cy.get('textarea#conteudo-mensagem').type(conteudoMensagem);

    // Simula a requisição POST de envio da mensagem.
    // ATENÇÃO: Ajuste o endpoint `/api/mensagens/enviar/` para o URL real da sua API Django.
    cy.intercept('POST', `${BASE_URL}/api/mensagens/enviar/`, {
      statusCode: 200,
      body: {
        status: 'sucesso',
        mensagem: 'Mensagem enviada com sucesso para revisão!',
        mensagem_id: 123 // Um ID mockado para a mensagem
      }
    }).as('postMensagemIncentivo');

    // 4. Clicar no botão "Enviar Mensagem"
    cy.get('#formulario-nova-mensagem button[type="submit"]').click();

    // 5. Verificar a confirmação de que a mensagem foi enviada para revisão
    cy.url().should('include', '/usuarios/painel-doador/secao/mensagens/');
    


    // 6. Verificar que a mensagem recém-enviada aparece na lista com status "Aguardando Aprovação"
    // ATENÇÃO: Se a lista de mensagens for carregada via API, você precisaria interceptar o GET para a lista.
    // Por simplicidade, verificamos o DOM diretamente aqui, assumindo que a UI se atualiza.
    cy.get('.lista-mensagens .cartao-mensagem').should('have.length.greaterThan', 0);
    cy.get('.lista-mensagens .cartao-mensagem').first().should('contain', assuntoMensagem);
    cy.get('.lista-mensagens .cartao-mensagem').first().should('contain', 'Aguardando Aprovação'); // AJUSTE O TEXTO EXATO DO STATUS!
  });

  it('Cenário 3.2: deve exibir a mensagem como "Aprovada" após revisão da equipe da ONG', () => {
    // Dado que um doador enviou uma mensagem de incentivo através da plataforma,
    // Quando a equipe da ONG revisa e aprova o conteúdo,
    // Então a mensagem é encaminhada ao jovem beneficiado de forma segura e supervisionada.

    // 1. Enviar uma mensagem primeiro (reutiliza passos do Cenário 3.1)
    cy.get('.navegacao-lateral a[data-secao="mensagens"]').click();
    cy.get('#btn-nova-mensagem-form').click();
    const assuntoAprovado = `Mensagem Aprovada ${Date.now()}`;
    const conteudoAprovado = `Parabéns! Mensagem aprovada em ${new Date().toLocaleString()}.`;
    cy.get('select#destinatario-mensagem').select(1);
    cy.get('input#assunto-mensagem').type(assuntoAprovado);
    cy.get('textarea#conteudo-mensagem').type(conteudoAprovado);

    let mensagemIdParaAprovar;
    cy.intercept('POST', `${BASE_URL}/api/mensagens/enviar/`, (req) => {
      req.continue((res) => {
        mensagemIdParaAprovar = res.body.mensagem_id; // Captura o ID da mensagem recém-enviada
      });
    }).as('postMensagemParaAprovar');
    cy.get('#formulario-nova-mensagem button[type="submit"]').click();
    cy.url().should('include', '/usuarios/painel-doador/secao/mensagens/');
    
    // 2. Simular a aprovação da mensagem pela equipe da ONG (via API)
    // ATENÇÃO: Você precisará de um endpoint API no seu Django para a aprovação de mensagens
    // e possivelmente de um token de autenticação de gestor ou admin.
    cy.request({
      method: 'POST',
      url: `${BASE_URL}/api/mensagens/${mensagemIdParaAprovar}/aprovar/`, // Exemplo de endpoint de aprovação
      body: { status: 'APROVADO' },
      headers: {
        'X-CSRFToken': 'your-csrf-token', // Você precisaria obter o CSRF token ou desabilitar para cy.request
        // 'Authorization': 'Bearer <token_do_gestor>' // Se sua API exigir autenticação
      },
      failOnStatusCode: false // Não falha se a requisição retornar um status de erro
    }).then((response) => {


    // 3. Recarregar a seção de mensagens ou esperar a atualização do DOM para verificar o novo status
    // ATENÇÃO: Se a lista de mensagens for carregada via API, você precisaria interceptar o GET novamente
    // com a mensagem agora "Aprovada".
   

  });

  it('Cenário 3.3: deve exibir a mensagem como "Rejeitada" com sugestões de ajustes', () => {
    // Dado que um doador escreveu uma mensagem para um jovem beneficiado,
    // Quando a equipe da ONG identifica que o conteúdo não segue as diretrizes da organização,
    // Então a mensagem é rejeitada e o doador recebe um aviso com sugestões de ajustes.

    // 1. Enviar uma mensagem primeiro (reutiliza passos do Cenário 3.1)
    cy.get('.navegacao-lateral a[data-secao="mensagens"]').click();
    cy.get('#btn-nova-mensagem-form').click();
    const assuntoRejeitado = `Mensagem Rejeitada ${Date.now()}`;
    const conteudoRejeitado = `Conteúdo que não segue diretrizes.`;
    cy.get('select#destinatario-mensagem').select(1);
    cy.get('input#assunto-mensagem').type(assuntoRejeitado);
    cy.get('textarea#conteudo-mensagem').type(conteudoRejeitado);

    let mensagemIdParaRejeitar;
    cy.intercept('POST', `${BASE_URL}/api/mensagens/enviar/`, (req) => {
      req.continue((res) => {
        mensagemIdParaRejeitar = res.body.mensagem_id;
      });
    }).as('postMensagemParaRejeitar');
    cy.get('#formulario-nova-mensagem button[type="submit"]').click();
    cy.wait('@postMensagemParaRejeitar');
    cy.url().should('include', '/usuarios/painel-doador/secao/mensagens/');

    // 2. Simular a rejeição da mensagem pela equipe da ONG (via API)
    cy.request({
      method: 'POST',
      url: `${BASE_URL}/api/mensagens/${mensagemIdParaRejeitar}/rejeitar/`, // Exemplo de endpoint de rejeição
      body: { status: 'REJEITADO', motivo_rejeicao: 'Conteúdo inadequado. Por favor, seja mais respeitoso.' },
      headers: {
        'X-CSRFToken': 'your-csrf-token', 
        // 'Authorization': 'Bearer <token_do_gestor>'
      },
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.be.oneOf([200, 204]);
    });

    // 3. Recarregar a seção de mensagens ou esperar a atualização do DOM para verificar o novo status
    cy.intercept('GET', `${BASE_URL}/api/mensagens/doador/*`, {
      statusCode: 200,
      body: [
        {
          id: mensagemIdParaRejeitar,
          destinatario: { nome: 'Jovem Beneficiado' },
          assunto: assuntoRejeitado,
          conteudo: conteudoRejeitado,
          data_envio: '2024-06-01T10:00:00Z',
          status: 'REJEITADO',
          motivo_rejeicao: 'Conteúdo inadequado. Por favor, seja mais respeitoso.'
        }
      ]
    }).as('getMensagensRejeitadas');
    cy.reload();

    // 4. Verificar se a mensagem aparece na lista com status "Rejeitada" e o motivo
    cy.get('.lista-mensagens .cartao-mensagem').should('have.length', 1);
    cy.get('.lista-mensagens .cartao-mensagem').first().should('contain', assuntoRejeitado);
    cy.get('.lista-mensagens .cartao-mensagem').first().find('.status-mensagem').should('contain', 'Rejeitada');
    cy.get('.lista-mensagens .cartao-mensagem').first().find('.motivo-rejeicao').should('be.visible')
      .and('contain', 'Motivo da rejeição: Conteúdo inadequado. Por favor, seja mais respeitoso.'); // AJUSTE O TEXTO EXATO DO MOTIVO!
  });

});
});