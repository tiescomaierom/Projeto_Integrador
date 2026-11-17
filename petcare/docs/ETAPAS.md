# PetCare: etapas e entregáveis por sprint

Cada etapa corresponde a uma sprint (Trello). Branches no padrão `tipo/card-descrição`, e todo PR é revisado pela outra pessoa da dupla.

## Sprint 1 · 16–22/nov · Base do projeto e acordos da dupla

**Tarefas**

- Criar repositório público, branch `develop` e proteção da `main` (PR + 1 aprovação); adicionar o colaborador.
- Montar o Trello (listas, etiquetas, Sprint 1).
- Configurar ESLint + Prettier.
- Escrever `AGENTS.md`, `CLAUDE.md` (`@AGENTS.md`), README inicial e `docs/decisions.md`.
- Validar Node e Docker nas duas máquinas.

**Entregáveis**

- Repositório configurado, com `pull_request_template.md`.
- Um PR aprovado por cada integrante.
- `node --version` e `docker --version` funcionando.

**Branches:** `chore/1-project-setup`, `docs/2-agents-and-team-agreements`

## Sprint 2 · 23–29/nov · Fluxo de telas, identidade visual e curadoria do catálogo

**Tarefas**

- Desenhar no Excalidraw os 3 fluxos (visitante, tutor, admin).
- Definir paleta, tipografia e `tokens.css`.
- Fazer wireframes: painel, perfil do pet, formulário de cuidado, guia e admin.
- Montar a planilha de curadoria do catálogo com fonte em cada item (um cura cães, o outro gatos, e trocam para revisar).

**Entregáveis**

- `docs/navigation-flow.excalidraw` e `.png`.
- `tokens.css`.
- Planilha do catálogo com `source_reference` em todos os itens.

**Branches:** `docs/6-navigation-flow-and-visual-identity`, `docs/7-catalog-curation`

## Sprint 3 · 30/nov–6/dez · Banco de dados e seed

**Tarefas**

- Escrever `schema.sql` (12 tabelas, FKs, índices, `UNIQUE` em `notifications.dedupe_key` e em `users.email`).
- Escrever `seed.sql` (espécies, raças, estágios, produtos, protocolos, tipos de ração) a partir da planilha.
- Rodar tudo no DBeaver e exportar o diagrama ER.

**Entregáveis**

- `database/schema.sql` e `database/seed.sql`.
- `docs/er-diagram.png`.
- Banco recriável do zero com os dois scripts.

**Branches:** `feature/9-database-schema`, `feature/10-catalog-seed`

## Sprint 4 · 7–13/dez · API base e catálogo público

**Tarefas**

- Criar o NestJS com TypeORM e MySQL, e o `ConfigModule` com validação do `.env`.
- Criar os módulos `species`, `breeds`, `life-stages`, `care-products`, `care-protocols` e `food-types`.
- Implementar `GET /api/care-guide`, o Swagger em `/api/docs`, o cache em memória do catálogo e os cabeçalhos `Cache-Control`/`ETag`.
- Criar o Dockerfile da API, o `compose.yaml` com `TZ=America/Sao_Paulo` e o `Api.http`.

**Entregáveis**

- API no ar via `docker compose up --build`.
- Rotas públicas do catálogo e o Guia rápido.
- Swagger acessível.

**Branches:** `feature/12-api-base-and-catalog`, `feature/13-care-guide-endpoint`

## Sprint 5 · 14–20/dez · Login, papéis e CRUD admin

**Tarefas**

- Implementar `register`, `login` e `me`, com JWT HS256 (1h) e bcrypt.
- Implementar `RolesGuard`, `npm run create-admin`, `helmet`, `throttler` e `ValidationPipe`.
- Fazer o CRUD admin de produtos, protocolos, tipos de ração, raças e estágios, com invalidação do cache, e `GET /api/admin/users`.

**Entregáveis**

- Autenticação e autorização funcionando.
- Sem token a rota responde 401; token de `user` na rota admin responde 403.

**Branches:** `feature/15-auth-and-roles`, `feature/16-admin-catalog-crud`

## Sprint 6 · 21/dez–3/jan · Frontend base e telas públicas (2 semanas, ritmo leve)

**Tarefas**

- Criar o Vue 3 + TS com router, Pinia e `api-client.ts`.
- Fazer layout responsivo, login e registro, e guards de rota.
- Fazer o Guia de Cuidados público (filtros de espécie, idade e porte) e o painel admin do catálogo.
- Criar o Dockerfile do `web` (nginx) e adicionar o `web` ao `compose.yaml`.

**Entregáveis**

- `localhost:3000` exibindo o guia vindo do banco.
- `user` sem acesso a `/admin`.
- Telas funcionando no modo responsivo.

**Branches:** `feature/18-frontend-base-and-auth`, `feature/19-care-guide-and-admin-screens`

## Sprint 7 · 4–10/jan · Pets e registros de cuidado

**Tarefas**

- Fazer o CRUD de pets com verificação de posse (404 para pet de outro tutor) e o wizard de cadastro.
- Fazer a API de `care_records` com sugestão de `next_due_on` (`next-due-suggestion`).
- Fazer as telas de pets e os formulários de cuidado.
- Validar datas (sem datas futuras).

**Entregáveis**

- Tutor B não acessa o pet do tutor A.
- Registrar a dose 1 sugere a data da dose 2.

**Branches:** `feature/21-pets-crud`, `feature/22-care-records`

## Sprint 8 · 11–17/jan · Linha do tempo, peso e gráficos

**Tarefas**

- Fazer o endpoint `GET /api/pets/:id/timeline`, que reúne cuidados, pesos e consultas por data.
- Fazer as APIs de `weights` e `vet-visits`.
- Criar o gráfico de peso com Chart.js, as abas do perfil do pet e a variação desde a última pesagem.

**Entregáveis**

- Linha do tempo clínica.
- Gráfico com pelo menos 3 pesagens.
- Validação de peso (0,05 a 150 kg).

**Branch:** `feature/24-timeline-and-weights`

## Sprint 9 · 18–24/jan · Alertas e painel de notificações

**Tarefas**

- Criar o `ClockService` e `date-rules.ts` com testes Jest (7 casos obrigatórios).
- Criar o job diário com `@nestjs/schedule`: 7 dias antes, 1 dia antes, no dia e atrasado, com `dedupe_key` única.
- Fazer a API de notificações (`list`, `unread-count`, `read`, `read-all`).
- Fazer o sino com contador e a lista no painel, e `POST /api/admin/alerts/run?asOf=`.

**Entregáveis**

- Simular uma data adiantada gera os alertas corretos.
- Rodar o job duas vezes não duplica notificações.
- Testes de data passando.

**Branches:** `feature/26-date-rules-and-alert-job`, `feature/27-notifications-panel`

## Sprint 10 · 25–31/jan · Plano de Cuidados e recomendações

**Tarefas**

- Implementar o `CarePlanService`: status por protocolo (`not_yet_eligible`, `pending`, `up_to_date`, `due_soon`, `due_today`, `overdue`), próxima data e ordenação.
- Implementar a recomendação de ração por pontuação.
- Fazer `GET /api/pets/:id/care-plan` e a aba “Plano de Cuidados” com o aviso informativo.
- Escrever os testes unitários.

**Entregáveis**

- O plano muda ao alterar a data de nascimento do pet.
- Testes passando.
- `release/1.0.0` aberta como PR para a `main`.

**Branches:** `feature/29-care-plan-engine`, `feature/30-care-plan-screen`, `release/1.0.0`

## Semana de folga · 1–7/fev · Acabamento e entrega

**Tarefas**

- Fazer ajustes de UX e acessibilidade, e revisar a responsividade.
- Completar o README (como rodar e onde a IA foi usada).
- Revisar o projeto (segurança, SQL sem parâmetro, nomenclatura) e conferir o ESLint.
- Testar `docker compose up --build` numa pasta recém-clonada.
- Ensaiar a apresentação e tirar prints finais do Trello.

**Entregáveis**

- Checklist de entrega completo.
- `.env` fora do Git.
- `docs/` com o fluxo de navegação e o diagrama ER.
