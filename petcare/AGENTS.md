# AGENTS.md — PetCare

> Guia técnico permanente do projeto. Leia este arquivo antes de qualquer tarefa e siga-o à risca. Em caso de conflito entre um pedido e este arquivo, avise antes de agir.

## 1. Visão geral e escopo

**PetCare** é um sistema web de gestão de saúde e vacinas para pets, **multi-tenant por clínica veterinária** (Projeto Integrador, em dupla). A clínica (`admin`) cadastra tutores, pets e o histórico de cuidados; o sistema gera linha do tempo clínica, gráficos de peso, alertas de vencimento no painel do tutor e um **Plano de Cuidados** cruzando o pet com o catálogo **da própria clínica** (vacinas, vermífugos, antipulgas, tipos de ração). O mesmo catálogo alimenta o **Guia de Cuidados** público da clínica. O tutor (`user`) apenas consulta.

**Tipo de solução:** aplicação web responsiva (SPA + API REST), cliente-servidor em 3 camadas, multi-tenant por clínica (isolamento por `clinic_id`). Não é SaaS comercial: sem cobrança nem planos por enquanto.

### Perfis de acesso

| Perfil | Acessa |
|---|---|
| `visitante` | `/c/:clinicSlug` (dados públicos e Guia de Cuidados da clínica) e login. **Não há auto-cadastro** |
| `user` (tutor) | **Somente leitura** dos **próprios** pets, na sua clínica: dados, histórico, linha do tempo, gráfico de peso, Plano de Cuidados; notificações próprias. A conta é criada pelo `admin` da clínica |
| `admin` (equipe da clínica) | Dados da **própria** clínica: CRUD de tutores, pets, registros de cuidado, pesos e consultas; catálogo exclusivo (produtos, protocolos, tipos de ração, raças, estágios de vida); redefinir senha de tutores |
| `dev` (super admin: André e Francesco) | Plataforma: CRUD de clínicas; cria o primeiro `admin` de cada clínica; mantém a clínica-modelo (catálogo-base) e `species`; edita o catálogo de uma clínica específica quando ela pedir; `POST /api/dev/alerts/run`; `GET /api/dev/overview`. **Não acessa pets nem registros clínicos** |

### Multi-tenant (clínicas)

- Cada clínica tem `slug` único (kebab-case, minúsculo, imutável) e é acessada em `/c/:clinicSlug`. Slugs reservados: `admin`, `dev`, `api`, `login`, `c`, `guia`, `catalogo-base`.
- **Isolamento total por `clinic_id`:** nenhuma clínica enxerga tutores, pets, registros clínicos ou catálogo de outra.
- O `clinicId` vem **sempre do JWT** (ou do slug, nas rotas públicas), nunca de body, query ou params. Única exceção: rotas `/api/dev/clinics/:clinicId/...`, restritas ao `dev`.
- Recurso de outra clínica responde **`404`**, nunca `403`.
- Clínica desativada (`is_active = false`) responde `404` nas rotas públicas e bloqueia o login dos seus usuários. Clínica nunca é excluída.
- **Catálogo-base:** existe uma clínica-modelo (`is_template = true`, slug `catalogo-base`), mantida pelo `dev` e clonada na criação de cada clínica (ver §3).

### Regra de conteúdo (inegociável)

- O sistema é **informativo** e não substitui o médico-veterinário.
- **Nunca calcular, armazenar nem exibir doses de medicamentos.**
- Todo item do catálogo (`care_protocols`, `food_types`, `life_stages`) exige `source_reference` preenchido, inclusive no catálogo-base e nos itens inseridos pelo `dev` ou pelo `admin`.
- Cada clínica usa só o próprio catálogo. Nunca usar item de outra clínica nem da clínica-modelo em tempo de execução.
- Telas de plano e de guia exibem aviso informativo visível.

## 2. Stack e infraestrutura

| Camada | Tecnologias |
|---|---|
| Frontend (`frontend/`) | Vue 3 + TypeScript, Vite, Vue Router, Pinia, Chart.js (`vue-chartjs`), date-fns |
| Backend (`backend/`) | NestJS (TypeScript), TypeORM, JWT + bcrypt, `@nestjs/schedule`, `@nestjs/cache-manager`, `@nestjs/swagger`, `class-validator`, date-fns |
| Banco | MySQL (alwaysdata, plano gratuito). Esquema em `database/schema.sql`, dados em `database/seed.sql`. `synchronize: false` |
| Infra | Docker Compose com `api` (porta 8080, `TZ=America/Sao_Paulo`) e `web` (porta 3000, nginx). Sem container de banco |
| Qualidade | ESLint, Prettier, Jest (regras de data e de plano) |

- Custo de infraestrutura: **zero**. Não adicionar serviço pago nem dependência que exija assinatura.
- Subir tudo: `docker compose up --build` → site em `http://localhost:3000`, API em `http://localhost:8080`, Swagger em `/api/docs`.
- `VITE_API_URL=http://localhost:8080` (build arg do `web`); o navegador chama a API, não o container.
- Variáveis em `.env` (nunca no Git); modelo em `.env.example`: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRES_IN=1h`, `DEV_EMAIL`, `DEV_PASSWORD`, `ALERT_CRON=0 6 * * *`, `ALERT_DAYS_BEFORE=7,1`, `ALERT_OVERDUE_REPEAT_DAYS=7`.
- Primeiro `dev`: `npm run create-dev` (usa `DEV_EMAIL`/`DEV_PASSWORD`; nasce com `must_change_password = false`). Os `admin`s de cada clínica são criados pelo `dev` via API. Nunca criar `dev`, `admin` ou tutor no `seed.sql`.

## 3. Estrutura de pastas e banco de dados

```
petcare/
├── .github/pull_request_template.md
├── backend/src/
│   ├── main.ts · app.module.ts
│   ├── common/   (guards, decorators, filters, clock, tenant)
│   ├── config/   (env, alerts, care-rules)
│   ├── auth/ · users/ · clinics/ · pets/
│   ├── species/ · breeds/ · life-stages/
│   ├── care-products/ · care-protocols/ · food-types/ · care-guide/
│   ├── care-records/ · weight-records/ · vet-visits/ · timeline/
│   └── care-plan/ · notifications/ · alerts/ · admin/ · dev/
├── frontend/src/
│   ├── main.ts · App.vue
│   ├── assets/styles/ (tokens.css, base.css)
│   ├── components/ (ui/, pets/, care/, charts/)
│   └── composables/ · router/ · services/ · stores/ · types/ · views/
├── database/ (schema.sql, seed.sql)
├── docs/ (navigation-flow.excalidraw, navigation-flow.png, er-diagram.png, decisions.md)
├── AGENTS.md · CLAUDE.md (contém só `@AGENTS.md`) · README.md
└── .env · .env.example · .gitignore · compose.yaml
```

- Organização **modular por domínio**. Cada módulo do Nest: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`, `entities/`. Regras de negócio em arquivos `*.rules.ts` (funções puras, sem acesso ao banco) com testes.
- `common/tenant/` concentra o decorator `@CurrentClinic()` e os guards de isolamento; `clinics/` inclui o `CatalogCloneService`. Rotas do frontend: `/c/:clinicSlug`, `/c/:clinicSlug/guia`, `/c/:clinicSlug/login`, `/trocar-senha`, `/dev/login`, `/admin/*`, `/dev/*`.

### 13 tabelas, 5 domínios (snake_case, plural, inglês)

| Domínio | Tabela | Colunas principais |
|---|---|---|
| Plataforma | `clinics` | id, slug (único), name, description, phone, email, address_line, city, state, is_template, is_active, created_at |
| Usuários e pets | `users` | id, clinic_id (nulo só para `dev`), name, email, clinic_scope (coluna gerada), password_hash, role (`dev`/`admin`/`user`), must_change_password, password_changed_at, is_active, created_at. E-mail único **por clínica** |
| | `pets` | id, clinic_id, user_id, species_id, breed_id (opcional), name, sex, birth_date, birth_date_is_estimated, size_category (`small`/`medium`/`large`/`giant`, nulo p/ gatos), neutered, special_need, microchip_code, photo_path, notes |
| Catálogo (por clínica; `species` é global) | `species` | id, code (`dog`/`cat`), name. Global, mantida só pelo `dev` |
| | `breeds` | id, clinic_id, species_id, name, size_category |
| | `life_stages` | id, clinic_id, species_id, size_category (nulo = qualquer), name, min_age_months, max_age_months, **source_reference** |
| | `care_products` | id, clinic_id, type (`vaccine`/`dewormer`/`flea_tick`/`medication`), name, description, notes, is_active |
| | `care_protocols` | id, clinic_id, product_id, species_id, min_age_days, max_age_days, is_core, series_doses, series_interval_days, booster_interval_days, notes, **source_reference** |
| | `food_types` | id, clinic_id, species_id, life_stage_id, size_category, special_need, name, description, feeding_notes, **source_reference** |
| Histórico do pet | `care_records` | id, clinic_id, pet_id, product_id, applied_on (`DATE`), dose_number, next_due_on (`DATE`), batch_number, veterinarian_name, notes |
| | `weight_records` | id, clinic_id, pet_id, weighed_on (`DATE`), weight_kg (`DECIMAL(5,2)`), notes |
| | `vet_visits` | id, clinic_id, pet_id, visited_on (`DATE`), reason, notes |
| Alertas | `notifications` | id, clinic_id, user_id, pet_id, care_record_id (opcional), kind (`upcoming`/`due_today`/`overdue`), title, message, due_on (`DATE`), read_at, **dedupe_key (UNIQUE)** |

- Dados do tutor com `ON DELETE CASCADE` (excluir o tutor remove seus pets e registros). FKs para `clinics` usam `ON DELETE RESTRICT`: clínica é desativada, nunca excluída. Produto do catálogo em uso é desativado (`is_active = false`), nunca removido.
- Isolamento no banco: `UNIQUE (id, clinic_id)` em `users`, `pets`, `breeds`, `life_stages` e `care_products`, e **FKs compostas** `(x_id, clinic_id)` nas tabelas filhas, para o banco recusar vínculo entre clínicas. `CHECK`: `dev` ⇒ `clinic_id` nulo; `admin`/`user` ⇒ `clinic_id` não nulo (exige MySQL ≥ 8.0.16; validar também no service).
- Índices: `care_records(pet_id, applied_on)`, `care_records(next_due_on)`, `weight_records(pet_id, weighed_on)`, `notifications(user_id, read_at)`, `users(clinic_id, role)`, `pets(clinic_id, user_id)`, `care_products(clinic_id, type, is_active)`, `care_protocols(clinic_id, species_id, product_id)`, `food_types(clinic_id, species_id)`. Únicos: `clinics(slug)`, `users(clinic_scope, email)` (com `clinic_scope = IFNULL(clinic_id, 0)`, para o `dev` também ter e-mail único) e `care_products(clinic_id, type, name)`.
- Catálogo é separado dos registros: corrigir um protocolo não reescreve o histórico de ninguém.
- **Catálogo-base:** a única clínica com `is_template = true` (slug `catalogo-base`) não tem usuários, responde `404` nas rotas públicas e é ignorada pelo job. É mantida pelo `dev` e populada pelo `seed.sql`. `POST /api/dev/clinics` com `cloneBaseCatalog` (padrão `true`) executa o `CatalogCloneService`, que copia `breeds`, `life_stages`, `care_products`, `care_protocols` e `food_types` em **uma transação**, remapeando os IDs. Depois do clone a clínica é independente: não há sincronização nem importação em clínica já existente.
- `seed.sql` contém só `species` e a clínica-modelo com o catálogo-base (todos os itens com `source_reference`).

## 4. Convenções de código (obrigatórias)

- **Pastas:** minúsculas, sem espaços (kebab-case se tiver duas palavras: `care-records/`).
- **Arquivos `.vue`:** `PascalCase` (`PetCard.vue`, `DashboardView.vue`).
- **Demais arquivos:** `kebab-case` (`care-plan.service.ts`, `api-client.ts`).
- **Idioma:** todo código (variáveis, funções, classes, endpoints, tabelas, colunas, branches, commits) em **inglês**. Textos de interface e mensagens ao usuário em **português**. Nunca misturar.
- **CSS:** padrão **BEM** em minúsculas (`pet-card__name`, `status-chip--overdue`). Cores, fontes e espaçamentos em variáveis de `tokens.css`.
- **Funções:** sempre **arrow functions** (`const calculateNextDueDate = () => {}`). Métodos de classe do Nest permanecem métodos.
- **TypeScript:** modo estrito, sem `any` sem justificativa.
- **Qualidade:** ESLint (`func-style: expression`, validação de nomes de arquivo) e Prettier. Rodar lint e testes antes de abrir PR.
- **UX:** mobile-first; status nunca só por cor (cor + ícone + texto); estados de carregamento, vazio e erro em toda tela de dados.

## 5. Regras de negócio críticas

### Datas

- Datas de cuidado são `DATE` (sem hora). Trafegar como texto `YYYY-MM-DD`.
- "Hoje" vem **sempre** do `ClockService` (fuso `America/Sao_Paulo`). **Proibido `new Date()` dentro das regras.** Evitar `new Date('YYYY-MM-DD')` (interpreta como UTC).
- Cálculo com `date-fns` em **dias de calendário** (`addDays`, `differenceInCalendarDays`), tratando meses curtos, virada de ano e ano bissexto.
- Regras de data e de plano são funções puras com testes Jest. Casos mínimos: 30/11 + 21 dias = 21/12; 20/12 + 21 dias = 10/01; 01/03/2027 + 365 dias = 29/02/2028; 23:30 em São Paulo ainda é o mesmo dia; idade em meses para nascimento no dia 31; job executado duas vezes não duplica; `applied_on` futuro é recusado.

### Próxima data e status

- Registro com `dose_number < series_doses`: próxima = `applied_on` + `series_interval_days`. Série completa com `booster_interval_days`: próxima = `applied_on` + `booster_interval_days`. Sem reforço: sem próxima data. A data confirmada pelo tutor prevalece sobre a sugerida.
- Status: `not_yet_eligible` (idade < `min_age_days`), `pending` (elegível sem registro), `up_to_date`, `due_soon` (1 a 7 dias), `due_today` (0), `overdue` (passou).
- Plano de Cuidados (`GET /api/pets/:id/care-plan`, acessível ao `admin` da clínica e ao tutor dono do pet): cruza espécie, idade, porte e histórico com `care_protocols`; ordena atrasados, hoje, em breve, pendentes, em dia (`is_core` antes dos opcionais). Ração por pontuação: +3 estágio de vida, +2 porte (+1 se vale para qualquer), +2 `special_need`; sempre **tipos** de ração, nunca marcas.
- O plano usa **apenas** `care_protocols`, `life_stages` e `food_types` da clínica do pet (`clinic_id`), sem fallback para outra clínica nem para a clínica-modelo. Sem protocolos para a espécie, a tela mostra estado vazio; sem estágio de vida para a idade do pet, não recomenda ração.
- Produtos de uma espécie nunca são cruzados com outra (alguns produtos de cães são tóxicos para gatos).

### Job diário de alertas

- `@nestjs/schedule`, horário em `ALERT_CRON` (padrão `0 6 * * *`).
- Percorre apenas clínicas ativas e que não sejam a clínica-modelo. As notificações vão só para os tutores (`user`) da clínica; o `admin` não recebe.
- Gera notificações **7 dias antes, 1 dia antes, no dia e atrasado** (1 dia depois e a cada 7 dias, com máximo configurável), apenas para registros não substituídos por aplicação mais nova do mesmo produto.
- **Idempotente:** `dedupe_key` única (`petId:productId:dueOn:kind:n`). Rodar duas vezes no mesmo dia não duplica.
- **Não usa cache:** consulta o banco para trabalhar com dados atuais.
- Execução manual para demonstração: `POST /api/dev/alerts/run?asOf=YYYY-MM-DD&clinicId=` (apenas `dev`; sem `clinicId`, roda em todas as clínicas ativas).

### Cache

- `@nestjs/cache-manager` **em memória**, apenas para o **catálogo público**: species, breeds, life-stages, care-products, care-protocols, food-types e care-guide. TTL de alguns minutos.
- Chaves **por clínica**: `catalog:{clinicId}:{resource}`. `species` usa chave global (`catalog:global:species`). A resolução slug → clínica também é cacheada. A clínica-modelo não é cacheada (não é pública).
- **Invalidação imediata das chaves da clínica afetada** ao criar, editar ou remover item do catálogo (rotas `admin` e `dev`) e ao editar ou desativar a clínica.
- Rotas públicas enviam `Cache-Control` e `ETag`.
- **Nunca cachear dados dos tutores:** pets, care_records, weight_records, vet_visits, timeline, care-plan e notifications. Sem Redis.

## 6. Segurança

- **Autenticação:** JWT **HS256**, expiração **1h**, `JWT_SECRET` só no `.env`, claims mínimos: `sub` (id), `role`, `clinicId` e `mcp` (troca de senha pendente). Enviado em `Authorization: Bearer` e validado por guard em toda rota protegida. A strategy confere `users.is_active` e `clinics.is_active` no banco a cada requisição, para o bloqueio valer na hora.
- **Login:** `POST /api/auth/login` com `clinicSlug`, e-mail e senha (telas `/c/:clinicSlug/login`). O `dev` entra por `/dev/login`, sem slug, e a rota sem slug só autentica `dev`. Slug inexistente, clínica inativa e senha errada respondem o mesmo `401` genérico.
- **Autorização:** RBAC no backend (`RolesGuard` + `@Roles('dev' | 'admin' | 'user')`). Guards de rota no Vue servem só à UX. O `user` só lê: escrita em dado clínico responde `403`.
- **Isolamento por clínica:** o `clinicId` vem do JWT (ou do slug nas rotas públicas), nunca do cliente; toda query de dado de tenant filtra `clinic_id`; o banco reforça com FKs compostas. Recurso de outra clínica responde **`404`**.
- **Posse do pet:** `WHERE id = :id AND clinic_id = :clinicId` e, para `user`, também `AND user_id = :userId`. Recurso de outra clínica ou de outro tutor responde **`404`**, nunca `403`.
- **Senhas:** hash **bcrypt** (com salt), mínimo de 8 caracteres. `password_hash` nunca sai em resposta (usar DTOs de resposta).
- **Contas e senha provisória:** não há auto-cadastro (`register` removido). Tutores são criados pelo `admin`, e o primeiro `admin` de cada clínica pelo `dev`. A conta nasce com **senha provisória** (12 caracteres, `crypto.randomInt`, sem caracteres ambíguos), exibida **uma única vez** na resposta de criação ou redefinição e nunca logada; só o hash é gravado.
- **Troca obrigatória:** com `must_change_password = true`, só `GET /api/auth/me` e `POST /api/auth/change-password` passam; o resto responde `403 PASSWORD_CHANGE_REQUIRED`. A troca exige senha atual, mínimo de 8 caracteres e senha diferente da atual, e devolve um novo token. Redefinição: `admin` para tutores, `dev` para `admin`s. Não há "esqueci minha senha" automático.
- **Entrada:** `class-validator` com `ValidationPipe({ whitelist: true })`. Datas de aplicação e de nascimento não podem ser futuras; peso entre 0,05 e 150 kg; limites de tamanho de texto.
- **API:** `helmet`, CORS restrito a `http://localhost:3000`, `@nestjs/throttler` no login (por IP + e-mail + slug) e em `change-password`, ORM com parâmetros (sem SQL por concatenação). DTOs de criação de usuário nunca aceitam `role` nem `clinic_id` do cliente.
- **Frontend:** nunca usar `v-html` com texto de usuário.
- **Segredos e privacidade:** `.env` fora do Git; sem token, senha (inclusive a provisória) ou e-mail completo nos logs; coleta mínima (nome e e-mail); a exclusão do tutor é feita pelo `admin` da clínica e remove os dados em cascata.
- **Upload de foto (se implementado):** validar tipo e tamanho, nome aleatório, nunca confiar no nome enviado.

## 7. Gitflow e fluxo de trabalho com IA

### Git

| Branch | Uso | Sai de | Volta para |
|---|---|---|---|
| `main` | Versão entregável. **Só por PR** aprovado pela outra pessoa da dupla | – | – |
| `develop` | Integração | `main` | – |
| `feature/*`, `fix/*` | Uma tarefa | `develop` | `develop` (PR) |
| `release/*` | Fechar uma etapa | `develop` | `main` (PR) e `develop` |
| `hotfix/*` | Correção urgente | `main` | `main` e `develop` |

- **Nome de branch:** `tipo/card-descrição` (ex.: `feature/21-care-record-next-due-date`). Proibido `feature/teste`, `fix/ajustes`.
- **Commits** (Conventional Commits, em inglês): `tipo(escopo): descrição`. Ex.: `feat(care-records): suggest the next due date from the protocol`, `fix(alerts): avoid duplicate notifications when the job runs twice`, `test(care-plan): cover leap year booster dates`. Proibidos: "update", "ajustes", "estrutura inicial".
- Nunca commitar na `main`. PRs pequenos, revisados pela outra pessoa. Rodar `git status` antes de cada commit; se `.env` aparecer, não commitar.

### Como a IA deve atuar

1. **Um pedido por etapa**, no formato: o quê, onde, como, pronto quando. Se faltar algo, perguntar antes.
2. **Propor um plano em passos pequenos antes de alterar qualquer arquivo** e esperar aprovação.
3. **Pedir aprovação manual** para criar/alterar arquivos e rodar comandos.
4. **Nunca acessar, abrir ou pedir** `.env`, senhas, `JWT_SECRET` ou connection strings. A dupla preenche os segredos.
5. **Nunca commitar na `main`** nem fazer `git push --force` em `main`/`develop`.
6. **Nunca apagar** pastas, tabelas, dados ou histórico do Git sem aprovação explícita.
7. **Nunca inventar dados veterinários:** protocolos, intervalos, idades e tipos de ração só entram com `source_reference`. Se não houver fonte, sinalizar e deixar pendente. Vale também para o catálogo-base e para itens inseridos pelo `dev` em uma clínica.
8. **Nunca criar dependências pagas** nem usar serviços pagos na infraestrutura.
9. Regras de data, plano e alertas: funções puras, `ClockService`, testes Jest junto com o código.
10. Explicar cada mudança em português, de forma que os dois integrantes consigam defendê-la na banca. Se o código não puder ser explicado, simplificar.
11. Antes de concluir: lint, testes e conferência das convenções da seção 4. Se uma decisão mudar o escopo ou as regras, registrar em `docs/decisions.md` e atualizar este arquivo.
12. **Isolamento entre clínicas:** nunca escrever query, endpoint ou service de dado de tenant sem filtro de `clinic_id`, nem aceitar `clinicId` vindo do cliente. Toda tarefa que toque dados de tenant inclui teste de isolamento (clínica A não acessa dado da B → `404`).