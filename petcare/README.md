# PetCare — Sistema de Gestão de Saúde e Vacinas para Pets

Aplicação web (SPA + API REST) desenvolvida como Projeto Integrador por **André Augusto Nicolay** e **Francesco Antonio Maieron**.

---

## Fluxo de Trabalho (Gitflow)

O repositório segue o modelo **Gitflow** para organização das entregas por sprint:

* **`main`**: Branch principal com o código estável. **Commits diretos são bloqueados**; alterações entram exclusivamente via Pull Request (PR) aprovado pelo outro integrante da dupla.
* **`develop`**: Branch de integração contínua onde as features da sprint atual são reunidas e testadas antes de irem para a `main`.
* **`feature/*`**: Desenvolvimento de novas funcionalidades e tarefas da sprint. Criada a partir da `develop` e mesclada de volta na `develop`.
* **`release/*`**: Preparação de versão para entrega/apresentação, destinada apenas a ajustes finais e correções de bugs da release.
* **`hotfix/*`**: Correções críticas encontradas na `main`, mescladas posteriormente na `main` e na `develop`.

### Nomenclatura de Branches
Todas as branches de trabalho devem seguir o padrão `tipo/card-descrição` (sem espaços e em minúsculas):
* `feature/card-01-estrutura-repositorio`
* `feature/card-15-auth-jwt`
* `fix/card-22-calculo-proxima-dose`

---

## Padrão de Commits (Conventional Commits)

Utilizamos o padrão **Conventional Commits** com mensagens claras e objetivas:

**Formato:** `<tipo>(<escopo opcional>): <descrição curta>`

| Prefixo | Quando usar | Exemplo |
| :--- | :--- | :--- |
| `feat` | Nova funcionalidade | `feat(pets): add endpoint to register pet weight` |
| `fix` | Correção de bug | `fix(dates): handle leap year on vaccine booster calculation` |
| `docs` | Documentação (`README`, `AGENTS.md`, diagramas) | `docs(readme): add gitflow and commit guidelines` |
| `style` | Formatação, ESLint, Prettier (sem alterar lógica) | `style(web): apply prettier formatting rules` |
| `refactor` | Refatoração de código sem mudar comportamento | `refactor(api): extract care plan rules to pure function` |
| `test` | Criação ou ajuste de testes unitários (Jest) | `test(care-plan): add unit tests for puppy vaccine schedule` |
| `chore` | Configurações, Docker, dependências e build | `chore(docker): configure api and web containers` |

---

## Regras de Pull Request e Revisão

1. Abra um PR vinculando o card correspondente do Trello.
2. Verifique se o **ESLint**, o **Prettier** e os **testes unitários (Jest)** estão passando antes de solicitar revisão.
3. O merge na `develop` ou na `main` só ocorre após revisão e aprovação do outro integrante da dupla.

---

## Registro de Uso de IA

Conforme diretrizes do projeto, ferramentas de IA (Claude Code / Claude Chat) são utilizadas como apoio ao desenvolvimento seguindo as regras definidas em `AGENTS.md`. Todo código gerado passa por revisão e testes manuais da dupla.

* **Etapa 1 (Base do projeto):** Apoio na estruturação da documentação inicial (`README.md` e `AGENTS.md`).
* *(Atualizar este tópico a cada etapa concluída)*
