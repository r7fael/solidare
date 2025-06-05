const BASE_URL = 'http://127.0.0.1:8000';

describe('Configuração Base do Ambiente de Teste SOLIDARE', () => {
  const timestamp = Date.now();
  
  const gestorNome = `Gestor Base ${timestamp}`;
  const gestorCpfNumeros = ('111222333' + String(timestamp).slice(-2)).padStart(11, '0');
  const gestorEmail = `gestor.base.${timestamp}@example.com`;
  const gestorPassword = 'passwordGestor123';

  const doadorNome = `Doador Base ${timestamp}`;
  const doadorCpfNumeros = ('444555666' + String(timestamp).slice(-2)).padStart(11, '0');
  const doadorEmail = `doador.base.${timestamp}@example.com`;
  const doadorPassword = 'passwordDoador123';

  const beneficiarioNome = `Beneficiario Teste ${timestamp}`;
  const beneficiarioIdade = Math.floor(Math.random() * 10) + 6;

  const campanhaNome = `Campanha Solidária Teste ${timestamp}`;
  const campanhaDescricao = `Descrição da campanha de teste criada em ${new Date().toLocaleDateString()}.`;
  const campanhaMeta = '250000'; 
  const hoje = new Date();
  const dataFimCampanha = new Date(hoje.setDate(hoje.getDate() + 30)).toISOString().split('T')[0];

  const valorDoacaoGeral = '15000'; 

  const formatCPF = (cpf) => {
    cpf = cpf.replace(/\D/g, ''); 
    cpf = cpf.padStart(11, '0').slice(0, 11); 
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  it('deve configurar gestor, doador, beneficiário, campanha, realizar doação geral e aprovar', () => {
    cy.log('--- Iniciando Setup Base ---');

    cy.log('1. Registrando Gestor...');
    cy.visit(`${BASE_URL}/usuarios/registro/`);
    cy.get('input[name="nome"]').type(gestorNome);
    cy.get('input[name="cpf"]').type(formatCPF(gestorCpfNumeros));
    cy.get('input[name="email"]').type(gestorEmail);
    cy.get('input[name="senha"]').type(gestorPassword);
    cy.get('select[name="tipo_usuario"]').select('gestor');
    cy.get('.formulario-cadastro button[type="submit"].botao-principal').click();
    cy.url().should('include', '/usuarios/login/');
    cy.log(`Gestor ${gestorEmail} registrado.`);

    cy.log('2. Login como Gestor...');
    cy.get('input[name="email"]').type(gestorEmail);
    cy.get('input[name="senha"]').type(gestorPassword);
    cy.get('.formulario-acesso button[type="submit"].botao-acessar').click();
    cy.url().should('include', '/usuarios/painel-gestor/');
    cy.get('#inicio .cartao-boasvindas h1').contains(gestorNome).should('be.visible');
    cy.log('Login como Gestor realizado.');

    cy.log('3. Cadastrando Beneficiário...');
    cy.get('.navegacao-lateral a[data-secao="cadastrar-beneficiario"]').click();
    cy.get('#cadastrar-beneficiario.secao-conteudo.ativo').should('be.visible');
    cy.get('input#cad-nome').type(beneficiarioNome);
    cy.get('input#cad-idade').type(beneficiarioIdade.toString());
    cy.intercept('POST', `**${BASE_URL.replace(/^[a-z]+:\/\/[^/]+/, '')}/cadastrar-beneficiario/`).as('postCadastrarBeneficiario');
    cy.get('#cadastrar-beneficiario form.formulario-geral button[type="submit"].botao-primario').click();
    cy.wait('@postCadastrarBeneficiario');
    cy.log(`Beneficiário ${beneficiarioNome} cadastrado.`);

    cy.log('3.1. Ativando Beneficiário...');
    cy.get('.navegacao-lateral a[data-secao="beneficiarios"]').click();
    cy.get('#beneficiarios.secao-conteudo.ativo').should('be.visible');
    cy.get('#beneficiarios .tabela-padrao tbody tr').contains('td', beneficiarioNome)
      .parents('tr').within(() => {
        cy.get('button.botao-pequeno.editar.editar-beneficiario-btn').click();
      });
    cy.get('#modal-editar-beneficiario-gestor').should('be.visible');
    cy.get('#modal-editar-beneficiario-gestor input#edit-benef-ativo[type="checkbox"]').check().should('be.checked');
    cy.intercept('POST', `**${BASE_URL.replace(/^[a-z]+:\/\/[^/]+/, '')}/beneficiarios/editar/`).as('postEditarBeneficiario');
    cy.get('#modal-editar-beneficiario-gestor form#form-editar-beneficiario-gestor button[type="submit"].botao-primario').contains('Salvar Alterações').click();
    cy.wait('@postEditarBeneficiario');
    cy.get('#beneficiarios .tabela-padrao tbody tr').contains('td', beneficiarioNome)
      .parents('tr').find('td .status.status-ativo').should('contain', 'Ativo');
    cy.log(`Beneficiário ${beneficiarioNome} ativado.`);

    cy.log('4. Criando Campanha...');
    cy.get('.navegacao-lateral a[data-secao="campanhas-gestor"]').click();
    cy.get('#campanhas-gestor.secao-conteudo.ativo').should('be.visible');
    cy.get('#abrir-modal-criar-campanha').click(); 
    cy.get('#modal-criar-campanha').should('be.visible');
    cy.get('#criar-campanha-nome').type(campanhaNome);
    cy.get('#criar-campanha-descricao').type(campanhaDescricao);
    cy.get('#criar-campanha-meta').type(campanhaMeta); 
    cy.get('#criar-campanha-data_fim').type(dataFimCampanha);
    cy.intercept('POST', `**${BASE_URL.replace(/^[a-z]+:\/\/[^/]+/, '')}/campanhas/gestao/nova/`).as('postNovaCampanha');
    cy.get('#form-criar-campanha button[type="submit"]').click();
    cy.wait('@postNovaCampanha');
    cy.log(`Campanha "${campanhaNome}" criada.`);

    cy.log('5. Logout do Gestor...');
    cy.get('.navegacao-lateral a[href*="logout"]').click();
    cy.url().should('include', '/usuarios/login/');
    cy.log('Logout do Gestor realizado.');

    cy.log('6. Registrando Doador...');
    cy.visit(`${BASE_URL}/usuarios/registro/`);
    cy.get('input[name="nome"]').type(doadorNome);
    cy.get('input[name="cpf"]').type(formatCPF(doadorCpfNumeros));
    cy.get('input[name="email"]').type(doadorEmail);
    cy.get('input[name="senha"]').type(doadorPassword);
    cy.get('select[name="tipo_usuario"]').select('doador');
    cy.get('button[type="submit"].botao-principal').click();
    cy.url().should('include', '/usuarios/login/');
    cy.log(`Doador ${doadorEmail} registrado.`);

    cy.log('7. Login como Doador...');
    cy.get('input[name="email"]').type(doadorEmail);
    cy.get('input[name="senha"]').type(doadorPassword);
    cy.get('button[type="submit"].botao-acessar').click();
    cy.url().should('eq', `${BASE_URL}/usuarios/painel-doador/`);
    cy.get('.cartao-boasvindas h1').contains(doadorNome).should('be.visible');
    cy.log('Login como Doador realizado.');

    cy.log('8. Realizando Doação Geral...');
    cy.get('.navegacao-lateral a[data-secao="nova-doacao"]').click();
    cy.get('#nova-doacao.secao-conteudo.ativo').should('be.visible');
    cy.get('#valor-geral').type(valorDoacaoGeral);
    cy.get('#metodo-geral option').then($options => {
      if ($options.length > 1 && $options.eq(1).val()) {
        cy.get('#metodo-geral').select($options.eq(1).val());
      } else {
        cy.log('AVISO: Nenhuma opção válida de método de pagamento encontrada para doação geral.');
      }
    });
    cy.get('#destino-geral option').then($options => {
      if ($options.length > 1 && $options.eq(1).val()) {
        cy.get('#destino-geral').select($options.eq(1).val());
      } else {
        cy.log('AVISO: Nenhuma opção válida de destino encontrada para doação geral.');
      }
    });
    cy.intercept('POST', `**${BASE_URL.replace(/^[a-z]+:\/\/[^/]+/, '')}/doacoes/nova-doacao/`).as('postDoacaoGeral');
    cy.get('#nova-doacao form.formulario-geral button[type="submit"].botao-primario').click();
    cy.wait('@postDoacaoGeral');
    cy.log(`Doação geral de R$${(parseFloat(valorDoacaoGeral)/100).toFixed(2)} realizada.`);

    cy.log('9. Logout do Doador...');
    cy.visit(`${BASE_URL}/usuarios/painel-doador/`);
    cy.get('.navegacao-lateral a[href*="logout"]').click();
    cy.url().should('include', '/usuarios/login/');
    cy.log('Logout do Doador realizado.');

    cy.log('10. Login como Gestor novamente...');
    cy.get('input[name="email"]').type(gestorEmail);
    cy.get('input[name="senha"]').type(gestorPassword);
    cy.get('button[type="submit"].botao-acessar').click();
    cy.url().should('include', '/usuarios/painel-gestor/');
    cy.log('Login como Gestor (2ª vez) realizado.');

    cy.log('11. Aprovando Doação Geral Pendente...');
    cy.get('.navegacao-lateral a[data-secao="doacoes"]').click();
    cy.get('#doacoes.secao-conteudo.ativo').should('be.visible');
    
    cy.get('#doacoes .tabela-padrao tbody tr').contains('td', doadorNome).parents('tr').first().within(() => {
      cy.get('td').eq(1).should('contain', (parseFloat(valorDoacaoGeral)/100).toLocaleString('pt-BR', {minimumFractionDigits: 2}));
      cy.get('td .status.status-pendente').should('contain', 'Pendente');
      cy.intercept('GET', `**${BASE_URL.replace(/^[a-z]+:\/\/[^/]+/, '')}/doacoes/aceitar-doacao/*`).as('getAceitarDoacaoGestor');
      cy.get('a.botao-pequeno.aprovar').contains('Aprovar').click();
    });

    cy.log('12. Logout Final do Gestor...');
    cy.get('.navegacao-lateral a[href*="logout"]').click();
    cy.url().should('include', '/usuarios/login/');
    cy.log('--- Setup Base Concluído ---');
  });
});