# Studio Alan Garcia — Guia Completo do Projeto

## 1. Visão geral

Projeto do **Studio Alan Garcia — Treinamento Físico Personalizado**, composto por site institucional + sistema administrativo + área do aluno.

Domínio:
`https://www.studioalangarcia.com.br/`

Tecnologias principais:
- HTML
- CSS
- JavaScript ES Modules
- Firebase Authentication
- Firebase Realtime Database
- Git / GitHub
- GitHub Pages

---

## 2. Estrutura

```text
Estudio-Alan-Garcia-main/
├── index.html
├── sobre.html
├── servicos.html
├── contato.html
├── login.html
├── aluno.html
├── sitemap.xml
├── README.md
│
├── assets/
│   ├── logo-alan-garcia.png
│   └── hero-studio.jpg
│
├── css/
│   ├── style.css
│   └── aluno.css
│
└── js/
    ├── main.js
    ├── firebase-config.js
    ├── firebase-app.js
    ├── login.js
    ├── alunos.js
    ├── alunos-lista.js
    ├── agenda.js
    └── aluno.js
```

---

# 3. Páginas

## `index.html`
Página inicial institucional.

Contém:
- Hero
- Logo
- CREF
- WhatsApp
- Versículo
- Diferenciais
- Estrutura
- Depoimentos
- SEO
- Open Graph
- JSON-LD
- Favicon

## `sobre.html`
Página institucional sobre o Studio.

## `servicos.html`
Apresentação dos serviços e tipos de treinamento.

## `contato.html`
Contato, endereço, WhatsApp, Instagram, e-mail e localização.

Endereço atual:
**Rua Júlio Bozano, 115 — Nossa Chácara — Gravataí/RS — CEP 94055-030**

WhatsApp:
**(51) 98013-5744**

Instagram:
**@studio_alangarcia**

E-mail:
**studioalangarcia@gmail.com**

CREF:
**030854-G/RS**

## `login.html`
Entrada do sistema e painel administrativo.

## `aluno.html`
Área exclusiva do aluno.

---

# 4. CSS

## `css/style.css`
CSS principal do site e painel administrativo.

Responsável por:
- Layout
- Header
- Hero
- Menus
- Cards
- Botões
- Formulários
- Painel
- Responsividade
- Animações
- Tema preto/laranja

## `css/aluno.css`
CSS exclusivo da área do aluno.

Mantido separado para evitar que alterações da área do aluno afetem o restante do sistema.

---

# 5. JavaScript

## `js/main.js`
JavaScript geral do site.

Responsável por comportamentos globais, navegação e transições.

Também possui correção para o botão Voltar do navegador:

```js
window.addEventListener("pageshow", () => {
  const transition = document.querySelector(".page-transition");
  if (transition) transition.classList.remove("is-leaving");
});
```

---

## `js/firebase-config.js`
Configuração do Firebase e controle:

```js
FIREBASE_ENABLED
```

É utilizado pelos módulos que precisam do Firebase.

---

## `js/firebase-app.js`
Módulo central de inicialização do Firebase.

Inicializa:
- Firebase App
- Firebase Authentication
- Firebase Realtime Database

E disponibiliza funções compartilhadas como:

```text
signInWithEmailAndPassword
signOut
onAuthStateChanged
ref
get
set
push
remove
```

Arquitetura:

```text
firebase-config.js
       ↓
firebase-app.js
       ↓
login / alunos / agenda / aluno
```

---

# 6. Login e perfis

## `js/login.js`

Controla login e acesso ao painel.

Depois do Firebase Authentication, consulta:

```text
/usuarios/{UID}
```

e verifica:

```text
ativo
tipo
```

Tipos atuais:

```text
admin
aluno
```

Existe estrutura preparada para:

```text
estagiario
```

Fluxo:

```text
Login
 ↓
Firebase Authentication
 ↓
UID
 ↓
/usuarios/{UID}
 ↓
ativo?
 ↓
tipo?
 ├── admin → painel
 └── aluno → aluno.html
```

---

# 7. Alunos

## `js/alunos.js`

Responsável pelo cadastro e gerenciamento dos alunos.

Dados ficam em:

```text
/alunos/{UID}
```

Estrutura aproximada:

```json
{
  "nomeCompleto": "Nome",
  "email": "email",
  "whatsapp": "51999999999",
  "cpf": "00000000000",
  "dataNascimento": "1999-02-13",
  "idade": 27,
  "objetivo": "Emagrecimento",
  "status": "ativo",
  "observacao": "...",
  "peso": {
    "pesoInicial": 97.5,
    "pesoAtual": 97.5,
    "dataPesoInicial": "...",
    "dataPesoAtual": "..."
  },
  "endereco": {
    "rua": "...",
    "numero": "...",
    "bairro": "...",
    "cidade": "Gravataí",
    "estado": "RS"
  }
}
```

## `js/alunos-lista.js`

Controla a listagem dos alunos no painel.

Responsável por carregar, pesquisar, filtrar e exibir alunos.

---

# 8. Agenda

## `js/agenda.js`

Controla a agenda administrativa.

Funções:
- Carregar agenda
- Carregar alunos no seletor
- Criar agendamento
- Excluir agendamento
- Renderizar horários
- Fallback com LocalStorage

Agenda principal:

```text
/agenda
```

Cada registro possui:

```json
{
  "clientId": "UID_DO_ALUNO",
  "clientName": "Nome",
  "date": "2026-10-08",
  "time": "17:28",
  "service": "Avaliação",
  "notes": "teste",
  "createdAt": "..."
}
```

---

# 9. Agenda individual

Também existe:

```text
/agendaAluno
```

Estrutura:

```text
/agendaAluno/{UID_DO_ALUNO}/{ID_DO_AGENDAMENTO}
```

Exemplo:

```text
agendaAluno
└── XOKJT9ZrNmYkdS1El2q1Mc8Vdw22
    └── -P3SC6...
        ├── clientId
        ├── clientName
        ├── date
        ├── time
        ├── service
        ├── notes
        └── createdAt
```

### Diferença

`/agenda`:
- Agenda geral
- Todos os alunos
- Uso administrativo

`/agendaAluno`:
- Agenda individual
- Organizada pelo UID
- Uso da área do aluno
- Facilita as regras de segurança

Quando o administrador cria um agendamento:

```text
Painel Admin
    ↓
Seleciona aluno
    ↓
clientId = UID
    ↓
Salva em /agenda/{ID}
    ↓
Salva também em /agendaAluno/{UID}/{ID}
```

O mesmo agendamento é mantido nas duas estruturas.

---

# 10. Área do aluno

## `js/aluno.js`

Controla a área individual.

Fluxo:

```text
aluno.html
 ↓
aluno.js
 ↓
Firebase Auth
 ↓
/usuarios/{UID}
 ↓
/alunos/{UID}
 ↓
/agendaAluno/{UID}
```

A página atualmente apresenta:
- Nome
- E-mail
- WhatsApp
- Data de nascimento
- Objetivo
- Peso inicial
- Peso atual
- Status
- Próximo treinamento
- Quantidade de treinamentos
- Agenda individual

O UID é obtido automaticamente:

```js
user.uid
```

O aluno não precisa informar o UID.

---

# 11. Firebase Authentication

O UID do Authentication é a identidade central do sistema.

Exemplo:

```text
Authentication
UID = XOKJT9ZrNmYkdS1El2q1Mc8Vdw22
```

Esse mesmo UID é usado em:

```text
/usuarios/XOKJT9ZrNmYkdS1El2q1Mc8Vdw22
/alunos/XOKJT9ZrNmYkdS1El2q1Mc8Vdw22
/agendaAluno/XOKJT9ZrNmYkdS1El2q1Mc8Vdw22
```

Isso permite ligar:
- conta de login
- cadastro do aluno
- agenda individual

---

# 12. Realtime Database

Estrutura atual:

```text
Firebase Realtime Database
│
├── agenda
│   └── ID_AGENDAMENTO
│
├── agendaAluno
│   └── UID_ALUNO
│       └── ID_AGENDAMENTO
│
├── alunos
│   └── UID_ALUNO
│
└── usuarios
    └── UID
```

---

# 13. Segurança

As Firebase Rules separam os acessos.

Conceito:

```text
ADMIN
→ administra o sistema

ALUNO
→ acessa seus próprios dados

ESTAGIÁRIO
→ acesso controlado pelas Rules
```

A área do aluno utiliza:

```text
/agendaAluno/{UID_DO_ALUNO}
```

para evitar que um aluno precise receber a agenda geral.

Nunca transformar o banco inteiro em público com:

```json
".read": true
```

porque existem dados pessoais de alunos.

---

# 14. SEO

O site possui:
- `<title>`
- description
- robots
- canonical
- author
- keywords
- Open Graph
- favicon
- JSON-LD
- sitemap

## JSON-LD

A página inicial possui dados estruturados do Studio como:

```text
SportsActivityLocation
```

Incluindo nome, endereço, telefone, logo, site e Instagram.

---

# 15. Sitemap

Arquivo:

```text
sitemap.xml
```

Na raiz do projeto.

URLs principais:

```text
https://www.studioalangarcia.com.br/
https://www.studioalangarcia.com.br/sobre.html
https://www.studioalangarcia.com.br/servicos.html
https://www.studioalangarcia.com.br/contato.html
```

O domínio foi configurado no Google Search Console e o sitemap foi enviado.

A página inicial também já foi solicitada para indexação.

---

# 16. Assets

## `assets/logo-alan-garcia.png`

Logo oficial.

Utilizada no:
- Header
- Hero
- Favicon
- SEO
- Open Graph
- JSON-LD

## `assets/hero-studio.jpg`

Imagem principal utilizada no site.

---

# 17. GitHub / publicação

O site é versionado com Git e publicado via GitHub Pages.

Fluxo correto:

```text
Alterar arquivo
 ↓
Salvar
 ↓
git status
 ↓
git add .
 ↓
git commit -m "Descrição"
 ↓
git push
 ↓
GitHub Pages atualiza
 ↓
Testar no domínio
```

Comandos:

```powershell
git status
git add .
git commit -m "Descrição da alteração"
git push
```

Para ver commits:

```powershell
git log --oneline -10
```

Para atualizar o projeto local:

```powershell
git pull origin main
```

### Atenção

Se alterar o código e esquecer o `git push`, o domínio continuará usando a versão anterior.

---

# 18. Onde alterar cada coisa?

| Objetivo | Arquivo |
|---|---|
| Visual geral | `css/style.css` |
| Visual da área do aluno | `css/aluno.css` |
| Comportamento geral | `js/main.js` |
| Login | `js/login.js` |
| Cadastro de alunos | `js/alunos.js` |
| Lista de alunos | `js/alunos-lista.js` |
| Agenda administrativa | `js/agenda.js` |
| Área do aluno | `js/aluno.js` |
| Inicialização Firebase | `js/firebase-app.js` |
| Configuração Firebase | `js/firebase-config.js` |
| Página inicial | `index.html` |
| Página Sobre | `sobre.html` |
| Serviços | `servicos.html` |
| Contato | `contato.html` |
| Login/Painel | `login.html` |
| Área do aluno | `aluno.html` |
| URLs do sitemap | `sitemap.xml` |

---

# 19. Arquitetura resumida

```text
                         SITE
                          │
             ┌────────────┴────────────┐
             │                         │
       Site institucional          Sistema
             │                         │
     ┌───────┼────────┐          ┌─────┴─────┐
     │       │        │          │           │
   Home    Sobre   Serviços     Admin       Aluno
                                  │           │
                           ┌──────┼──────┐    │
                           │      │      │    │
                         Alunos Agenda  ...   │
                                  │           │
                                  ▼           ▼
                               /agenda   /agendaAluno/UID
                                  │           │
                                  └─────┬─────┘
                                        │
                                     Firebase
```

---

# 20. Próximas evoluções possíveis

A arquitetura permite adicionar:

```text
Área do aluno
├── Dashboard
├── Agenda
├── Treinos
├── Ficha de treino
├── Avaliação física
├── Evolução
├── Medidas
├── Peso
├── Histórico
├── Financeiro
└── Dados pessoais
```

Painel:

```text
Admin
├── Dashboard
├── Alunos
├── Agenda
├── Treinos
├── Avaliações
├── Financeiro
├── Relatórios
├── Usuários
└── Configurações
```

---

# 21. Regra para manutenção

Sempre que uma funcionalidade importante for criada:

```text
Implementar
 ↓
Testar
 ↓
Verificar Firebase se necessário
 ↓
Atualizar este documento
 ↓
Commit
 ↓
Push
```

A ideia é que este arquivo sirva como mapa do projeto para futuras alterações, inclusive quando o projeto ficar maior.

---

# 22. Informações oficiais

```text
Studio Alan Garcia
Treinamento Físico Personalizado

Rua Júlio Bozano, 115
Nossa Chácara
Gravataí/RS
CEP 94055-030

WhatsApp:
(51) 98013-5744

Instagram:
@studio_alangarcia

E-mail:
studioalangarcia@gmail.com

CREF:
030854-G/RS
```

---

## Fim

Este documento deve ser atualizado sempre que a arquitetura do sistema mudar.
