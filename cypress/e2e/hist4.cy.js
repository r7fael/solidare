const BASE_URL = 'http://127.0.0.1:8000';

describe('História de Usuário 4: Agendamento de Visitas à ONG', () => {
  const testRunTimestamp = Date.now();

  const gestorNome = `Gestor Visita ${testRunTimestamp}`;
  const gestorCpfNumeros = ('777888999' + String(testRunTimestamp).slice(-2)).padStart(11, '0');
  const gestorEmail = `gestor.visita.${testRunTimestamp}@example.com`;
  const gestorPassword = 'passwordGestorVisita';

  let doadorEmail;
  let doadorPassword;
  let doadorNome;
  
  const hoje = new Date();
  const dataVisita = new Date(hoje.setDate(hoje.getDate() + 15)); // Visita daqui a 15 dias
  const dataVisitaFormatadaInput = dataVisita.toISOString().split('T')[0]; // YYYY-MM-DD
  const dataVisitaFormatadaDisplay = `${String(dataVisita.getDate()).padStart(2, '0')}/${String(dataVisita.getMonth() + 1).padStart(2, '0')}/${dataVisita.getFullYear()}`; // DD/MM/YYYY
  const capacidadeVisita = '10';

  const formatCPF = (cpf) => {
    cpf = cpf.replace(/\D/g, ''); 
    cpf = cpf.padStart(11, '0').slice(0, 11); 
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  before(() => {
    cy.log('--- Iniciando Setup para HU4: Gestor cria data de visitação ---');
    
    const doadorTimestamp = Date.now() + 1;
    doadorNome = `Doador Visitante ${doadorTimestamp}`;
    const doadorCpfNum = ('123456789' + String(doadorTimestamp).slice(-2)).padStart(11, '0');
    doadorEmail = `doador.visitante.${doadorTimestamp}@example.com`;
    doadorPassword = 'passwordDoadorVisita';

    cy.log('1. Registrando Gestor...');
    cy.visit(`${BASE_URL}/usuarios/registro/`);
    cy.get('input[name="nome"]').type(gestorNome);
    cy.get('input[name="cpf"]').type(formatCPF(gestorCpfNumeros));
    cy.get('input[name="email"]').type(gestorEmail);
    cy.get('input[name="senha"]').type(gestorPassword);
    cy.get('select[name="tipo_usuario"]').select('gestor');
    cy.get('.formulario-cadastro button[type="submit"].botao-principal').click();
    cy.url().should('include', '/usuarios/login/');

    cy.log('2. Login como Gestor...');
    cy.get('input[name="email"]').type(gestorEmail);
    cy.get('input[name="senha"]').type(gestorPassword);
    cy.get('.formulario-acesso button[type="submit"].botao-acessar').click();
    cy.url().should('include', '/usuarios/painel-gestor/');
    cy.get('#inicio .cartao-boasvindas h1').contains(gestorNome).should('be.visible');

    cy.log('3. Gestor criando nova data de visitação...');
    cy.get('.navegacao-lateral a[data-secao="visitacao"]').click();
    cy.get('#visitacao.secao-conteudo.ativo').should('be.visible');
    cy.get('#btn-abrir-modal-nova-visitacao').click();
    cy.get('#modal-visitacao-gestor').should('be.visible');
    cy.get('#gestor-data-visita').type(dataVisitaFormatadaInput);
    cy.get('#gestor-capacidade-visita').type(capacidadeVisita);
    cy.intercept('POST', `${BASE_URL}/visitacao/nova/`).as('postNovaVisita'); 
    cy.get('#form-visitacao-gestor button[type="submit"].botao-primario').click();
    cy.wait('@postNovaVisita');
    cy.get('#visitacao .tabela-padrao tbody tr').should('have.length.at.least', 1);
    cy.get('#visitacao .tabela-padrao tbody tr').first().find('td').eq(0).should('contain', dataVisitaFormatadaDisplay);

    cy.log('4. Logout do Gestor...');
    cy.get('.navegacao-lateral a[href*="logout"]').click();
    cy.url().should('include', '/usuarios/login/');
    
    cy.log('5. Registrando Doador...');
    cy.visit(`${BASE_URL}/usuarios/registro/`);
    cy.get('input[name="nome"]').type(doadorNome);
    cy.get('input[name="cpf"]').type(formatCPF(doadorCpfNum));
    cy.get('input[name="email"]').type(doadorEmail);
    cy.get('input[name="senha"]').type(doadorPassword);
    cy.get('select[name="tipo_usuario"]').select('doador');
    cy.get('.formulario-cadastro button[type="submit"].botao-principal').click();
    cy.url().should('include', '/usuarios/login/');
    cy.log(`Doador ${doadorEmail} para HU4 registrado.`);
    cy.log('--- Setup para História de Usuário 4 Concluído ---');
  });

  beforeEach(() => {
    cy.visit(`${BASE_URL}/usuarios/login/`);
    cy.get('input[name="email"]').type(doadorEmail);
    cy.get('input[name="senha"]').type(doadorPassword);
    cy.get('.formulario-acesso button[type="submit"].botao-acessar').click();
    cy.url().should('eq', `${BASE_URL}/usuarios/painel-doador/`);
    cy.get('#inicio .cartao-boasvindas h1').contains(doadorNome).should('be.visible');
  });

  it('Cenário 4.1: Deve permitir ao doador clicar em agendar uma visita e confirmar no modal', () => {
    cy.get('.navegacao-lateral a[data-secao="visitas"]').click();
    cy.url().should('include', '/usuarios/painel-doador/secao/visitas/');
    cy.get('#visitas.secao-conteudo.ativo').should('be.visible');
    cy.log('Navegou para a seção de visitas.');

    cy.contains('.visitas-disponiveis .cartao-visita .cabecalho-visita h3', dataVisitaFormatadaDisplay, { timeout: 10000 })
      .should('be.visible')
      .parents('.cartao-visita') 
      .find('button.botao-primario.btn-abrir-modal-agendar-visita')
      .click();
    cy.log(`Clicou em "Agendar" para a visita de ${dataVisitaFormatadaDisplay}.`);

    cy.get('#modal-confirmar-visita').should('be.visible');
    cy.get('#modal-confirmar-visita-data').should('contain', dataVisitaFormatadaDisplay);
    cy.log('Modal de confirmação de visita aberto.');

    cy.intercept('POST', `${BASE_URL}/usuarios/painel-doador/`).as('postAgendarVisita');
    
    cy.get('#form-agendar-visita button[type="submit"].botao-primario').contains('Confirmar Agendamento').click();
    cy.log('Clicou em "Confirmar Agendamento" no modal.');
    
    cy.wait('@postAgendarVisita');
    cy.log('Agendamento de visita confirmado com sucesso.');
  });
});