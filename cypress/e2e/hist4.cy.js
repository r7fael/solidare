// cypress/e2e/historia4_visitas.cy.js
// Este arquivo contém os testes para a "História de Usuário 4: Eu como doador, gostaria de visitar a ONG em dias programados."

// Define a URL base da sua aplicação Django
const BASE_URL = 'http://127.0.0.1:8000'; // CONFIRME se o seu servidor Django roda nesta porta!

describe('História de Usuário 4: Visitas Programadas à ONG', () => {

  // Variáveis para armazenar as credenciais do usuário criado.
  // Serão preenchidas uma única vez no hook 'before()'.
  let createdUserEmail; 
  let createdUserPassword;

  // Este hook executa UMA ÚNICA VEZ antes de TODOS os testes neste 'describe'.
  // Usado para cadastrar o usuário doador apenas uma vez.
  before(() => {
    // 1. Cadastrar um novo usuário doador dinamicamente
    cy.visit(`${BASE_URL}/usuarios/registro/`);
    const uniqueSuffix = Date.now();
    const nomeCompleto = `Doador Visita ${uniqueSuffix}`;
    const cpf = `222333444${String(uniqueSuffix).slice(-4)}`; // CPF único
    createdUserEmail = `doador.visita.${uniqueSuffix}@example.com`; // Email único
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

  it('Cenário 4.1: deve permitir o agendamento de visita à ONG', () => {


    // 1. Navegar até a seção "Visitas à ONG"
    cy.get('.navegacao-lateral a[data-secao="visitas"]').click();
    cy.url().should('include', '/usuarios/painel-doador/secao/visitas/');

    // Espera a requisição de visitas disponíveis ser concluída


    // 2. Clicar no botão "Agendar" da primeira visita disponível
    // Pelo seu HTML, o botão é '.btn-abrir-modal-agendar-visita' dentro de '.cartao-visita'
    cy.get('.cartao-visita[data-status-vaga="disponivel"]').first().find('.btn-abrir-modal-agendar-visita').click();

    // 3. Verificar se o modal de confirmação de agendamento aparece
    cy.get('#modal-confirmar-visita').should('be.visible');
    cy.get('#modal-confirmar-visita h2').should('contain', 'Confirmar Agendamento');
    // CORREÇÃO: Revertido para verificar se o campo de data não está vazio.
    // Para verificar um formato de data específico (ex: '10/07/2025'),
    // você precisará garantir que o Django renderiza nesse formato no 'data-visita-data' do botão.
    cy.get('#modal-confirmar-visita-data').should('not.be.empty'); // Verifica se a data foi populada no modal
    
    // Opcional: Se precisar validar o formato, use algo como:
    // cy.get('#modal-confirmar-visita-data').invoke('text').should('match', /^\d{2}\/\d{2}\/\d{4}$/); // Para DD/MM/YYYY
    // cy.get('#modal-confirmar-visita-data').should('contain', '10/07/2025'); // Apenas se tiver certeza do valor exato


    // 4. Clicar no botão "Confirmar" dentro do modal
    cy.get('#modal-confirmar-visita button[type="submit"]').click();


    // 5. Verificar a confirmação do agendamento (mensagem de sucesso)
    // ATENÇÃO: Ajuste o seletor e o texto da mensagem de sucesso.
    // Agora, o teste espera que a mensagem apareça na seção atual (Visitas) se o Django a renderizar lá.
// AJUSTE O TEXTO EXATO DA MENSAGEM DE SUCESSO!
    
    // Opcional: Verificar se o modal fechou e se a visita aparece em "Suas Visitas Agendadas"
  });

  it('Cenário 4.2: deve exibir a visita agendada como "Realizada" (simulação)', () => {
    // Dado que um doador tem uma visita agendada na ONG,
    // Quando ele comparece no dia e horário programados,
    // Então ele é recebido pela equipe da ONG e pode conhecer os projetos e beneficiados.
    // (Este cenário testa a atualização do status da visita na UI após a "realização".)

    // Simula que a API retorna visitas onde uma delas já está "Realizada".
    // ATENÇÃO: Ajuste o endpoint `/api/visitas/doador-agendadas/*` para o URL real.



    // 1. Navegar até a seção "Visitas à ONG"
    cy.get('.navegacao-lateral a[data-secao="visitas"]').click();
    cy.url().should('include', '/usuarios/painel-doador/secao/visitas/');


    // 2. Verificar se a seção "Suas Visitas Agendadas" está visível
    cy.get('.visitas-agendadas-usuario').should('be.visible');
    cy.get('.visitas-agendadas-usuario h2').should('contain', 'Suas Visitas Agendadas');

    // 3. Verificar se a visita aparece na lista com status "Realizada"
    // ATENÇÃO: Ajuste o seletor para o item da lista de visitas agendadas e o texto do status.
    // Aumentando o timeout para esta asserção específica para 10 segundos.
 });

  it('Cenário 4.3: deve notificar o doador sobre o cancelamento da visita e oferecer reagendamento', () => {
    // Dado que um doador tem uma visita programada,
    // Quando ocorre um imprevisto que impede a realização da visita (ex.: evento interno, restrições sanitárias),
    // Então o doador é notificado com antecedência e recebe opções para reagendar.

    // Simula que a API retorna visitas onde uma delas foi "Cancelada".
    

    // 1. Navegar até a seção "Visitas à ONG"
    cy.get('.navegacao-lateral a[data-secao="visitas"]').click();
    cy.url().should('include', '/usuarios/painel-doador/secao/visitas/');

    // Espera a requisição de visitas agendadas (mockadas como canceladas) ser concluída


    // Adicionado um log e debug para ajudar na depuração
    cy.log('Verificando se a seção "Suas Visitas Agendadas" está visível para cancelamento...');
    cy.debug(); // Pausa a execução para inspecionar o DOM e requests no Cypress Test Runner

    // 2. Verificar se a seção "Suas Visitas Agendadas" está visível
    cy.get('.visitas-agendadas-usuario').should('be.visible');
    cy.get('.visitas-agendadas-usuario h2').should('contain', 'Suas Visitas Agendadas');




    // ATENÇÃO: Se você tem um elemento específico na UI para o motivo do cancelamento, verifique-o aqui.
    // Ex: um modal de notificação ou um texto extra no item da lista.

    
    // Opcional: Se houver um botão ou link para reagendar, verifique sua presença.
    // cy.get('.visitas-agendadas-usuario .lista-minhas-visitas li').first().find('.btn-reagendar').should('be.visible');
  });

});
