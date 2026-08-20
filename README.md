# Studio Alan Garcia — Versão 5

## Novidade da Versão 2

O projeto utiliza o **logo oficial em PNG com fundo transparente** no cabeçalho, rodapé, área de login e agora também em destaque na página inicial.

## Estrutura

```text
alan-garcia-site-v1/
├── index.html
├── sobre.html
├── servicos.html
├── contato.html
├── login.html
├── css/
│   └── style.css
├── js/
│   ├── main.js
│   ├── login.js
│   └── firebase-config.js
└── assets/
    └── logo-alan-garcia.png
```

## Login inicial

Esta primeira versão possui login local de demonstração:

- Usuário: `admin`
- Senha: `admin123`

**Trocar isso antes de publicar em produção.**

## Firebase Realtime Database

Abra:

```text
js/firebase-config.js
```

E preencha:

```js
export const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  databaseURL: "https://SEU_PROJETO-default-rtdb.firebaseio.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.firebasestorage.app",
  messagingSenderId: "SEU_ID",
  appId: "SEU_APP_ID"
};
```

Ao preencher os dados, a agenda passa a sincronizar os dados no caminho:

```text
/agenda
```

## Como testar

Para testar corretamente o `type="module"` do JavaScript, rode o site em um servidor local, por exemplo:

```bash
python -m http.server 8080
```

Depois abra:

```text
http://localhost:8080
```

Ou publique os arquivos no seu servidor/VPS.

## Próximas evoluções sugeridas

1. Login real com Firebase Authentication.
2. Usuários/alunos cadastrados.
3. Agenda por calendário.
4. Bloqueio de horários ocupados.
5. Notificação por WhatsApp.
6. Área do aluno.
7. Cadastro de treinos e evolução.
8. Dashboard administrativo.


## Versão 4

Nova página inicial premium com hero em tela cheia, navegação redesenhada, cards de benefícios, bloco institucional, depoimentos, CTA e botão flutuante de WhatsApp.


## Versão 5

Correção do corte visual da página inicial, altura dinâmica do hero e responsividade reforçada para desktop, notebook, tablet e celular.
