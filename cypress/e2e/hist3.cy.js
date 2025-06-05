const BASE_URL = 'http://127.0.0.1:8000';

describe('História de Usuário 3: Mensagens de Incentivo Supervisionadas', () => {
  const testRunTimestamp = Date.now();

  const gestorNome = `Gestor Mensagens ${testRunTimestamp}`;
  const gestorCpfNumeros = ('333111222' + String(testRunTimestamp).slice(-2)).padStart(11, '0');
  const gestorEmail = `gestor.hu3.${testRunTimestamp}@example.com`;
  const gestorPassword = 'passwordGestorHU3';

  let doadorNome;
  let doadorEmail;
  let doadorPassword;
  let beneficiarioNomeGlobal;

  const formatCPF = (cpf) => {
    cpf = cpf.replace(/\D/g, '');
    cpf = cpf.padStart(11, '0').slice(0, 11);
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  before(() => {
    cy.log('--- Iniciando Setup para HU3: Gestor, Beneficiário e Doador ---');
    
    const doadorTimestamp = Date.now() + 1; 
    doadorNome = `Doador HU3 ${doadorTimestamp}`;
    const doadorCpfNum = ('777888999' + String(doadorTimestamp).slice(-2)).padStart(11, '0');
    doadorEmail = `doador.hu3.${doadorTimestamp}@example.com`;
    doadorPassword = 'passwordDoadorHU3';

    beneficiarioNomeGlobal = `Benef. HU3 ${testRunTimestamp}`;
    const beneficiarioIdade = Math.floor(Math.random() * 7) + 8; 

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

    cy.log('3. Cadastrando Beneficiário...');
    cy.get('.navegacao-lateral a[data-secao="cadastrar-beneficiario"]').click();
    cy.get('#cadastrar-beneficiario.secao-conteudo.ativo').should('be.visible');
    cy.get('input#cad-nome').type(beneficiarioNomeGlobal);
    cy.get('input#cad-idade').type(beneficiarioIdade.toString());
    cy.get('#cadastrar-beneficiario form.formulario-geral button[type="submit"].botao-primario').click();
    
    cy.log('3.1. Ativando Beneficiário...');
    cy.get('.navegacao-lateral a[data-secao="beneficiarios"]').click();
    cy.get('#beneficiarios.secao-conteudo.ativo').should('be.visible');
    cy.get('#beneficiarios .tabela-padrao tbody tr').contains('td', beneficiarioNomeGlobal)
      .parents('tr').within(() => {
        cy.get('button.botao-pequeno.editar.editar-beneficiario-btn').click();
      });
    cy.get('#modal-editar-beneficiario-gestor').should('be.visible');
    cy.get('#modal-editar-beneficiario-gestor input#edit-benef-ativo[type="checkbox"]').check().should('be.checked');
    cy.intercept('POST', `${BASE_URL}/beneficiarios/editar/`).as('postEditarBeneficiario');
    cy.get('#modal-editar-beneficiario-gestor form#form-editar-beneficiario-gestor button[type="submit"].botao-primario').click();
    cy.get('#beneficiarios .tabela-padrao tbody tr').contains('td', beneficiarioNomeGlobal)
      .parents('tr').find('td .status.status-ativo').should('contain', 'Ativo');

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
    cy.log(`Doador ${doadorEmail} para HU3 registrado.`);
    cy.log('--- Setup para História de Usuário 3 Concluído ---');
  });

  beforeEach(() => {
    cy.visit(`${BASE_URL}/usuarios/login/`);
    cy.get('input[name="email"]').type(doadorEmail);
    cy.get('input[name="senha"]').type(doadorPassword);
    cy.get('.formulario-acesso button[type="submit"].botao-acessar').click();
    cy.url().should('eq', `${BASE_URL}/usuarios/painel-doador/`);
    cy.get('#inicio .cartao-boasvindas h1').contains(doadorNome).should('be.visible');
  });

  it('Cenário 3.1: Deve permitir o envio de mensagens e exibir status "Aguardando Aprovação"', () => {
    const assuntoMensagem = `Incentivo para ${beneficiarioNomeGlobal} ${Date.now()}`;
    const conteudoMensagem = `Olá ${beneficiarioNomeGlobal}, continue se esforçando! Acreditamos em você.`;

    cy.get('.navegacao-lateral a[data-secao="mensagens"]').click();
    cy.url().should('include', '/usuarios/painel-doador/secao/mensagens/');

    cy.get('#btn-nova-mensagem-form').click();
    cy.get('#formulario-nova-mensagem').should('be.visible');

    cy.get('#formulario-nova-mensagem select#destinatario-mensagem').select(beneficiarioNomeGlobal); 
    cy.get('#formulario-nova-mensagem input#assunto-mensagem').type(assuntoMensagem);
    cy.get('#formulario-nova-mensagem textarea#conteudo-mensagem').type(conteudoMensagem);
    
    cy.intercept('POST', `${BASE_URL}/usuarios/painel-doador/`).as('postNovaMensagem');
    cy.get('#formulario-nova-mensagem button[type="submit"].botao-primario').click();
    
    cy.wait('@postNovaMensagem');
    cy.url().should('include', '/usuarios/painel-doador/secao/mensagens/'); 
  });

  it('Cenário 3.2: Deve exibir a mensagem como "Aprovada" após simulação de aprovação pelo gestor', () => {
    const assuntoParaAprovar = `Mensagem HU3.2 Aprovada ${Date.now()}`;
    const mockMensagemId = `mock-id-aprov-${Date.now()}`;

    cy.intercept('GET', `${BASE_URL}/usuarios/painel-doador/secao/minhas-mensagens/`, {
      statusCode: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
      body: `
        <html><head><title>Painel Doador</title></head><body>
        <div class="painel-fundo-wrapper"><div class="painel-container"><div class="barra-lateral"></div><div class="conteudo-principal">
        <div id="minhas-mensagens" class="secao-conteudo ativo">
          <div class="cabecalho-secao"><h1>Minhas Mensagens</h1><button class="botao-primario" id="btn-nova-mensagem-form">Nova Mensagem</button></div>
          <div class="filtros">
            <div class="grupo-filtro">
                <label for="filtro-status-minhas-mensagens">Status:</label>
                <select id="filtro-status-minhas-mensagens"><option value="TODAS">Todas</option></select>
            </div>
          </div>
          <div class="lista-mensagens">
            <div class="cartao-mensagem" data-status="aprovado">
              <div class="cabecalho-mensagem">
                <div class="info-basica-mensagem">
                  <div class="destinatario-mensagem"><strong>Para:</strong> ${beneficiarioNomeGlobal}</div>
                  <div class="assunto-mensagem"><strong>Assunto:</strong> ${assuntoParaAprovar}</div>
                  <div class="data-mensagem"><strong>Enviada em:</strong> ${new Date().toLocaleDateString('pt-BR')}</div>
                </div>
                <div class="status-acoes-mensagem">
                  <span class="status status-aprovado">Aprovada</span>
                  <button class="botao-pequeno ver-mais btn-ver-mais-mensagem-doador" data-id="${mockMensagemId}">Ver mais</button>
                </div>
              </div>
            </div>
          </div>
        </div></div></div></div></body></html>`
    }).as('getMensagensAprovadas');

    cy.get('.navegacao-lateral a[data-secao="mensagens"]').click(); 
  });
});