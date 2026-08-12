# Don Cabrón — Sistema de Gestão para Restaurante

Aplicação web em desenvolvimento para apoiar a operação de um restaurante: apresentação do cardápio, gestão de mesas, abertura de comandas, montagem e envio de pedidos para a cozinha, consulta de estoque e cadastro/pesquisa de fornecedores.

> **Status do repositório:** documentação baseada na implementação existente em 12/08/2026.

## Sumário

- [Visão do produto](#visão-do-produto)
- [Funcionalidades implementadas](#funcionalidades-implementadas)
- [Requisitos funcionais](#requisitos-funcionais)
- [Regras de negócio em vigor](#regras-de-negócio-em-vigor)
- [Arquitetura e tecnologias](#arquitetura-e-tecnologias)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Modelo de dados inferido](#modelo-de-dados-inferido)
- [API HTTP](#api-http)
- [Instalação e execução](#instalação-e-execução)
- [Limitações e melhorias recomendadas](#limitações-e-melhorias-recomendadas)

## Visão do produto

O Don Cabrón pretende digitalizar o atendimento presencial de restaurantes e lanchonetes. A implementação atual concentra-se no fluxo de salão: o operador administra mesas, abre ou recupera uma comanda para uma mesa, monta um pedido, confirma o envio para a cozinha e consulta os itens confirmados. O sistema também fornece um cardápio visual e operações básicas de fornecedores e estoque.

## Funcionalidades implementadas

### Cardápio

- Consulta os produtos da API e exibe imagem, nome, descrição e preço.
- Separa itens nas categorias `Comida`, `Bebida Alcoolica`, `Bebida Gaseificada` e `Artesanal`.
- Disponibiliza alternância visual de tema claro/escuro e menu responsivo na tela inicial.

### Mesas e comandas

- Lista apenas mesas ativas, com número, capacidade e status.
- Cadastra mesas inicialmente como `LIVRE` e ativas.
- Permite alterar número e capacidade de uma mesa ativa.
- Desativa mesas por exclusão lógica (`ativo = 0`).
- Cria ou recupera uma comanda aberta para a mesa selecionada.
- Ao criar a comanda pelo endpoint `/comandas`, a mesa passa para `OCUPADA`.
- Existe também um endpoint transacional para abrir uma mesa, que cria a comanda e atualiza o status da mesa de forma atômica.

### Pedidos

- A tela de pedidos recebe a mesa pela query string, por exemplo: `pedidos.html?mesa=1`.
- Um pedido em montagem é mantido no navegador até a confirmação.
- Permite adicionar o mesmo produto mais de uma vez e ajustar sua quantidade antes do envio.
- Ao confirmar, os itens são enviados a um pedido pendente; em seguida o pedido muda para `RECEBIDO`, representando o envio para a cozinha.
- Itens de pedidos com status `RECEBIDO`, `EM_PREPARO`, `PRONTO` ou `ENTREGUE` são apresentados como itens já enviados e agrupados por produto.

### Fornecedores

- Cadastra fornecedor com documento, nome, endereço, bairro, cidade e telefone.
- No front-end, restringe documento e telefone a dígitos; aceita CPF com 11 dígitos ou CNPJ com 14, e telefone com 10 ou 11 dígitos.
- Pesquisa fornecedores por parte do nome ou documento.
- Trata documento duplicado retornando conflito HTTP 409.

### Estoque

- Consulta estoque com nome e categoria do produto e quantidade disponível.
- Há uma rota legada para adicionar item diretamente à comanda que consulta e baixa estoque quando `controla_estoque = 1`.

## Requisitos funcionais

| ID | Requisito | Situação |
| --- | --- | --- |
| RF01 | Exibir cardápio e produtos por categoria | Implementado |
| RF02 | Cadastrar, listar, alterar e desativar mesas | Implementado |
| RF03 | Abrir/recuperar comanda de uma mesa | Implementado |
| RF04 | Montar pedido de uma comanda e confirmar o envio | Implementado |
| RF05 | Consultar itens confirmados de uma comanda | Implementado |
| RF06 | Consultar estoque | Implementado |
| RF07 | Cadastrar e pesquisar fornecedores | Implementado |

## Regras de negócio em vigor

1. **Mesa ativa:** a listagem, a edição e a desativação operam sobre mesas ativas. Uma mesa desativada deixa de aparecer na listagem normal.
2. **Unicidade de mesa:** o número de mesa não pode duplicar; o banco deve possuir restrição de unicidade, pois a API trata `ER_DUP_ENTRY` como conflito.
3. **Dados obrigatórios da mesa:** número e capacidade são exigidos na criação e alteração.
4. **Abertura transacional de mesa:** pelo endpoint específico de abertura, a mesa precisa existir, estar ativa e não estar `OCUPADA`. A comanda `ABERTA` e o status `OCUPADA` são gravados em uma transação.
5. **Uma comanda aberta por mesa no fluxo principal:** `POST /comandas` busca uma comanda `ABERTA` existente e a devolve, evitando criar outra pelo mesmo fluxo.
6. **Pedido somente em comanda aberta:** adição e confirmação de itens de pedido exigem uma comanda com status `ABERTA`.
7. **Pedido pendente reutilizável:** ao inserir itens, a API busca o último pedido `PENDENTE` da comanda; se não existir, cria um novo. Itens repetidos no mesmo pedido têm a quantidade somada.
8. **Quantidade válida:** no fluxo atual de pedidos, a quantidade deve ser um inteiro maior que zero.
9. **Confirmação:** um pedido pendente só pode ser confirmado se possuir ao menos um item. A confirmação altera seu status para `RECEBIDO`.
10. **Itens enviados:** a consulta da comanda considera os pedidos `RECEBIDO`, `EM_PREPARO`, `PRONTO` e `ENTREGUE`; pedidos pendentes não são exibidos nessa seção.
11. **Fornecedor obrigatório:** documento, nome, endereço, bairro, cidade e telefone devem ser enviados. O documento deve ser único.
12. **Estoque na rota legada:** ao adicionar diretamente a uma comanda, produto controlado por estoque precisa ter registro de estoque e saldo suficiente; então a quantidade é reduzida. O fluxo atual de `pedidos` não realiza essa baixa.

## Arquitetura e tecnologias

| Camada | Implementação |
| --- | --- |
| Front-end | HTML5, CSS3 e JavaScript puro |
| Back-end | Node.js, Express 5 e CommonJS |
| Banco de dados | MySQL, via `mysql2/promise` e pool de conexões |
| Integração | API REST em JSON com `fetch` |
| Configuração | `dotenv` e variáveis de ambiente |
| Middleware | `cors`, `express.json()` e arquivos estáticos do Express |

O servidor escuta na porta **3000**, publica os arquivos de `DonCabron` e os scripts de `js`, e expõe as rotas da API na mesma origem. O front-end usa URLs absolutas para `http://localhost:3000`.

## Estrutura do projeto

```text
.
├── DonCabron/
│   ├── BackEnd/
│   │   ├── config/database.js       # pool MySQL por variáveis de ambiente
│   │   ├── routes/                  # produtos, estoque, fornecedores, mesas e comandas
│   │   ├── server.js                # servidor Express
│   │   ├── package.json
│   │   └── .env                     # local; ignorado pelo Git
│   ├── css/                         # estilos das telas
│   ├── img/                         # logos, fundos e imagens dos produtos
│   └── index/                       # telas HTML
├── js/                              # scripts usados pelas telas
├── PRD.docx                         # documento de visão/PRD existente
├── requisitos para estagio supervisionado.docx
└── README.md                        # esta documentação
```

## Modelo de dados inferido

Não há script SQL no repositório; as entidades abaixo foram inferidas das consultas da API e devem existir no MySQL para a aplicação funcionar.

| Tabela | Campos usados | Relações e finalidade |
| --- | --- | --- |
| `produtos` | `id`, `nome`, `categoria`, `descricao`, `preco`, `imagem`, `controla_estoque` | Base do cardápio e dos itens de pedido |
| `estoque` | `produto_id`, `quantidade` | Estoque associado a produto |
| `fornecedores` | `id`, `documento`, `nome`, `endereco`, `bairro`, `cidade`, `telefone` | Cadastro e busca de fornecedores |
| `mesas` | `id`, `numero`, `capacidade`, `status`, `ativo` | Mesa física; status usados: `LIVRE` e `OCUPADA` |
| `comandas` | `id`, `mesa_id`, `data_abertura`, `data_fechamento`, `status` | Comanda por mesa; status usado: `ABERTA` |
| `pedidos` | `id`, `comanda_id`, `status` | Lote de itens; status usados: `PENDENTE`, `RECEBIDO`, `EM_PREPARO`, `PRONTO`, `ENTREGUE` |
| `itens_comanda` | `id`, `pedido_id`, `comanda_id`, `produto_id`, `quantidade`, `quantidade_paga`, `preco_unitario`, `valor_pago` | Itens e valores da comanda/pedido |

Relações: `mesa 1:N comanda`, `comanda 1:N pedido`, `comanda 1:N item_comanda`, `pedido 1:N item_comanda`, `produto 1:N item_comanda` e `produto 1:1/N estoque`.

## API HTTP

Base local: `http://localhost:3000`. As requisições com corpo usam JSON.

### Saúde e catálogo

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/` | Mensagem de funcionamento do back-end |
| GET | `/teste-banco` | Executa `SELECT 1` para testar o banco |
| GET | `/produtos` | Lista todos os produtos |
| GET | `/estoque` | Lista produto, categoria e quantidade em estoque |

### Fornecedores

| Método | Rota | Corpo/consulta | Descrição |
| --- | --- | --- | --- |
| GET | `/fornecedores?busca=texto` | `busca` opcional | Pesquisa por nome ou documento, ordenada por nome |
| POST | `/fornecedores` | `documento`, `nome`, `endereco`, `bairro`, `cidade`, `telefone` | Cria fornecedor |

### Mesas

| Método | Rota | Corpo | Descrição |
| --- | --- | --- | --- |
| GET | `/mesas` | — | Lista mesas ativas |
| POST | `/mesas` | `numero`, `capacidade` | Cria mesa `LIVRE` e ativa |
| PUT | `/mesas/:id` | `numero`, `capacidade` | Atualiza mesa ativa |
| PATCH | `/mesas/:id/desativar` | — | Desativa mesa por exclusão lógica |
| POST | `/mesas/:id/abrir` | — | Abre mesa e cria comanda com transação |
| GET | `/mesas/:id/comanda` | — | Busca a última comanda aberta da mesa |
| GET | `/mesas/:id/comanda/itens` | — | Lista itens da comanda aberta da mesa |
| POST | `/mesas/:id/comanda/itens` | `produto_id`, `quantidade` | Rota legada: adiciona diretamente e baixa estoque controlado |

### Comandas e pedidos

| Método | Rota | Corpo | Descrição |
| --- | --- | --- | --- |
| POST | `/comandas` | `mesa_id` | Cria comanda ou retorna a aberta; ocupa a mesa |
| POST | `/comandas/:comanda_id/itens` | `produto_id`, `quantidade` | Cria/reutiliza pedido pendente e adiciona/soma item |
| GET | `/comandas/:comanda_id/itens` | — | Lista itens de pedidos já confirmados/operacionais |
| GET | `/comandas/:comanda_id/pedido-pendente` | — | Retorna o último pedido pendente |
| PUT | `/comandas/:comanda_id/pedido/:pedido_id/confirmar` | — | Valida itens e muda pedido de `PENDENTE` para `RECEBIDO` |

Principais respostas de erro: `400` para validações/regras, `404` para recurso inexistente, `409` para duplicidade de fornecedor ou mesa e `500` para falhas internas/banco.

## Instalação e execução

### Pré-requisitos

- Node.js e npm;
- MySQL em execução;
- banco de dados com as tabelas e colunas descritas em [Modelo de dados inferido](#modelo-de-dados-inferido).

### Configuração

Crie `DonCabron/BackEnd/.env` localmente (ele não é versionado) com:

```env
DB_HOST=localhost
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=nome_do_banco
DB_PORT=3306
```

Instale as dependências e inicie o servidor:

```bash
cd DonCabron/BackEnd
npm install
node server.js
```

Abra `http://localhost:3000/DonCabron/index/index.html`. Para registrar mesas, use `http://localhost:3000/DonCabron/index/mesas.html`; para abrir um pedido diretamente, use `pedidos.html?mesa=<id>`.

> O `package.json` atual não possui script `start`; por isso o comando de execução é `node server.js`.

---

Documentação gerada a partir do código-fonte e dos documentos locais do projeto.
