e agora?

# Portal DSR

## Sobre o projeto

O Portal DSR é uma plataforma interna desenvolvida para apoiar a consulta, a visualização e a análise de informações relacionadas às ações de saneamento rural e pequenos municípios.

O sistema reúne indicadores, informações financeiras, instrumentos de repasse e dados territoriais em um ambiente integrado, apoiando atividades institucionais de acompanhamento, análise e produção de informações.

## Funcionalidades

### Implementadas

- Página inicial para acesso aos módulos.
- **Carteira DSR**:
  - filtros combináveis;
  - indicadores quantitativos e financeiros;
  - gráficos por UF, ação, tipo de instrumento, fase e situação da contratação;
  - visualização geográfica;
  - tabela detalhada com paginação;
  - exportação de gráficos em PNG e dados em XLSX.
- **Mapa Interativo**:
  - camadas territoriais e geoespaciais;
  - filtros por UF, município, localidade, proposta e instrumento;
  - filtros por recortes territoriais;
  - legendas dinâmicas e consulta por pop-ups;
  - reenquadramento automático conforme os filtros.
- Manual do usuário integrado ao portal.
- Documentação automática da API por Swagger e ReDoc.

As rotas do frontend estão definidas em `frontend/src/router.jsx`:

- `/`
- `/carteira-dsr`
- `/mapa`
- `/manual`

### Em desenvolvimento

Os seguintes módulos estão apresentados como “Em breve” em `frontend/src/pages/home/Home.jsx`:

- Pesquisa Instrumento.
- Saneamento Rural.

## Tecnologias utilizadas

### Frontend

- React 19.
- Vite 8.
- React Router.
- TanStack React Query.
- Axios.
- Tailwind CSS e CSS Modules.
- Apache ECharts.
- MapLibre GL JS.
- ExcelJS e FileSaver.
- Lucide React.

Referência: `frontend/package.json`.

### Backend

- Python.
- FastAPI.
- Uvicorn.
- SQLAlchemy assíncrono.
- Pydantic e Pydantic Settings.
- asyncpg.
- jenkspy.
- PostgreSQL com recursos PostGIS.

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

- Node.js `^20.19.0` ou `>=22.12.0`, conforme `frontend/package-lock.json`.
- npm.
- Python 3.10 ou superior. Versão institucional homologada: **confirmar**.
- Acesso a uma instância PostgreSQL com PostGIS.
- Estruturas de banco consultadas pela aplicação previamente disponíveis.

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

- API: `http://localhost:8000`
- Verificação de funcionamento: `http://localhost:8000/health`
- Swagger: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

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

Crie o arquivo `backend/.env` sem incluir valores sensíveis no controle de versão:

```env
DB_HOST=
DB_PORT=5432
DB_USER=
DB_PASSWORD=
DB_NAME=
APP_ENV=development
APP_TITLE=
APP_VERSION=
```

As configurações são carregadas em `backend/app/core/config.py`.

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

Para validar localmente o resultado:

```bash
npm run preview
```

Os comandos estão definidos em `frontend/package.json`.

A estratégia de execução do backend e de publicação do frontend em produção deve ser definida conforme a infraestrutura institucional.

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

Convenção de branches, processo de revisão e política de integração: **confirmar**.

Não foram identificados testes automatizados ou pipeline de integração contínua no projeto analisado.

## Pontos de atenção


### Configuração para produção

- Partes do módulo do mapa utilizam URLs locais fixas em `frontend/src/api/mapa.js`.
- O CORS está configurado para endereços locais em `backend/app/main.py`.
- `APP_ENV` não deve permanecer como `development` em produção, pois essa configuração habilita logs das consultas SQL.
- Não foram identificadas configurações de implantação, containers ou servidor de aplicação para produção.
- A infraestrutura de hospedagem, os domínios e a estratégia de publicação devem ser **confirmados**.

### Banco de dados

- A API consulta diretamente tabelas e views existentes no PostgreSQL/PostGIS.
- Não foram identificados models ORM, migrações ou rotinas de criação dessas estruturas.
- As permissões e estruturas necessárias devem ser previamente provisionadas pela equipe responsável pelo banco.
- A rotina e a periodicidade de atualização das bases devem ser **confirmadas**.

### Segurança e acesso

- Não foi identificado mecanismo de autenticação ou autorização no código analisado.
- O modelo de acesso ao ambiente interno deve ser **confirmado**.
- Arquivos `.env`, credenciais e endereços internos não devem ser versionados ou publicados.
- Dados exportados devem seguir as políticas institucionais de segurança da informação.

### Serviços externos

O mapa-base utiliza um serviço de imagens da Esri em `frontend/src/components/mapa/MapaSection.jsx`. A disponibilidade pela rede institucional e as condições de uso desse serviço devem ser **confirmadas**.

### Qualidade e manutenção

- Não foram identificados testes automatizados.
- Não foi identificado pipeline de CI/CD.
- A estratégia de testes, homologação, monitoramento e registro de erros deve ser **confirmada**.

## Autores

**Ministério das Cidades**  
Departamento de Saneamento Rural e de Pequenos Municípios

Responsáveis técnicos e contatos institucionais: **confirmar**.