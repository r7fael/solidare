// cypress/e2e/historia4_visitas.cy.js
// Este arquivo contém os testes para a "História de Usuário 4: Eu como doador, gostaria de visitar a ONG em dias programados."

// Define a URL base da sua aplicação Django
const BASE_URL = 'http://127.0.0.1:8000'; // CONFIRME se o seu servidor Django roda nesta porta!

// Função utilitária para gerar CPF (simplificada, para fins de teste)
// Se seu backend tiver uma validação de CPF muito rigorosa, considere uma biblioteca mais robusta
// ou use um CPF válido estático conhecido para testes.
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

describe('História de Usuário 4: Visitas Programadas à ONG', () => {

  let createdUserEmail; 
  let createdUserPassword;

  before(() => {
    // 1. Cadastrar um novo usuário doador dinamicamente
    cy.visit(`${BASE_URL}/usuarios/registro/`);
    const uniqueSuffix = Date.now();
    const nomeCompleto = `Doador Visita ${uniqueSuffix}`;
    const cpf = gerarCPFValidoSimples(); // Usando a função para gerar CPF
    createdUserEmail = `doador.visita.${uniqueSuffix}@example.com`;
    createdUserPassword = 'password123';

    cy.log(`Tentando cadastrar usuário: ${nomeCompleto}, CPF: ${cpf}, Email: ${createdUserEmail}`);

    cy.get('input[name="nome"]').type(nomeCompleto);
    cy.get('input[name="cpf"]').type(cpf);
    cy.get('input[name="email"]').type(createdUserEmail);
    cy.get('input[name="senha"]').type(createdUserPassword);
    cy.get('select[name="tipo_usuario"]').select('doador');
    cy.get('button[type="submit"]').click();
    
    // ATENÇÃO: Verifique o comportamento do seu backend Django após o registro.
    // Se ele redirecionar para a página de login:
    cy.url().should('include', '/usuarios/login/'); 
    cy.log(`Usuário ${createdUserEmail} cadastrado e redirecionado para login.`);
    // Se ele permanecer na página de registro e exibir uma mensagem de sucesso:
    // cy.url().should('include', '/usuarios/registro/');
    // cy.get('.alert.alert-success').should('be.visible').and('contain', 'Usuário cadastrado com sucesso!'); // AJUSTE A MENSAGEM
  });

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    
    // 2. Fazer login com o usuário recém-cadastrado
    if (!createdUserEmail || !createdUserPassword) {
      throw new Error("Credenciais do usuário não foram definidas no hook before(). O cadastro pode ter falhado.");
    }
    cy.visit(`${BASE_URL}/usuarios/login/`);
    cy.get('input[name="email"]').type(createdUserEmail);
    cy.get('input[name="senha"]').type(createdUserPassword);
    cy.get('button[type="submit"]').click();
    cy.url().should('eq', `${BASE_URL}/usuarios/painel-doador/`);
    cy.get('h1').contains('Bem-vindo,').should('be.visible'); // Ajuste conforme a saudação real
  });

  it('Cenário 4.1: deve permitir o agendamento de visita à ONG', () => {
    // Dado que um doador deseja visitar a ONG em um dia programado,
    // Quando ele acessa a plataforma e agenda uma visita conforme as datas disponíveis,
    // Então ele recebe a confirmação do agendamento com as informações necessárias para a visita.

    // ATENÇÃO: Ajuste o endpoint `/api/visitas/disponiveis/?*` para o URL real da sua API.
    cy.intercept('GET', `${BASE_URL}/api/visitas/disponiveis/?*`, {
      statusCode: 200,
      body: [
        {
          id: 301,
          data: '2025-07-10T14:00:00Z', // Data futura
          capacidade_maxima: 10,
          vagas_restantes: 5,
          status: 'DISPONIVEL' // Status que sua UI usa para identificar vagas
        }
      ]
    }).as('getVisitasDisponiveis');

    // ATENÇÃO: Ajuste o endpoint `/api/visitas/agendar/` para o URL real.
    cy.intercept('POST', `${BASE_URL}/api/visitas/agendar/`, {
      statusCode: 200, // Ou 201, dependendo da sua API
      body: {
        status: 'sucesso',
        mensagem: 'Visita agendada com sucesso!',
        agendamento: { id: 1, data: '2025-07-10T14:00:00Z' }
      }
    }).as('postAgendarVisita');

    // 1. Navegar até a seção "Visitas à ONG"
    // Considere usar um seletor mais robusto como 'data-cy' se possível
    cy.get('.navegacao-lateral a[data-secao="visitas"]').click();
    cy.url().should('include', '/usuarios/painel-doador/secao/visitas/');


    // 2. Clicar no botão "Agendar" da primeira visita disponível
    cy.get('.cartao-visita[data-status-vaga="disponivel"]').first().find('.btn-abrir-modal-agendar-visita').click();

    // 3. Verificar se o modal de confirmação de agendamento aparece
    cy.get('#modal-confirmar-visita').should('be.visible');
    cy.get('#modal-confirmar-visita h2').should('contain', 'Confirmar Agendamento'); // AJUSTE TEXTO
    cy.get('#modal-confirmar-visita-data').invoke('text').then((text) => {
        expect(text.trim()).not.to.be.empty;
        // Se a data for formatada (ex: 10/07/2025), adicione uma verificação mais específica:
        // expect(text).to.match(/\d{1,2}\/\d{1,2}\/\d{4}/);
        // expect(text).to.contain('10/07/2025'); // Se souber o valor exato formatado
    });
    
    // 4. Clicar no botão "Confirmar" dentro do modal
    cy.get('#modal-confirmar-visita button[type="submit"]').click();

    // 5. Verificar a confirmação do agendamento (mensagem de sucesso)
    // ATENÇÃO: Ajuste o seletor e o texto da mensagem de sucesso.
    cy.get('.alert.alert-success', { timeout: 10000 }).should('be.visible')
      .and('contain', 'Visita agendada com sucesso!'); // AJUSTE O TEXTO EXATO DA MENSAGEM DE SUCESSO!
    
    cy.get('#modal-confirmar-visita').should('not.be.visible');
    cy.get('.visitas-agendadas-usuario').should('be.visible');
    // ATENÇÃO: Verifique o formato da data como exibido na UI.
    cy.get('.visitas-agendadas-usuario .lista-minhas-visitas li').should('contain', '10/07/2025'); // AJUSTE FORMATO DATA
  });

  it('Cenário 4.2: deve exibir a visita agendada como "Realizada" (simulação)', () => {
    // Dado que um doador tem uma visita agendada na ONG,
    // Quando ele comparece no dia e horário programados,
    // Então ele é recebido pela equipe da ONG e pode conhecer os projetos e beneficiados.
    // (Este cenário testa a atualização do status da visita na UI após a "realização".)

    // ATENÇÃO: Ajuste o endpoint `/api/visitas/doador-agendadas/?*` para o URL real.
    cy.intercept('GET', `${BASE_URL}/api/visitas/doador-agendadas/?*`, {
      statusCode: 200,
      body: [
        {
          id: 302,
          data: '2025-06-01T10:00:00Z', // Data passada
          status: 'CONCLUIDA' // Status que indica que a visita foi realizada (AJUSTE TEXTO)
        }
      ]
    }).as('getVisitasRealizadas');

    cy.get('.navegacao-lateral a[data-secao="visitas"]').click();
    cy.url().should('include', '/usuarios/painel-doador/secao/visitas/');


    cy.get('.visitas-agendadas-usuario').should('be.visible');
    cy.get('.visitas-agendadas-usuario h2').should('contain', 'Suas Visitas Agendadas'); // AJUSTE TEXTO

    cy.get('.visitas-agendadas-usuario .lista-minhas-visitas li').should('have.length', 1);
    // ATENÇÃO: Ajuste o formato da data e o texto do status.
    cy.get('.visitas-agendadas-usuario .lista-minhas-visitas li').first()
      .should('contain', '01/06/2025') // AJUSTE FORMATO DATA
      .and('contain', 'Concluída');   // AJUSTE O TEXTO EXATO DO STATUS!
  });

  it('Cenário 4.3: deve notificar o doador sobre o cancelamento da visita e oferecer reagendamento', () => {
    // Dado que um doador tem uma visita programada,
    // Quando ocorre um imprevisto que impede a realização da visita,
    // Então o doador é notificado com antecedência e recebe opções para reagendar.

    // ATENÇÃO: Ajuste o endpoint `/api/visitas/doador-agendadas/?*` para o URL real.
    cy.intercept('GET', `${BASE_URL}/api/visitas/doador-agendadas/?*`, {
      statusCode: 200,
      body: [
        {
          id: 303,
          data: '2025-07-15T11:00:00Z',
          status: 'CANCELADA', // AJUSTE TEXTO
          motivo_cancelamento: 'Evento interno na ONG. Por favor, reagende.'
        }
      ]
    }).as('getVisitasCanceladas');

    cy.get('.navegacao-lateral a[data-secao="visitas"]').click();
    cy.url().should('include', '/usuarios/painel-doador/secao/visitas/');



    cy.get('.visitas-agendadas-usuario').should('be.visible');

    cy.get('.visitas-agendadas-usuario .lista-minhas-visitas li').should('have.length', 1);
    const itemVisitaCancelada = cy.get('.visitas-agendadas-usuario .lista-minhas-visitas li').first();
    // ATENÇÃO: Ajuste o formato da data, texto do status e motivo.
    itemVisitaCancelada.should('contain', '15/07/2025'); // AJUSTE FORMATO DATA
    itemVisitaCancelada.should('contain', 'Cancelada');   // AJUSTE O TEXTO EXATO DO STATUS!
    itemVisitaCancelada.should('contain', 'Evento interno na ONG. Por favor, reagende.'); // AJUSTE TEXTO MOTIVO
    
    // Opcional: Se houver um botão ou link para reagendar, verifique sua presença.
    // itemVisitaCancelada.find('.btn-reagendar').should('be.visible'); // AJUSTE O SELETOR
  });

});