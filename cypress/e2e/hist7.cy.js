const BASE_URL = 'http://127.0.0.1:8000';

describe('História de Usuário 7: Doador Interage com Campanhas Específicas', () => {
  const testRunTimestamp = Date.now();

  const gestorNome = `Gestor Campanha ${testRunTimestamp}`;
  const gestorCpfNumeros = ('555444333' + String(testRunTimestamp).slice(-2)).padStart(11, '0');
  const gestorEmail = `gestor.campanha.${testRunTimestamp}@example.com`;
  const gestorPassword = 'passwordGestorCamp';

  let doadorEmail;
  let doadorPassword;
  let doadorNome;
  
  let campanhaNomeGlobal; // Para usar nos cenários
  const valorDoacaoCampanha = '6500'; // R$ 65,00

  const formatCPF = (cpf) => {
    cpf = cpf.replace(/\D/g, ''); 
    cpf = cpf.padStart(11, '0').slice(0, 11); 
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  before(() => {
    cy.log('--- Iniciando Setup para HU7: Gestor cria campanha, Doador é registrado ---');
    
    const doadorTimestamp = Date.now() + 1; 
    doadorNome = `Doador Campanha ${doadorTimestamp}`;
    const doadorCpfNum = ('333222111' + String(doadorTimestamp).slice(-2)).padStart(11, '0');
    doadorEmail = `doador.campanha.${doadorTimestamp}@example.com`;
    doadorPassword = 'passwordDoadorCamp';

    campanhaNomeGlobal = `Campanha para Doar ${testRunTimestamp}`;
    const campanhaDescricao = `Descrição da campanha HU7 criada em ${new Date().toLocaleDateString()}.`;
    const campanhaMeta = '30000'; // R$ 300,00
    const hoje = new Date();
    const dataFimCampanha = new Date(hoje.setDate(hoje.getDate() + 45)).toISOString().split('T')[0];

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

    cy.log('3. Criando Campanha pelo Gestor...');
    cy.get('.navegacao-lateral a[data-secao="campanhas-gestor"]').click();
    cy.get('#campanhas-gestor.secao-conteudo.ativo').should('be.visible');
    cy.get('#abrir-modal-criar-campanha').click(); 
    cy.get('#modal-criar-campanha').should('be.visible');
    cy.get('#criar-campanha-nome').type(campanhaNomeGlobal);
    cy.get('#criar-campanha-descricao').type(campanhaDescricao);
    cy.get('#criar-campanha-meta').type(campanhaMeta); 
    cy.get('#criar-campanha-data_fim').type(dataFimCampanha);
    cy.intercept('POST', `${BASE_URL}/campanhas/gestao/nova/`).as('postNovaCampanha');
    cy.get('#form-criar-campanha button[type="submit"]').click();
    cy.wait('@postNovaCampanha');
    cy.log(`Campanha "${campanhaNomeGlobal}" criada.`);

    cy.log('4. Logout do Gestor...');
    cy.get('.navegacao-lateral a[href*="logout"]').click();
    cy.url().should('include', '/usuarios/login/');

    cy.log('5. Registrando Doador para o teste...');
    cy.visit(`${BASE_URL}/usuarios/registro/`);
    cy.get('input[name="nome"]').type(doadorNome);
    cy.get('input[name="cpf"]').type(formatCPF(doadorCpfNum));
    cy.get('input[name="email"]').type(doadorEmail);
    cy.get('input[name="senha"]').type(doadorPassword);
    cy.get('select[name="tipo_usuario"]').select('doador');
    cy.get('.formulario-cadastro button[type="submit"].botao-principal').click();
    cy.url().should('include', '/usuarios/login/');
    cy.log(`Doador ${doadorEmail} para HU7 registrado.`);
    cy.log('--- Setup para História de Usuário 7 Concluído ---');
  });

  beforeEach(() => {
    cy.visit(`${BASE_URL}/usuarios/login/`);
    cy.get('input[name="email"]').type(doadorEmail);
    cy.get('input[name="senha"]').type(doadorPassword);
    cy.get('.formulario-acesso button[type="submit"].botao-acessar').click();
    cy.url().should('eq', `${BASE_URL}/usuarios/painel-doador/`);
    cy.get('#inicio .cartao-boasvindas h1').contains(doadorNome).should('be.visible');
  });

  it('Cenário 7.1: Deve visualizar lista de campanhas ativas com detalhes', () => {
    cy.get('.navegacao-lateral a[data-secao="campanhas-doador"]').click();
    cy.url().should('include', '/usuarios/painel-doador/secao/campanhas-doador/');
    cy.get('#campanhas-doador.secao-conteudo.ativo').should('be.visible');

    cy.get('#campanhas-doador .cabecalho-secao h1').should('contain', 'Campanhas Ativas');
  });

  it('Cenário 7.2: Deve permitir ao doador contribuir para uma campanha específica', () => {
    cy.get('.navegacao-lateral a[data-secao="campanhas-doador"]').click();
    cy.get('#campanhas-doador.secao-conteudo.ativo').should('be.visible');

    cy.contains('.cartao-campanha-doador .card-title', campanhaNomeGlobal, { timeout: 10000 })
      .scrollIntoView()
      .should('be.visible')
      .parents('.cartao-campanha-doador')
      .find('button.abrir-modal-doar-campanha')
      .click();
    
    cy.get('#modal-doar-campanha-painel').should('be.visible');
    cy.get('#modal-doar-campanha-titulo').should('contain', campanhaNomeGlobal);
    cy.get('#doar-campanha-valor-modal').type(valorDoacaoCampanha);
    cy.get('#doar-campanha-metodo-modal').select(1); 

    cy.intercept('POST', `${BASE_URL}/campanhas/`).as('postDoarParaCampanha');
    cy.get('#form-doar-campanha-painel button[type="submit"].botao-primario').click();
    
    cy.wait('@postDoarParaCampanha');
    
    cy.get('#modal-doar-campanha-painel').should('not.be.visible');

    cy.get('.navegacao-lateral a[data-secao="doacoes"]').click();
    cy.url().should('include', '/usuarios/painel-doador/secao/doacoes/');
    cy.get('#doacoes.secao-conteudo.ativo').should('be.visible');
    cy.get('#doacoes .tabela-padrao tbody tr').first().within(() => {
      cy.get('td').eq(1).should('contain', (parseFloat(valorDoacaoCampanha)/100).toLocaleString('pt-BR', {minimumFractionDigits: 2}));
      cy.get('td').eq(3).should('contain', campanhaNomeGlobal);
      cy.get('td').eq(4).find('.status.status-pendente').should('contain', 'Pendente');
    });
  });
});