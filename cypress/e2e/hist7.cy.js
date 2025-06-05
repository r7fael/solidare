// cypress/e2e/historia7_doador_campanhas.cy.js (Exemplo de nome de arquivo)

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

describe('História de Usuário 7: Campanhas de Arrecadação Específicas', () => {

  let createdUserEmail;
  let createdUserPassword;

  beforeEach(() => {
    // 1. Cadastrar um novo usuário doador dinamicamente
    cy.visit(`${BASE_URL}/usuarios/registro/`);
    const uniqueSuffix = Date.now();
    const nomeCompleto = `Doador Campanha ${uniqueSuffix}`;
    const cpf = gerarCPFValidoSimples(); // Usando a função para gerar CPF
    createdUserEmail = `doador.campanha.h7.${uniqueSuffix}@example.com`;
    createdUserPassword = 'password123';

    cy.get('input[name="nome"]').type(nomeCompleto);
    cy.get('input[name="cpf"]').type(cpf);
    cy.get('input[name="email"]').type(createdUserEmail);
    cy.get('input[name="senha"]').type(createdUserPassword);
    cy.get('select[name="tipo_usuario"]').select('doador');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/usuarios/login/'); // Espera o redirecionamento

    // 2. Fazer login com o usuário recém-criado
    cy.visit(`${BASE_URL}/usuarios/login/`);
    cy.get('input[name="email"]').type(createdUserEmail);
    cy.get('input[name="senha"]').type(createdUserPassword);
    cy.get('button[type="submit"]').click();
    cy.url().should('eq', `${BASE_URL}/usuarios/painel-doador/`);
    // ATENÇÃO: Ajuste o seletor e o texto de boas-vindas se necessário
    cy.get('h1').contains('Bem-vindo,').should('be.visible'); 
  });

  it('Cenário 7.1: deve permitir a descoberta e visualização de campanhas ativas', () => {
    // Simula que a API de campanhas retorna campanhas ativas com detalhes.
    // ATENÇÃO: Ajuste o endpoint `/api/campanhas/*` para o URL real da sua API.
  

    // 1. Navegar até a seção "Campanhas"
    // ATENÇÃO: Ajuste o seletor `a[data-secao="campanhas-doador"]` se for diferente.
    cy.get('.navegacao-lateral a[data-secao="campanhas-doador"]').click();
    // ATENÇÃO: Ajuste a URL da seção de campanhas do doador se for diferente.
    cy.url().should('include', '/usuarios/painel-doador/secao/campanhas-doador/');


  });

  it('Cenário 7.2: deve permitir a doação direcionada para uma campanha específica', () => {

    cy.intercept('POST', `${BASE_URL}/api/doar-campanha/`, {
      body: {
        status: 'sucesso',
        mensagem: 'Sua doação para a campanha "Mentes Brilhantes" foi registrada com sucesso!'
      }
    }).as('postDoacaoCampanha');

    // 1. Navegar até a seção "Campanhas"
    cy.get('.navegacao-lateral a[data-secao="campanhas-doador"]').click();
    cy.url().should('include', '/usuarios/painel-doador/secao/campanhas-doador/');


    // 2. Clicar no botão "Doar" da campanha desejada
    // ATENÇÃO: Ajuste o seletor do botão "Doar" (ex: '.btn-doar-campanha')
    cy.get('.cartao-campanha-doador').first().within(() => {
    cy.get('button.botao-primario.abrir-modal-doar-campanha').click();
});

    // 3. Verificar se o modal de doação aparece
    // ATENÇÃO: Ajuste os seletores do modal e do título do modal.
    cy.get('#modal-doar-campanha-painel').should('be.visible');
    cy.get('#modal-doar-campanha-painel').should('contain', '');

    // 4. Preencher o valor e método de pagamento no modal
    // ATENÇÃO: Ajuste os seletores dos campos do modal.
    cy.get('#modal-doar-campanha-painel input[name="valor_campanha_painel"]').type('150.00'); // Formato do valor
    cy.get('#modal-doar-campanha-painel select[name="metodo_campanha_painel"]').select('PIX');


    // 5. Clicar no botão de confirmar doação no modal
    cy.get('#nova-doacao button[type="submit"]').click({ force: true });



  

    // 6. Verificar a confirmação de que a doação foi direcionada
    // ATENÇÃO: Ajuste o seletor e o texto da mensagem de sucesso.
    // Opcional: Verificar se o modal fechou
  });

  it('Cenário 7.3: deve indicar informações de progresso da campanha desatualizadas', () => {
    // Simula que a API de campanhas retorna dados com progresso que não foi atualizado.
    // ATENÇÃO: Ajuste o endpoint `/api/campanhas/*`.
    cy.intercept('GET', `${BASE_URL}/api/campanhas/*`, {
      body: [
        {
          nome: 'Mentes Brilhantes',
          descricao: 'A campanha Mentes Brilhantes tem como objetivo identificar e incentivar talentos entre os alunos da rede pública, oferecendo oficinas gratuitas de reforço escolar, criatividade, lógica …',
          meta_financeira: 25000.00,
          arrecadado_atual: 0,
          progresso_porcentagem: 0,// Data bem antiga para simular desatualização
        }
      ]
    }).as('getCampanhaDesatualizada');

    // 1. Navegar até a seção "Campanhas"
    cy.get('.navegacao-lateral a[data-secao="campanhas-doador"]').click();
    cy.url().should('include', '/usuarios/painel-doador/secao/campanhas-doador/');
   

    // 2. Verificar se a seção de campanhas está visível
    cy.get('#campanhas-doador').should('be.visible');

    // 3. Verificar que a campanha com dados desatualizados é exibida

    // 4. Verificar a presença de um indicador de data de atualização (se existir na UI)
    // ATENÇÃO: Se sua UI exibir a "data da última atualização" ou um aviso, ajuste os seletores e o texto.
    // Exemplo: se houver um <span class="data-atualizacao-campanha">Atualizado em: DD/MM/YYYY</span>
   // AJUSTE O FORMATO E TEXTO CONFORME SUA UI

    // Opcional: Verificar se há uma mensagem de alerta explícita sobre dados desatualizados.
    // cy.get('@campanhaCard').find('.aviso-dados-desatualizados').should('be.visible')
    //   .and('contain', 'Informações podem estar desatualizadas.');
  });
});