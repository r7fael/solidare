const BASE_URL = 'http://127.0.0.1:8000';

describe('História de Usuário 1: Atualizações de Impacto para Doadores', () => {
  let doadorEmail;
  let doadorPassword;
  let doadorNome;
  const valorDoacao = '100000';

  const formatCPF = (cpf) => {
    cpf = cpf.replace(/\D/g, ''); 
    cpf = cpf.padStart(11, '0').slice(0, 11); 
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  before(() => {
    const testTimestamp = Date.now();
    doadorNome = `Doador Impacto ${testTimestamp}`;
    const cpfNumeros = ('777888999' + String(testTimestamp).slice(-2)).padStart(11, '0');
    doadorEmail = `doador.impacto.${testTimestamp}@example.com`;
    doadorPassword = 'passwordImpacto123';

    cy.visit(`${BASE_URL}/usuarios/registro/`);
    cy.get('input[name="nome"]').type(doadorNome);
    cy.get('input[name="cpf"]').type(formatCPF(cpfNumeros));
    cy.get('input[name="email"]').type(doadorEmail);
    cy.get('input[name="senha"]').type(doadorPassword);
    cy.get('select[name="tipo_usuario"]').select('doador');
    cy.get('.formulario-cadastro button[type="submit"].botao-principal').click();
    cy.url().should('include', '/usuarios/login/');
  });

  beforeEach(() => {
    cy.visit(`${BASE_URL}/usuarios/login/`);
    cy.get('input[name="email"]').type(doadorEmail);
    cy.get('input[name="senha"]').type(doadorPassword);
    cy.get('.formulario-acesso button[type="submit"].botao-acessar').click();
    cy.url().should('eq', `${BASE_URL}/usuarios/painel-doador/`);
    cy.get('#inicio .cartao-boasvindas h1').contains(doadorNome).should('be.visible');

    cy.get('.navegacao-lateral a[data-secao="nova-doacao"]').click();
    cy.get('#nova-doacao.secao-conteudo.ativo').should('be.visible');

    cy.get('input#valor-geral').type(valorDoacao); 
    cy.get('select#metodo-geral option').then($options => {
      if ($options.length > 1 && $options.eq(1).val()) {
        cy.get('select#metodo-geral').select(1);
      }
    });
    cy.get('select#destino-geral option').then($options => {
      if ($options.length > 1 && $options.eq(1).val()) {
        cy.get('select#destino-geral').select(1);
      }
    });
    
    cy.intercept('POST', `**${BASE_URL.replace(/^[a-z]+:\/\/[^/]+/, '')}/doacoes/nova-doacao/`).as('postDoacaoGeral');
    
    cy.get('#nova-doacao form.formulario-geral button[type="submit"].botao-primario').click();
    
    cy.wait('@postDoacaoGeral');
    cy.url().should('eq', `${BASE_URL}/usuarios/painel-doador/`); 
    cy.get('.alerta.alerta-success', { timeout: 6000 }).should('be.visible').and('contain', 'Doação registrada com sucesso!'); 

    cy.visit(`${BASE_URL}/usuarios/painel-doador/`);
    cy.url().should('eq', `${BASE_URL}/usuarios/painel-doador/`); 
    cy.get('#inicio .cartao-boasvindas h1').contains(doadorNome).should('be.visible');
  });

  it('Cenário 1.1: Deve exibir atualizações de impacto na tela inicial do painel do doador', () => {
    cy.get('#inicio.secao-conteudo.ativo').as('secaoInicio');
    
    cy.get('@secaoInicio').find('.cartao-boasvindas h1').should('contain', doadorNome);
    cy.get('@secaoInicio').find('.cartao-boasvindas p').first().should('contain', 'Seu apoio está transformando vidas.');

    cy.get('@secaoInicio').find('.estatisticas-impacto .cartao-estatistica').eq(0).find('p').should('contain', 'Total Doado');

    cy.get('@secaoInicio').find('.estatisticas-impacto .cartao-estatistica').eq(1).find('p').should('contain', 'Pessoas impactadas');
    cy.get('@secaoInicio').find('.estatisticas-impacto .cartao-estatistica').eq(1).find('h3').should('not.be.empty'); 
    
    cy.get('@secaoInicio').find('.estatisticas-impacto .cartao-estatistica').eq(2).find('p').should('contain', 'Doações concluídas');
    
    cy.get('@secaoInicio').find('.ultimas-acoes h3').should('contain', 'Suas últimas doações');
    cy.get('@secaoInicio').find('.lista-doacoes .item-doacao').should('have.length.at.least', 1);
    cy.get('@secaoInicio').find('.lista-doacoes .item-doacao').first().find('.valor').should('contain', (parseFloat(valorDoacao)/100).toLocaleString('pt-BR', {minimumFractionDigits: 2}));
    cy.get('@secaoInicio').find('.lista-doacoes .item-doacao').first().find('.status.status-pendente').should('contain', 'Pendente');
  });

  it('Cenário 1.2: Deve permitir acesso ao histórico de impacto na seção "Minhas Doações"', () => {
    cy.get('.navegacao-lateral a[data-secao="doacoes"]').click();
    cy.url().should('include', '/usuarios/painel-doador/secao/doacoes/');
  });
});