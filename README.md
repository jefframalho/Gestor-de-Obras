# Gestor de Obras

Sistema por assinatura para **várias construtoras**: cada construtora cria a conta, testa grátis por 7 dias e depois paga a mensalidade. Cada uma só vê os próprios dados.

## O que tem

| Módulo | Recursos |
|---|---|
| **Painel** | obras em andamento, avanço médio, a receber/pagar em 30 dias, contas vencidas, saldo do mês, estoque baixo |
| **Obras** | cadastro, etapas com % concluído, cronograma (gráfico de barras com linha de "hoje"), diário de obra com foto, custo real × orçamento, prazo |
| **Financeiro** | contas a pagar e receber por obra, filtros (tipo, situação, obra, mês), baixa em um clique |
| **Materiais** | estoque por obra ou depósito, entradas e saídas (atualiza o estoque sozinho), alerta de mínimo, pedidos de compra enviados ao fornecedor pelo WhatsApp, pedido vira conta a pagar |
| **Equipe** | funcionários e diárias, "lançar diárias do dia" marcando quem trabalhou, pagamento em um clique (vira lançamento de mão de obra por obra), usuários do sistema com perfis |
| **Clientes** | cadastro, contratos, gerar parcelas a receber automaticamente |
| **Portal do cliente** | link público para o cliente acompanhar % da obra, etapas e fotos do diário — sem valores |
| **Assinantes** (só você) | lista de construtoras, +30 dias quando pagar, bloquear/liberar, receita mensal |

Perfis de usuário: **Administrador** (tudo), **Engenheiro / Mestre de obras** (obras, diário, materiais, equipe — sem financeiro), **Financeiro**.

## Estrutura do site

- `index.html` — página de vendas (raiz do site)
- `app/index.html` — o sistema (login, painel, obras...)
- `assets/` — prints do sistema usados na página de vendas
- Botão "Testar grátis" abre `app/?criar=1` (direto no cadastro)

## Orçamentos

Itens por etapa com o seu custo, BDI/margem e desconto. "Salvar e gerar PDF" abre o orçamento em A4: clique em **Salvar PDF / Imprimir** e escolha **Salvar como PDF**. A logo vem de Configurações. **Aprovar** cria a obra, as etapas (com custo previsto) e o contrato.

## Contratos com assinatura

Em Clientes → Contratos, botão **Assinar**: enviar o link para o cliente assinar pelo celular, ou assinar na hora com o dedo. O modelo do contrato (com campos automáticos {{CLIENTE}}, {{VALOR}}...) e a assinatura da construtora ficam em Configurações. Cada assinatura registra nome, CPF, data/hora e aparelho.

## Vistoria e entrega da obra

Na obra, aba **Vistoria e entrega**: checklist por ambiente (OK / Pendente / N/A, observação e foto), documento em PDF e assinatura do cliente (na hora ou por link). Ao assinar o termo de entrega, a obra fica como Concluída.

## Testar agora

Abra o `app/index.html` no navegador e clique em **Entrar com dados de exemplo**. Sem o Firebase configurado ele roda em modo demonstração (dados só naquele navegador).

## Colocar no ar (Firebase)

1. Crie um projeto em <https://console.firebase.google.com> (ex.: `gestor-de-obras`).
2. **Authentication → Começar → E-mail/senha → Ativar.**
3. **Firestore Database → Criar banco** (modo produção, região `southamerica-east1`).
4. Em **Firestore → Regras**, cole o conteúdo de `firestore.rules` e publique.
5. **Configurações do projeto → Seus apps → Web (</>)**, copie o `firebaseConfig` e cole em `FIREBASE_CONFIG` no topo do `index.html`.
6. Ainda no topo do `index.html`, confira `ADMIN_EMAILS`, `PRECO_MENSAL`, `DIAS_TESTE` e `WHATS_SUPORTE`.
7. Publique: GitHub Pages (suba o `index.html` no repositório e ative Pages) ou Firebase Hosting.
8. Entre com o e-mail de administrador: crie uma conta normal para ter a sua construtora de teste — o menu **Assinantes** aparece para você.

> O e-mail do administrador também está dentro do `firestore.rules`. Se trocar, troque nos dois lugares.

## Cobrança

Hoje: o cliente clica em "Assinar/Renovar", cai no seu WhatsApp, paga (Pix/boleto/cartão pelo Asaas) e você clica **+30 dias (pago)** na tela Assinantes. Quem vence é bloqueado automaticamente — inclusive no servidor, pelas regras do Firestore.
Próximo passo possível: renovação automática pelo Asaas (webhook num Cloudflare Worker, igual ao do Clinix).
