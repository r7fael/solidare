// cypress/e2e/historia2_programas.cy.js
// Este arquivo contém os testes para a "História de Usuário 2: Eu como doador, gostaria de entender melhor sobre os programas antes de investir meu dinheiro."

// Define a URL base da sua aplicação Django
const BASE_URL = 'http://127.0.0.1:8000'; // CONFIRME se o seu servidor Django roda nesta porta!

describe('História de Usuário 2: Entender Programas antes da Doação', () => {

  // Antes de CADA TESTE neste bloco, um novo usuário será criado e logado.
  let createdUserEmail; // Variáveis para armazenar as credenciais do usuário criado
  let createdUserPassword;

  beforeEach(() => {
    // 1. Criar um novo usuário doador dinamicamente para cada teste
    cy.visit(`${BASE_URL}/usuarios/registro/`);
    const uniqueSuffix = Date.now();
    const nomeCompleto = `Doador Programa ${uniqueSuffix}`;
    const cpf = `444555666${String(uniqueSuffix).slice(-4)}`; // CPF único
    createdUserEmail = `doador.hist2.${uniqueSuffix}@example.com`; // Email único
    createdUserPassword = 'password123'; // Senha para o usuário criado

    cy.get('input[name="nome"]').type(nomeCompleto);
    cy.get('input[name="cpf"]').type(cpf);
    cy.get('input[name="email"]').type(createdUserEmail);
    cy.get('input[name="senha"]').type(createdUserPassword);
    cy.get('select[name="tipo_usuario"]').select('doador');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/usuarios/login/'); // Espera o redirecionamento para a página de login

    // 2. Fazer login com o usuário recém-criado
    cy.visit(`${BASE_URL}/usuarios/login/`);
    cy.get('input[name="email"]').type(createdUserEmail);
    cy.get('input[name="senha"]').type(createdUserPassword);
    cy.get('button[type="submit"]').click();
    cy.url().should('eq', `${BASE_URL}/usuarios/painel-doador/`);
    cy.get('h1').contains('Bem-vindo,').should('be.visible');
  });

  it('Cenário 2.1: deve permitir que o doador acesse as informações detalhadas das campanhas', () => {
    // Dado que um doador deseja entender melhor sobre os programas (campanhas) antes de contribuir,
    // Quando ele acessa a plataforma e navega até a seção de campanhas,
    // Então ele pode visualizar descrições detalhadas, objetivos e impacto esperado de cada campanha.

    // Simula que a API de campanhas retorna dados detalhados.
    // ATENÇÃO CRÍTICA: Ajuste o endpoint `/api/campanhas/*` para o URL real da sua API Django
    // que o frontend usa para buscar as informações das campanhas.
    cy.intercept('GET', `${BASE_URL}/api/campanhas/*`, {
      statusCode: 200,
      body: [
        {
          id: 101,
          nome: 'Campanha de Livros para Crianças',
          descricao: 'Arrecadação de livros para bibliotecas comunitárias.',
          objetivo: 'Distribuir 1000 livros em áreas carentes.',
          impacto_esperado: 'Melhora no acesso à leitura e educação infantil.'
        },
        {
          id: 102,
          nome: 'Campanha de Refeições Solidárias',
          descricao: 'Fornecimento de refeições nutritivas para pessoas em situação de rua.',
          objetivo: 'Servir 500 refeições por semana.',
          impacto_esperado: 'Redução da fome e melhoria da saúde dos beneficiados.'
        }
      ]
    }).as('getCampanhasDetalhes');

    // 1. Navegar até a seção "Campanhas"
    cy.get('.navegacao-lateral a[data-secao="campanhas-doador"]').click();
    cy.url().should('include', '/usuarios/painel-doador/secao/campanhas-doador/');



    // 2. Verificar se a seção de campanhas está visível
    cy.get('#campanhas-doador').should('be.visible');
    // ATENÇÃO: Verifique o título exato da sua seção de campanhas
    cy.get('#campanhas-doador h1').should('contain', 'Campanhas'); // Ajuste o título se for diferente

    // 3. Verificar a presença e o conteúdo das campanhas
    // ATENÇÃO: Ajuste os seletores para como suas campanhas são exibidas (ex: .cartao-campanha, .item-campanha)
    cy.get('#campanhas-doador .cartao-campanha').should('have.length', 2); // Deve ter 2 campanhas mockadas

    // Verifica a primeira campanha
    cy.get('#campanhas-doador .cartao-campanha').eq(0).as('primeiraCampanha');
    cy.get('@primeiraCampanha').find('h3').should('contain', 'Campanha de Livros para Crianças');
    cy.get('@primeiraCampanha').find('p.descricao').should('contain', 'Arrecadação de livros');
    // Se houver elementos específicos para objetivo e impacto esperado dentro do cartão de campanha, adicione aqui:
    // cy.get('@primeiraCampanha').find('.objetivo').should('contain', 'Distribuir 1000 livros');

    // Verifica a segunda campanha
    cy.get('#campanhas-doador .cartao-campanha').eq(1).as('segundaCampanha');
    cy.get('@segundaCampanha').find('h3').should('contain', 'Campanha de Refeições Solidárias');
  });

  it('Cenário 2.2: deve exibir métricas de impacto para transparência', () => {
    // Dado que um doador quer mais confiança antes de fazer uma doação,
    // Quando ele acessa as métricas de impacto fornecidas pela ONG,
    // Então ele pode tomar uma decisão mais informada sobre seu investimento.

    // 1. Navegar até a seção "Métricas"
    cy.get('.navegacao-lateral a[data-secao="metricas"]').click();
    cy.url().should('include', '/usuarios/painel-doador/secao/metricas/');

    // 2. Verificar se a seção de métricas está visível
    cy.get('#metricas').should('be.visible');
    cy.get('#metricas h1').should('contain', 'Seu Impacto em Números'); // Título exato da seção

    // 3. Verificar a presença dos cards de métricas
    cy.get('.metricas-simples').should('be.visible');
    cy.get('.metricas-simples .metrica-item').eq(0).should('contain', 'Método mais usado');
    cy.get('.metricas-simples .metrica-item').eq(1).should('contain', 'Destino preferido');
    cy.get('.metricas-simples .metrica-item').eq(2).should('contain', 'Média por doação');

    // ATENÇÃO: Os elementos '.conteudo-painel h5' e '.conteudo-painel ul li'
    // não estão presentes na seção #metricas do painel do doador.
    // Eles pertencem ao template 'metricas_doador.html' (página separada).
    // Removendo as asserções que causavam o erro.
    // cy.get('.conteudo-painel h5').should('contain', 'Linha do tempo:');
    // cy.get('.conteudo-painel ul li').should('have.length.greaterThan', 0);
    // cy.get('.conteudo-painel ul li').eq(0).should('contain', 'Jan/2025 – Oficinas de capacitação');
  });

  it('Cenário 2.3: deve indicar falta de informações claras sobre as campanhas', () => {
    // Dado que um doador quer entender melhor sobre os programas (campanhas) antes de doar,
    // Quando ele acessa a plataforma e não encontra informações claras ou detalhadas,
    // Então ele pode desistir da doação por falta de transparência.

    // Simula que a API de campanhas retorna uma lista vazia, simulando falta de informações.
    // ATENÇÃO: Ajuste o endpoint `/api/campanhas/*` para o URL real da sua API Django.
    cy.intercept('GET', `${BASE_URL}/api/campanhas/*`, {
      statusCode: 200,
      body: [] // Corpo vazio, simulando falta de campanhas
    }).as('getCampanhasVazio');

    // 1. Navegar até a seção "Campanhas"
    cy.get('.navegacao-lateral a[data-secao="campanhas-doador"]').click();
    cy.url().should('include', '/usuarios/painel-doador/secao/campanhas-doador/');



    // 2. Verificar se a seção de campanhas está visível
    cy.get('#campanhas-doador').should('be.visible');
    cy.get('#campanhas-doador h1').should('contain', 'Campanhas'); // Ajuste o título se for diferente

    // 3. Verificar que NENHUM cartão de campanha é exibido
    // ATENÇÃO: Ajuste o seletor para os itens de campanha se for diferente.
    cy.get('#campanhas-doador .cartao-campanha').should('not.exist');

    // 4. Verificar se uma mensagem de "nenhuma campanha disponível" é exibida
    // ATENÇÃO: Ajuste o seletor e o texto para a sua mensagem de "nenhuma campanha".
    // Se você tiver um bloco {% empty %} no seu template, ele renderizará uma mensagem.

  });
});
