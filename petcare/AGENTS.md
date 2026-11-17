# AGENTS.md — PetCare

> Guia técnico permanente do projeto. Leia este arquivo antes de qualquer tarefa e siga-o à risca. Em caso de conflito entre um pedido e este arquivo, avise antes de agir.

## 1. Visão geral e escopo

**PetCare** é um sistema web de gestão de saúde e vacinas para pets (Projeto Integrador, em dupla). O tutor cadastra o pet e o histórico de cuidados; o sistema gera linha do tempo clínica, gráficos de peso, alertas de vencimento no painel e um **Plano de Cuidados** cruzando o pet com um catálogo (vacinas, vermífugos, antipulgas, tipos de ração). O mesmo catálogo alimenta um **Guia rápido** público.

**Tipo de solução:** aplicação web responsiva (SPA + API REST), cliente-servidor em 3 camadas. Não é SaaS comercial (sem multi-tenant, cobrança ou planos).

### Perfis de acesso

| Perfil | Acessa |
|---|---|
| `visitante` | Home e Guia de Cuidados públicos; cadastro e login |
| `user` (tutor) | CRUD dos **próprios** pets; registros de cuidado, pesos e consultas; linha do tempo, gráfico de peso, Plano de Cuidados; notificações próprias |
| `admin` | CRUD do catálogo (produtos, protocolos, tipos de ração, raças, estágios de vida); `POST /api/admin/alerts/run` com `asOf`; listar usuários. **Não acessa pets dos tutores** |

### Regra de conteúdo (inegociável)

- O sistema é **informativo** e não substitui o médico-veterinário.
- **Nunca calcular, armazenar nem exibir doses de medicamentos.**
- Todo item do catálogo (`care_protocols`, `food_types`) exige `source_reference` preenchido.
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
- Variáveis em `.env` (nunca no Git); modelo em `.env.example`: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRES_IN=1h`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ALERT_CRON=0 6 * * *`, `ALERT_DAYS_BEFORE=7,1`, `ALERT_OVERDUE_REPEAT_DAYS=7`.
- Primeiro admin: `npm run create-admin` (usa `ADMIN_EMAIL`/`ADMIN_PASSWORD`). Nunca criar admin no `seed.sql`.

## 3. Estrutura de pastas e banco de dados

```
petcare/
├── .github/pull_request_template.md
├── backend/src/
│   ├── main.ts · app.module.ts
│   ├── common/   (guards, decorators, filters, clock)
│   ├── config/   (env, alerts, care-rules)
│   ├── auth/ · users/ · pets/
│   ├── species/ · breeds/ · life-stages/
│   ├── care-products/ · care-protocols/ · food-types/ · care-guide/
│   ├── care-records/ · weight-records/ · vet-visits/ · timeline/
│   └── care-plan/ · notifications/ · alerts/ · admin/
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

### 12 tabelas, 4 domínios (snake_case, plural, inglês)

| Domínio | Tabela | Colunas principais |
|---|---|---|
| Usuários e pets | `users` | id, name, email (único), password_hash, role (`admin`/`user`), created_at |
| | `pets` | id, user_id, species_id, breed_id (opcional), name, sex, birth_date, birth_date_is_estimated, size_category (`small`/`medium`/`large`/`giant`, nulo p/ gatos), neutered, special_need, microchip_code, photo_path, notes |
| Catálogo (admin) | `species` | id, code (`dog`/`cat`), name |
| | `breeds` | id, species_id, name, size_category |
| | `life_stages` | id, species_id, size_category (nulo = qualquer), name, min_age_months, max_age_months |
| | `care_products` | id, type (`vaccine`/`dewormer`/`flea_tick`/`medication`), name, description, notes, is_active |
| | `care_protocols` | id, product_id, species_id, min_age_days, max_age_days, is_core, series_doses, series_interval_days, booster_interval_days, notes, **source_reference** |
| | `food_types` | id, species_id, life_stage_id, size_category, special_need, name, description, feeding_notes, **source_reference** |
| Histórico do pet | `care_records` | id, pet_id, product_id, applied_on (`DATE`), dose_number, next_due_on (`DATE`), batch_number, veterinarian_name, notes |
| | `weight_records` | id, pet_id, weighed_on (`DATE`), weight_kg (`DECIMAL(5,2)`), notes |
| | `vet_visits` | id, pet_id, visited_on (`DATE`), reason, notes |
| Alertas | `notifications` | id, user_id, pet_id, care_record_id (opcional), kind (`upcoming`/`due_today`/`overdue`), title, message, due_on (`DATE`), read_at, **dedupe_key (UNIQUE)** |

- Dados do tutor com `ON DELETE CASCADE`. Produto do catálogo em uso é desativado (`is_active = false`), nunca removido.
- Índices: `care_records(pet_id, applied_on)`, `care_records(next_due_on)`, `weight_records(pet_id, weighed_on)`, `notifications(user_id, read_at)`.
- Catálogo é separado dos registros: corrigir um protocolo não reescreve o histórico de ninguém.

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
- Plano de Cuidados (`GET /api/pets/:id/care-plan`): cruza espécie, idade, porte e histórico com `care_protocols`; ordena atrasados, hoje, em breve, pendentes, em dia (`is_core` antes dos opcionais). Ração por pontuação: +3 estágio de vida, +2 porte (+1 se vale para qualquer), +2 `special_need`; sempre **tipos** de ração, nunca marcas.
- Produtos de uma espécie nunca são cruzados com outra (alguns produtos de cães são tóxicos para gatos).

### Job diário de alertas

- `@nestjs/schedule`, horário em `ALERT_CRON` (padrão `0 6 * * *`).
- Gera notificações **7 dias antes, 1 dia antes, no dia e atrasado** (1 dia depois e a cada 7 dias, com máximo configurável), apenas para registros não substituídos por aplicação mais nova do mesmo produto.
- **Idempotente:** `dedupe_key` única (`petId:productId:dueOn:kind:n`). Rodar duas vezes no mesmo dia não duplica.
- **Não usa cache:** consulta o banco para trabalhar com dados atuais.
- Execução manual para demonstração: `POST /api/admin/alerts/run?asOf=YYYY-MM-DD` (apenas `admin`).

### Cache

- `@nestjs/cache-manager` **em memória**, apenas para o **catálogo público**: species, breeds, care-products, care-protocols, food-types e care-guide. TTL de alguns minutos.
- **Invalidação imediata** ao criar, editar ou remover item do catálogo (rotas admin).
- Rotas públicas enviam `Cache-Control` e `ETag`.
- **Nunca cachear dados dos tutores:** pets, care_records, weight_records, vet_visits, timeline, care-plan e notifications. Sem Redis.

## 6. Segurança

- **Autenticação:** JWT **HS256**, expiração **1h**, `JWT_SECRET` só no `.env`, claims mínimos (id e papel), enviado em `Authorization: Bearer` e validado por guard em toda rota protegida.
- **Autorização:** RBAC no backend (`RolesGuard` + `@Roles('admin')`). Guards de rota no Vue servem só à UX.
- **Posse do pet:** toda consulta filtra por `user_id` (`WHERE id = :id AND user_id = :userId`). Recurso de outro tutor responde **`404`**, nunca `403`.
- **Senhas:** hash **bcrypt** (com salt), mínimo de 8 caracteres. `password_hash` nunca sai em resposta (usar DTOs de resposta).
- **Entrada:** `class-validator` com `ValidationPipe({ whitelist: true })`. Datas de aplicação e de nascimento não podem ser futuras; peso entre 0,05 e 150 kg; limites de tamanho de texto.
- **API:** `helmet`, CORS restrito a `http://localhost:3000`, `@nestjs/throttler` no login, ORM com parâmetros (sem SQL por concatenação).
- **Frontend:** nunca usar `v-html` com texto de usuário.
- **Segredos e privacidade:** `.env` fora do Git; sem token, senha ou e-mail completo nos logs; coleta mínima (nome e e-mail); exclusão de conta remove os dados em cascata.
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
7. **Nunca inventar dados veterinários:** protocolos, intervalos, idades e tipos de ração só entram com `source_reference`. Se não houver fonte, sinalizar e deixar pendente.
8. **Nunca criar dependências pagas** nem usar serviços pagos na infraestrutura.
9. Regras de data, plano e alertas: funções puras, `ClockService`, testes Jest junto com o código.
10. Explicar cada mudança em português, de forma que os dois integrantes consigam defendê-la na banca. Se o código não puder ser explicado, simplificar.
11. Antes de concluir: lint, testes e conferência das convenções da seção 4. Se uma decisão mudar o escopo ou as regras, registrar em `docs/decisions.md` e atualizar este arquivo.