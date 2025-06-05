const BASE_URL = 'http://127.0.0.1:8000';

describe('História de Usuário 6: Geração de Relatórios pelo Gestor', () => {
  let gestorEmail;
  let gestorPassword;
  let gestorNome;

  const formatCPF = (cpf) => {
    cpf = cpf.replace(/\D/g, ''); 
    cpf = cpf.padStart(11, '0').slice(0, 11); 
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  before(() => {
    const testRunTimestamp = Date.now();
    gestorNome = `Gestor Relatorio ${testRunTimestamp}`;
    const gestorCpfNumeros = ('555666777' + String(testRunTimestamp).slice(-2)).padStart(11, '0');
    gestorEmail = `gestor.relatorio.${testRunTimestamp}@example.com`;
    gestorPassword = 'passwordGestorRel';

    cy.visit(`${BASE_URL}/usuarios/registro/`);
    cy.get('input[name="nome"]').type(gestorNome);
    cy.get('input[name="cpf"]').type(formatCPF(gestorCpfNumeros));
    cy.get('input[name="email"]').type(gestorEmail);
    cy.get('input[name="senha"]').type(gestorPassword);
    cy.get('select[name="tipo_usuario"]').select('gestor');
    cy.get('.formulario-cadastro button[type="submit"].botao-principal').click();
    cy.url().should('include', '/usuarios/login/');
    cy.log(`Gestor ${gestorEmail} para HU6 registrado.`);
  });

  beforeEach(() => {
    cy.visit(`${BASE_URL}/usuarios/login/`);
    cy.get('input[name="email"]').type(gestorEmail);
    cy.get('input[name="senha"]').type(gestorPassword);
    cy.get('.formulario-acesso button[type="submit"].botao-acessar').click();
    cy.url().should('include', '/usuarios/painel-gestor/');
    cy.get('#inicio .cartao-boasvindas h1').contains(gestorNome).should('be.visible');
  });

  it('Cenário 6.1: Gestor deve conseguir acessar a seção de relatórios e visualizar opções de geração', () => {
    cy.get('.navegacao-lateral a[data-secao="relatorios"]').click();
    cy.url().should('include', '/usuarios/painel-gestor/secao/relatorios/');
    cy.get('#relatorios.secao-conteudo.ativo').should('be.visible');

    cy.get('#relatorios .cabecalho-secao h1').should('contain', 'Relatórios');
    
    cy.get('.lista-relatorios .cartao-item').should('be.visible');
    cy.get('.lista-relatorios .cartao-item h3').should('contain', 'Relatório de Impacto das Doações');
    cy.get('.lista-relatorios .cartao-item p').should('contain', 'Gere um arquivo PDF com o resumo completo do impacto das doações concluídas');
    cy.get('.lista-relatorios .cartao-item a.botao-sucesso')
      .should('be.visible')
      .and('contain', 'Gerar Relatório em PDF');
  });

  it('Cenário 6.2: Gestor deve conseguir iniciar a geração do Relatório de Impacto em PDF', () => {
    cy.get('.navegacao-lateral a[data-secao="relatorios"]').click();
    cy.get('#relatorios.secao-conteudo.ativo').should('be.visible');

    cy.intercept('GET', `${BASE_URL}/relatorios/impacto-doacoes/exportar-pdf/`).as('getRelatorioPDF');

    cy.get('.lista-relatorios .cartao-item a.botao-sucesso')
      .contains('Gerar Relatório em PDF')
      .invoke('removeAttr', 'target') 
      .click();

    cy.wait('@getRelatorioPDF').its('response.statusCode').should('eq', 200);

    cy.visit(`${BASE_URL}/usuarios/painel-gestor/secao/relatorios/`);
    cy.get('#relatorios.secao-conteudo.ativo').should('be.visible');

  });
});