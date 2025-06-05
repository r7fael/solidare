const BASE_URL = 'http://127.0.0.1:8000';

describe('História de Usuário 1: Atualizações de Impacto para Doadores', () => {
  let createdUserEmail; 
  let createdUserPassword;

  const formatCPF = (cpf) => {
    cpf = cpf.replace(/\D/g, ''); 
    cpf = cpf.padStart(11, '0').slice(0, 11); 
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  before(() => {
    cy.visit(`${BASE_URL}/usuarios/registro/`);
    const timestamp = Date.now();
    const nomeCompleto = `Doador Impacto ${timestamp}`;
    
    const randomPart = Math.random().toString().slice(2, 9); 
    const timestampPart = String(timestamp).slice(-4); 
    let cpfNumeros = (randomPart + timestampPart).slice(0, 11); 
    if (cpfNumeros.length < 11) {
        cpfNumeros = cpfNumeros.padEnd(11, '0');
    }
    const cpfFormatado = formatCPF(cpfNumeros); 

    createdUserEmail = `doador.impacto.${timestamp}@example.com`; 
    createdUserPassword = 'password123';

    cy.get('input[name="nome"]').type(nomeCompleto);
    cy.get('input[name="cpf"]').type(cpfFormatado); 
    cy.get('input[name="email"]').type(createdUserEmail);
    cy.get('input[name="senha"]').type(createdUserPassword);
    cy.get('select[name="tipo_usuario"]').select('doador');
    cy.get('button[type="submit"].botao-principal').click();
    
    cy.url().should('include', '/usuarios/login/'); 
  });

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    
    cy.visit(`${BASE_URL}/usuarios/login/`);
    cy.get('input[name="email"]').type(createdUserEmail);
    cy.get('input[name="senha"]').type(createdUserPassword);
    cy.get('button[type="submit"].botao-acessar').click();
    cy.url().should('eq', `${BASE_URL}/usuarios/painel-doador/`);
    cy.get('.cartao-boasvindas h1').contains('Bem-vindo,').should('be.visible');

    cy.get('.navegacao-lateral a[data-secao="nova-doacao"]').click();
    cy.url().should('include', '/usuarios/painel-doador/secao/nova-doacao/'); 
    cy.get('#nova-doacao.secao-conteudo.ativo').should('be.visible');

    cy.get('#valor-geral').type('100000'); 
    cy.get('#metodo-geral option').then($options => {
      if ($options.length > 1) cy.get('#metodo-geral').select(1);
    });
    cy.get('#destino-geral option').then($options => {
      if ($options.length > 1) cy.get('#destino-geral').select(1);
    });
    
    cy.intercept('POST', '**/doacoes/nova-doacao/').as('postNovaDoacao');
    cy.get('#nova-doacao form.formulario-geral button[type="submit"].botao-primario').click();
    
    cy.wait('@postNovaDoacao');
    cy.url().should('include', '/doacoes/minhas-doacoes/'); 

    cy.get('.tabela-doacoes tbody tr').first().as('doacaoRecente');
    cy.get('@doacaoRecente').find('td').eq(0).should('contain', '1.000,00');
    cy.get('@doacaoRecente').find('td.status-pendente').should('contain', 'Pendente');
    
    cy.intercept('GET', '**/doacoes/aceitar/*').as('getAceitarDoacao');
    cy.get('@doacaoRecente').find('a.botao-acao').contains('Aceitar').click();
    
    cy.wait('@getAceitarDoacao');
    cy.url().should('include', '/doacoes/minhas-doacoes/'); 
    
    cy.get('.alerta.alerta-success', { timeout: 6000 }).should('be.visible').and('contain', 'Doação aceita com sucesso'); 

    cy.get('.tabela-doacoes tbody tr').first().as('doacaoAceita');
    cy.get('@doacaoAceita').find('td').eq(0).should('contain', '1.000,00');
    cy.get('@doacaoAceita').find('td.status-concluido').should('contain', 'Concluída');
    cy.get('@doacaoAceita').find('a.botao-acao').contains('Aceitar').should('not.exist');

    cy.visit(`${BASE_URL}/usuarios/painel-doador/`);
    cy.url().should('eq', `${BASE_URL}/usuarios/painel-doador/`);
    cy.get('.cartao-boasvindas h1').contains('Bem-vindo,').should('be.visible');
  });

  it('Cenário 1.1: deve exibir as atualizações de impacto na tela inicial do painel do doador após uma doação aceita', () => {
    cy.get('.navegacao-lateral a[data-secao="inicio"]').click();
    cy.get('#inicio.secao-conteudo.ativo').should('be.visible').as('secaoInicio');
    
    cy.get('@secaoInicio').find('.cartao-boasvindas h1').should('be.visible');
    cy.get('@secaoInicio').find('.cartao-boasvindas p').first().should('contain', 'Seu apoio está transformando vidas.');

    cy.get('@secaoInicio').find('.estatisticas-impacto .cartao-estatistica').eq(0).find('h3').should('contain', '1.000,00');
    cy.get('@secaoInicio').find('.estatisticas-impacto .cartao-estatistica').eq(0).find('p').should('contain', 'Total Doado');

    cy.get('@secaoInicio').find('.estatisticas-impacto .cartao-estatistica').eq(1).find('h3').should('not.be.empty');
    cy.get('@secaoInicio').find('.estatisticas-impacto .cartao-estatistica').eq(1).find('p').should('contain', 'Pessoas impactadas');
    
    cy.get('@secaoInicio').find('.estatisticas-impacto .cartao-estatistica').eq(2).find('h3').should('contain', '1');
    cy.get('@secaoInicio').find('.estatisticas-impacto .cartao-estatistica').eq(2).find('p').should('contain', 'Doações concluídas');

    cy.get('@secaoInicio').find('.ultimas-acoes h3').should('contain', 'Suas últimas doações');
    cy.get('@secaoInicio').find('.lista-doacoes .item-doacao').should('have.length.at.least', 1);
    cy.get('@secaoInicio').find('.lista-doacoes .item-doacao').first().find('.valor').should('contain', '1.000,00');
    cy.get('@secaoInicio').find('.lista-doacoes .item-doacao').first().find('.status.status-concluido').should('contain', 'Concluída');
  });

  it('Cenário 1.2: deve permitir o acesso ao histórico de impacto na seção "Minhas Doações" e mostrar a doação aceita', () => {
    cy.get('.navegacao-lateral a[data-secao="doacoes"]').click();
    cy.url().should('include', '/usuarios/painel-doador/secao/doacoes/');

    cy.get('#doacoes.secao-conteudo.ativo').should('be.visible').as('secaoMinhasDoacoes');
    
    cy.get('@secaoMinhasDoacoes').find('.cabecalho-secao h1').should('contain', 'Minhas Doações');

    cy.get('@secaoMinhasDoacoes').find('.tabela-doacoes thead th').should('have.length', 5);
    cy.get('@secaoMinhasDoacoes').find('.tabela-doacoes thead th').eq(0).should('contain', 'Valor');
    cy.get('@secaoMinhasDoacoes').find('.tabela-doacoes thead th').eq(1).should('contain', 'Método');
    cy.get('@secaoMinhasDoacoes').find('.tabela-doacoes thead th').eq(2).should('contain', 'Destino');
    cy.get('@secaoMinhasDoacoes').find('.tabela-doacoes thead th').eq(3).should('contain', 'Status');
    cy.get('@secaoMinhasDoacoes').find('.tabela-doacoes thead th').eq(4).should('contain', 'Ações');
    
    cy.get('@secaoMinhasDoacoes').find('.tabela-doacoes tbody tr').should('have.length.at.least', 1);
    const primeiraLinhaDoacao = cy.get('@secaoMinhasDoacoes').find('.tabela-doacoes tbody tr').first();
    
    primeiraLinhaDoacao.find('td').eq(0).should('contain', '1.000,00'); 
    primeiraLinhaDoacao.find('td').eq(3).find('.status.status-concluido').should('contain', 'Concluída');
    primeiraLinhaDoacao.find('td').eq(4).find('a.botao-acao').contains('Aceitar').should('not.exist');
  });
});