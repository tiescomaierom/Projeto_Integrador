# Decisões do projeto — PetCare

Registro das decisões que mudam escopo, arquitetura ou regras de negócio (`AGENTS.md` §7, item 11). Cada decisão traz contexto, escolha, alternativas descartadas (quando houve) e consequências. Decisões novas entram no fim. Uma decisão substituída é marcada como "Substituída por D-0XX", nunca apagada.

---

## D-001 · Multi-tenant por clínica, identificada por slug na URL
- **Data:** 2026-11-18 · **Status:** Aceita
- **Contexto:** orientação do professor para evoluir o PetCare de um sistema focado no tutor para uma arquitetura voltada a clínicas veterinárias, ainda sem cobrança nem planos.
- **Decisão:** cada clínica tem `slug` único e é acessada em `/c/:clinicSlug` (dados públicos e Guia de Cuidados). Isolamento total por `clinic_id`: nenhuma clínica enxerga tutores, pets, registros clínicos ou catálogo de outra.
- **Consequências:** nova tabela `clinics` (total de 13 tabelas); `clinic_id` nas tabelas de tenant; FKs compostas; toda query filtra `clinic_id`; recurso de outra clínica responde `404`; o `clinicId` vem do JWT ou do slug, nunca do cliente.

## D-002 · Três papéis: `user`, `admin` e `dev`
- **Data:** 2026-11-18 · **Status:** Aceita
- **Contexto:** o fluxo passa a ser operado pela clínica, e não mais pelo tutor.
- **Decisão:** `user` (tutor) consulta os próprios pets em somente leitura. `admin` (equipe da clínica) gerencia tutores, pets, registros e o catálogo da própria clínica. `dev` (André e Francesco) administra a plataforma: clínicas, primeiro `admin`, clínica-modelo e `species`.
- **Auto-cadastro removido:** o tutor não se cadastra. O `admin` cria a conta e repassa uma **senha provisória**, mostrada uma única vez, com troca obrigatória no primeiro login. O `dev` faz o mesmo com o primeiro `admin` de cada clínica.
- **Consequências:** `users.role` passa a `dev`/`admin`/`user`; `register` removido; `must_change_password` e o guard `PASSWORD_CHANGE_REQUIRED`; redefinição de senha pelo `admin` (tutores) e pelo `dev` (`admin`s); sem "esqueci minha senha" automático.

## D-003 · Catálogo exclusivo por clínica (incluindo raças e estágios de vida)
- **Data:** 2026-11-18 · **Status:** Aceita
- **Contexto:** o `admin` convive com os médicos-veterinários e é quem conhece o catálogo.
- **Decisão:** `care_products`, `care_protocols`, `food_types`, `breeds` e `life_stages` pertencem a uma clínica (`clinic_id`). O `admin` gerencia o catálogo da própria clínica; o `dev` pode inserir e editar itens de uma clínica específica quando ela pedir. `species` continua global, mantida só pelo `dev`. `source_reference` segue obrigatório e não há cálculo nem exibição de doses.
- **Alternativa descartada:** raças e estágios globais editados pelo `admin`, porque uma edição afetaria todas as clínicas.
- **Consequências:** cache por clínica (`catalog:{clinicId}:{resource}`); o Plano de Cuidados e a ração usam só o catálogo da clínica do pet, sem fallback.

## D-004 · E-mail único por clínica
- **Data:** 2026-11-18 · **Status:** Aceita
- **Contexto:** cada clínica deve controlar o login dos seus usuários.
- **Decisão:** unicidade por `(clinic_scope, email)`, em que `clinic_scope = IFNULL(clinic_id, 0)` é uma coluna gerada, para que o `dev` (sem clínica) também tenha e-mail único. O login recebe `clinicSlug`; o `dev` entra por `/dev/login`.
- **Alternativa descartada:** e-mail único global (mais simples, mas tira da clínica o controle do próprio login).
- **Consequências:** o mesmo e-mail pode existir em clínicas diferentes, como contas independentes; falhas de login respondem um `401` genérico; throttler por IP, e-mail e slug.

## D-005 · O `dev` não acessa dados clínicos e não há auditoria agora
- **Data:** 2026-11-18 · **Status:** Aceita
- **Decisão:** o `dev` não acessa pets nem registros clínicos, só plataforma e catálogo. Não haverá tabela `audit_logs` nesta versão. O "monitoramento" é `GET /api/dev/overview`, com a lista de clínicas, contagens e ativar/desativar.
- **Consequências:** o `dev` não tem rotas de pets, registros, pesos, consultas nem notificações.

## D-006 · Catálogo-base por clínica-modelo, clonado na criação
- **Data:** 2026-11-18 · **Status:** Aceita
- **Contexto:** uma clínica nova não deve começar vazia, e o catálogo continua exclusivo.
- **Decisão:** existe uma clínica-modelo (`is_template = true`, slug `catalogo-base`) com os itens mais comuns, todos com `source_reference`, vindos da planilha de curadoria. `POST /api/dev/clinics` com `cloneBaseCatalog` (padrão `true`) copia o catálogo em uma transação (`CatalogCloneService`). Depois do clone, a clínica é independente.
- **Alternativas descartadas:** tabelas `base_*` separadas (duplicam o DDL) e leitura do catálogo-base em tempo de execução como fallback (quebra o isolamento).
- **Consequências:** o `seed.sql` traz só `species` e a clínica-modelo; a clínica demo é criada pelo painel do `dev`; a clínica-modelo não tem usuários, responde `404` nas rotas públicas e é ignorada pelo job.

## D-007 · `source_reference` obrigatório em `life_stages`
- **Data:** 2026-11-18 · **Status:** Aceita
- **Contexto:** as faixas de idade são dado veterinário (`AGENTS.md` §7, item 7) e agora o `admin` passa a editá-las.
- **Decisão:** `life_stages.source_reference NOT NULL`.

## D-008 · Alerta manual só para o `dev`
- **Data:** 2026-11-18 · **Status:** Aceita
- **Decisão:** `POST /api/dev/alerts/run?asOf=YYYY-MM-DD&clinicId=` (o `clinicId` é opcional; sem ele, roda em todas as clínicas ativas). Substitui `POST /api/admin/alerts/run`. O job diário percorre apenas clínicas ativas e notifica só os tutores.

## D-009 · Cada conta pertence a uma única clínica
- **Data:** 2026-11-18 · **Status:** Aceita
- **Decisão:** `users.clinic_id` é único por conta (nulo só para `dev`). Quem atende em duas clínicas tem duas contas independentes.

## D-010 · Clínica é desativada, nunca excluída
- **Data:** 2026-11-18 · **Status:** Aceita
- **Decisão:** `is_active = false` responde `404` nas rotas públicas e bloqueia o login dos usuários da clínica. FKs para `clinics` usam `ON DELETE RESTRICT`. A strategy JWT confere `users.is_active` e `clinics.is_active` a cada requisição, para o bloqueio valer na hora.

---

## Fora do escopo (por enquanto)
- Cobrança e planos comerciais.
- Subdomínio por clínica.
- Convite por e-mail e "esqueci minha senha" automático (exigem envio de e-mail).
- Mesma conta vinculada a várias clínicas.
- Auditoria (`audit_logs`).
- Painel de cuidados atrasados para o `admin`.
- Sincronização do catálogo-base com clínicas existentes e importação do catálogo-base em clínica já criada.

## Pontos em aberto
- Confirmar a versão do MySQL no alwaysdata: o `CHECK` de papel e `clinic_id` exige 8.0.16 ou superior. Se não houver, a regra fica só no service.
