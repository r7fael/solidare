const BASE_URL = 'http://127.0.0.1:8000';

describe('História de Usuário 3: Mensagens de Incentivo Supervisionadas', () => {
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
    const nomeCompleto = `Doador Mensagem ${timestamp}`;
    
    const randomPart = Math.random().toString().slice(2, 9); 
    const timestampPart = String(timestamp).slice(-4); 
    let cpfNumeros = (randomPart + timestampPart).slice(0, 11); 
    if (cpfNumeros.length < 11) {
        cpfNumeros = cpfNumeros.padEnd(11, '0');
    }

    const cpfFormatado = formatCPF(cpfNumeros); 

    createdUserEmail = `doador.msg.${timestamp}@example.com`; 
    createdUserPassword = 'password123';

    cy.get('input[name="nome"]').type(nomeCompleto);
    cy.get('input[name="cpf"]').type(cpfFormatado); 
    cy.get('input[name="email"]').type(createdUserEmail);
    cy.get('input[name="senha"]').type(createdUserPassword);
    cy.get('select[name="tipo_usuario"]').select('doador');
    cy.get('button[type="submit"]').click();
    
    cy.url().should('include', '/usuarios/login/'); 
  });

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    
    cy.visit(`${BASE_URL}/usuarios/login/`);
    cy.get('input[name="email"]').type(createdUserEmail);
    cy.get('input[name="senha"]').type(createdUserPassword);
    cy.get('button[type="submit"]').click();
    cy.url().should('eq', `${BASE_URL}/usuarios/painel-doador/`);
    cy.get('.cartao-boasvindas h1').contains('Bem-vindo,').should('be.visible');
  });

  it('Cenário 3.1: deve permitir o envio de mensagens de incentivo para os jovens beneficiados (e aguardar revisão)', () => {
    cy.get('.navegacao-lateral a[data-secao="mensagens"]').click();
    cy.url().should('include', '/usuarios/painel-doador/secao/mensagens/');

    cy.get('#btn-nova-mensagem-form').click();
    cy.get('#formulario-nova-mensagem').should('be.visible');

    const assuntoMensagem = `Incentivo Teste ${Date.now()}`;
    const conteudoMensagem = `Conteúdo da mensagem de incentivo enviada em ${new Date().toLocaleString()}.`;

    cy.get('#formulario-nova-mensagem select#destinatario-mensagem option').then($options => {
      if ($options.length > 1) {
        cy.get('select#destinatario-mensagem').select(1); 
      } else {
        cy.log('AVISO: Não há beneficiários disponíveis para selecionar. O teste pode não refletir o cenário completo.');
      }
    });
    cy.get('input#assunto-mensagem').type(assuntoMensagem);
    cy.get('textarea#conteudo-mensagem').type(conteudoMensagem);
    
    cy.intercept('POST', `${BASE_URL}/usuarios/painel-doador/`).as('postMensagemIncentivo');
    
    cy.get('#formulario-nova-mensagem button[type="submit"]').click();

    cy.wait('@postMensagemIncentivo');
    cy.url().should('include', '/usuarios/painel-doador/secao/mensagens/');
    
    cy.get('.alerta.alerta-success, .alerta.alerta-info').should('be.visible').and('contain', 'Mensagem enviada com sucesso! Ela será revisada pela nossa equipe.');
    
    cy.get('.lista-mensagens .cartao-mensagem').first().should('contain', assuntoMensagem);
    cy.get('.lista-mensagens .cartao-mensagem').first().find('.status.status-aguardando').should('contain', 'Aguardando Aprovação');
  });

  it('Cenário 3.2: deve exibir a mensagem como "Aprovada" após revisão da equipe da ONG', () => {
    const assuntoParaAprovar = `Mensagem para Aprovar ${Date.now()}`;
    const conteudoParaAprovar = `Este conteúdo será aprovado.`;
    const mockMensagemId = `mockId${Date.now()}`;

    cy.intercept('POST', `${BASE_URL}/usuarios/painel-doador/`, (req) => {
      if (req.body.includes('action=nova_mensagem_painel') && req.body.includes(assuntoParaAprovar)) {
        req.reply({
          statusCode: 302, 
          headers: { Location: `${BASE_URL}/usuarios/painel-doador/secao/mensagens/` },
        });
      }
    }).as('enviarMsgParaAprovar');
    
    cy.intercept('GET', `${BASE_URL}/usuarios/painel-doador/secao/mensagens/`, (req) => {
        req.continue((res) => {
            if (res.body.includes(assuntoParaAprovar)){
                 res.body = res.body.replace(`status-aguardando">Aguardando Aprovação`, `status-aprovado">Aprovada`);
            }
        });
    }).as('getMensagensAposEnvioAprovar');


    cy.get('.navegacao-lateral a[data-secao="mensagens"]').click();
    cy.get('#btn-nova-mensagem-form').click();
    cy.get('#formulario-nova-mensagem').should('be.visible');
    
    cy.get('select#destinatario-mensagem option').then($options => {
      if ($options.length > 1) cy.get('select#destinatario-mensagem').select(1);
    });
    cy.get('input#assunto-mensagem').type(assuntoParaAprovar);
    cy.get('textarea#conteudo-mensagem').type(conteudoParaAprovar);
    cy.get('#formulario-nova-mensagem button[type="submit"]').click();
    
    cy.wait('@enviarMsgParaAprovar');
    cy.wait('@getMensagensAposEnvioAprovar', { timeout: 10000 }); 

    cy.get('.lista-mensagens .cartao-mensagem').contains(assuntoParaAprovar).parents('.cartao-mensagem')
      .find('.status.status-aprovado').should('be.visible').and('contain', 'Aprovada');
  });

  it('Cenário 3.3: deve exibir a mensagem como "Rejeitada" com sugestões de ajustes no modal', () => {
    const assuntoParaRejeitar = `Mensagem para Rejeitar ${Date.now()}`;
    const conteudoParaRejeitar = `Este conteúdo será rejeitado.`;
    const motivoRejeicaoMock = 'Conteúdo inadequado. Por favor, revise sua mensagem.';
    const mockMensagemIdRejeitar = `mockIdRejeitar${Date.now()}`;

     cy.intercept('POST', `${BASE_URL}/usuarios/painel-doador/`, (req) => {
      if (req.body.includes('action=nova_mensagem_painel') && req.body.includes(assuntoParaRejeitar)) {
        req.reply({
          statusCode: 302,
          headers: { Location: `${BASE_URL}/usuarios/painel-doador/secao/mensagens/` },
        });
      }
    }).as('enviarMsgParaRejeitar');
    
    cy.intercept('GET', `${BASE_URL}/usuarios/painel-doador/secao/mensagens/`, (req) => {
        req.continue((res) => {
            if (res.body.includes(assuntoParaRejeitar)){
                 res.body = res.body.replace(`status-aguardando">Aguardando Aprovação`, `status-rejeitado">Rejeitada`);
                 const modalHtml = `
                 <div class="modal modal-painel" id="modal-mensagem-doador-${mockMensagemIdRejeitar}" style="display: none;">
                     <div class="modal-conteudo">
                         <div class="cabecalho-modal">
                             <h3>Detalhes da Mensagem</h3>
                             <button class="fechar-modal fechar-modal-doador-mensagem" data-modal-id="modal-mensagem-doador-${mockMensagemIdRejeitar}">&times;</button>
                         </div>
                         <div class="corpo-modal">
                             <p><strong>Assunto:</strong> ${assuntoParaRejeitar}</p>
                             <p><strong>Status:</strong> <span class="status status-rejeitado">Rejeitada</span></p>
                             <h4>Mensagem:</h4>
                             <p class="conteudo-mensagem-modal">${conteudoParaRejeitar}</p>
                             <div class="motivo-rejeicao"><strong>Motivo da rejeição:</strong> ${motivoRejeicaoMock}</div>
                         </div>
                         <div class="rodape-modal">
                             <button class="botao-neutro fechar-modal-doador-mensagem" data-modal-id="modal-mensagem-doador-${mockMensagemIdRejeitar}">Voltar</button>
                         </div>
                     </div>
                 </div>`;
                 if (!res.body.includes(`modal-mensagem-doador-${mockMensagemIdRejeitar}`)) {
                    res.body = res.body.replace('</body>', `${modalHtml}</body>`);
                 }
                 const cartaoSelector = `.cartao-mensagem[data-status="rejeitado"] button[data-id="${mockMensagemIdRejeitar}"]`;
                 if(!res.body.includes(cartaoSelector)){
                     const cardHtml = `
                     <div class="cartao-mensagem" data-status="rejeitado">
                         <div class="cabecalho-mensagem">
                             <div class="info-basica-mensagem">
                                 <div class="assunto-mensagem"><strong>Assunto:</strong> ${assuntoParaRejeitar}</div>
                             </div>
                             <div class="status-acoes-mensagem">
                                 <span class="status status-rejeitado">Rejeitada</span>
                                 <button class="botao-pequeno ver-mais btn-ver-mais-mensagem-doador" data-id="${mockMensagemIdRejeitar}">Ver mais</button>
                             </div>
                         </div>
                     </div>`;
                    if(res.body.includes('<div class="lista-mensagens">')){
                        res.body = res.body.replace('<div class="lista-mensagens">', `<div class="lista-mensagens">${cardHtml}`);
                    } else {
                         res.body = res.body.replace('</main>', `${cardHtml}</main>`);
                    }
                 }
            }
        });
    }).as('getMensagensAposEnvioRejeitar');

    cy.get('.navegacao-lateral a[data-secao="mensagens"]').click();
    cy.get('#btn-nova-mensagem-form').click();
    cy.get('#formulario-nova-mensagem').should('be.visible');

    cy.get('select#destinatario-mensagem option').then($options => {
      if ($options.length > 1) cy.get('select#destinatario-mensagem').select(1);
    });
    cy.get('input#assunto-mensagem').type(assuntoParaRejeitar);
    cy.get('textarea#conteudo-mensagem').type(conteudoParaRejeitar);
    cy.get('#formulario-nova-mensagem button[type="submit"]').click();

    cy.wait('@enviarMsgParaRejeitar');
    cy.wait('@getMensagensAposEnvioRejeitar', { timeout: 10000 });
    
    const cartaoMensagemRejeitada = cy.get('.lista-mensagens .cartao-mensagem').contains(assuntoParaRejeitar).parents('.cartao-mensagem');
    cartaoMensagemRejeitada.find('.status.status-rejeitado').should('be.visible').and('contain', 'Rejeitada');
    
    cartaoMensagemRejeitada.find('.btn-ver-mais-mensagem-doador').click();
    cy.get(`#modal-mensagem-doador-${mockMensagemIdRejeitar}`).should('be.visible');
    cy.get(`#modal-mensagem-doador-${mockMensagemIdRejeitar} .motivo-rejeicao`)
      .should('be.visible')
      .and('contain', motivoRejeicaoMock);
  });
});