# Portal DSR

## Sobre o projeto

O Painel DSR é uma ferramenta interna do Departamento de Saneamento Rural e de Pequenos Municípios, pensada para atender exclusivamente às demandas dos técnicos lotados no Departamento, especialmente no tocante às particularidades e especificadades das atividades do DSR. O painel reúne dados informações estratégicas para o DSR em um ambiente único de consulta.

## Funcionalidades

### Implementadas

* Página inicial para acesso aos módulos.
* **Carteira DSR**:

  * filtros combináveis;
  * informações quantitativas e financeiras dos instrumentos de repasse;
  * gráficos por UF, ação, tipo de instrumento, fase e situação da contratação;
  * visualização geográfica;
  * tabela detalhada com paginação;
  * exportação de gráficos em PNG e dados em XLSX.
* **Mapa Interativo**:

  * camadas territoriais e geoespaciais;
  * filtros por UF, município, localidade, proposta e instrumento;
  * filtros por recortes territoriais;
  * legendas dinâmicas e consulta por pop-ups;
  * reenquadramento automático conforme os filtros.
* Manual do usuário integrado ao portal.
* Documentação automática da API disponível em `/docs` e `/redoc`.

As rotas do frontend estão definidas em `frontend/src/router.jsx`:

* `/`
* `/carteira-dsr`
* `/mapa`
* `/manual`

### Em desenvolvimento

Os seguintes módulos estão apresentados como “Em breve” em `frontend/src/pages/home/Home.jsx`:

* Pesquisa Instrumento.
* Saneamento Rural.
* Conferência de informações dos Instrumentos de Repasse

## Tecnologias utilizadas

### Frontend

* React 19.
* Vite 8.
* React Router.
* TanStack React Query.
* Axios.
* Tailwind CSS e CSS Modules.
* Apache ECharts.
* MapLibre GL JS.
* ExcelJS e FileSaver.
* Lucide React.

Referência: `frontend/package.json`.

### Backend

* Python.
* FastAPI.
* Uvicorn.
* SQLAlchemy assíncrono.
* Pydantic e Pydantic Settings.
* asyncpg.
* jenkspy.
* PostgreSQL com recursos PostGIS.

Referência: `backend/requirements.txt` e `backend/app/`.

## Estrutura do projeto

```text
.
├── frontend/
│   ├── public/             # Arquivos públicos e dados geográficos estáticos
│   ├── src/
│   │   ├── api/            # Comunicação com a API
│   │   ├── assets/         # Imagens e vídeos
│   │   ├── components/     # Componentes da interface
│   │   ├── context/        # Contextos e estados de filtros
│   │   ├── hooks/          # Consultas e integração com React Query
│   │   ├── pages/          # Páginas e manual do usuário
│   │   └── utils/          # Formatação e exportação de dados
│   ├── package.json
│   └── vite.config.js
└── backend/
    ├── app/
    │   ├── api/            # Endpoints da Carteira DSR e do mapa
    │   ├── core/           # Configuração e conexão com o banco
    │   ├── schemas/        # Contratos de entrada e resposta
    │   └── main.py         # Inicialização da API
    └── requirements.txt
```

## Como executar localmente

### Pré-requisitos

* Node.js `^20.19.0` ou `>=22.12.0`, conforme `frontend/package-lock.json`.
* npm.
* Python 3.10 ou superior.
* Acesso a uma instância PostgreSQL com PostGIS.
* Estruturas de banco consultadas pela aplicação previamente disponíveis no ambiente local ou institucional.

### Backend

A partir da raiz do projeto:

```bash
cd backend
python -m venv venv
```

No PowerShell, ative o ambiente virtual:

```powershell
.\venv\Scripts\Activate.ps1
```

Instale as dependências e inicie a API:

```bash
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Recursos disponíveis durante o desenvolvimento:

* API: `http://localhost:8000`
* Verificação de funcionamento: `http://localhost:8000/health`
* Swagger: `http://localhost:8000/docs`
* ReDoc: `http://localhost:8000/redoc`

Referências: `backend/app/main.py` e `backend/requirements.txt`.

### Frontend

Em outro terminal:

```bash
cd frontend
npm ci
npm run dev
```

O servidor de desenvolvimento utiliza a porta `5173`. As requisições iniciadas por `/api` são encaminhadas para o backend local, conforme `frontend/vite.config.js`.

## Variáveis de ambiente

### Backend

Crie o arquivo `backend/.env` com as configurações locais de acesso ao banco de dados:

```env
DB_HOST=
DB_PORT=5432
DB_USER=
DB_PASSWORD=
DB_NAME=
APP_ENV=development
APP_TITLE=Portal DSR – API
APP_VERSION=1.0.0
```

As configurações são carregadas em `backend/app/core/config.py`.

Arquivos `.env` não devem ser versionados.

### Frontend

A URL-base da API pode ser definida em `frontend/.env.local`:

```env
VITE_API_URL=/api/v1
```

Existe um modelo em `frontend/.env.example`. A variável é utilizada em `frontend/src/api/axios.js`.

## Build de produção

Para validar o código e gerar os arquivos estáticos:

```bash
cd frontend
npm run lint
npm run build
```

A build é gerada em `frontend/dist/`.

Para validar localmente o resultado da build:

```bash
npm run preview
```

Os comandos estão definidos em `frontend/package.json`.

## Ambiente interno

O Portal DSR foi planejado para uso interno no Ministério das Cidades, com execução em uma máquina local da rede institucional. O acesso pelos usuários é realizado por meio do endereço IP disponibilizado internamente.

A aplicação depende de uma base PostgreSQL/PostGIS local, com tabelas e views previamente disponibilizadas no ambiente institucional. As credenciais de acesso devem ser configuradas localmente por meio de arquivo `.env`.

## Fluxo de desenvolvimento

1. Atualizar a branch local antes de iniciar o trabalho.
2. Criar uma branch específica para a alteração.
3. Configurar as variáveis de ambiente localmente.
4. Iniciar o backend e validar o endpoint `/health`.
5. Iniciar o frontend e validar os módulos afetados.
6. Executar antes da integração:

```bash
cd frontend
npm run lint
npm run build
```

7. Registrar commits objetivos, sem incluir arquivos de ambiente, credenciais ou artefatos locais.
8. Submeter as alterações para revisão antes da integração à branch principal.

## Validação e manutenção

A validação inicial do sistema será realizada com a coordenação do setor. Após os ajustes decorrentes do feedback, o portal será disponibilizado aos demais usuários internos.

A manutenção do sistema será realizada pelos responsáveis do projeto, considerando ajustes evolutivos, correções e atualização da documentação conforme necessário.

## Autores

**Ministério das Cidades**
Coordenação de Informação em Saneamento Rural e em Pequenos Municípios

Responsáveis: Giovana Carvalho e Andre Ide