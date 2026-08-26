# Relatório de Correção de Bugs

---

## BUG #01 — Login Silencia Erros

### O que estava acontecendo
Ao tentar fazer login com credenciais inválidas (e-mail ou senha errados, ou usuário inexistente), o formulário simplesmente não fazia nada. Nenhuma mensagem de erro era exibida ao usuário, dando a impressão de que o app estava travado ou de que o clique no botão não tinha funcionado.

### Por que acontecia
No arquivo `src/app/(auth)/login/page.tsx` (linha ~46), o bloco `catch` estava vazio:

```ts
} catch {
  // catch vazio — erro engolido
}
```

Quando o Firebase Auth lançava uma exceção (ex.: `invalid-credential`, `wrong-password`, `user-not-found`), o erro era capturado pelo `catch`, mas nada era feito com ele — ele simplesmente era "engolido" e descartado, sem atualizar o estado da UI.

### Como corrigi

**Antes:**
```ts
} catch {
  // catch vazio — erro engolido
}
```

**Depois:**
```ts
} catch (err) {
  const msg = err instanceof Error ? err.message : "Erro desconhecido";
  if (msg.includes("invalid-credential") || msg.includes("wrong-password")) {
    setErro("E-mail ou senha incorretos.");
  } else if (msg.includes("user-not-found")) {
    setErro("Nenhuma conta encontrada com este e-mail.");
  } else {
    setErro("Erro ao entrar. Tente novamente.");
  }
}
```

Agora o erro capturado é analisado e uma mensagem específica é setada no estado `erro`, que é exibida na tela para o usuário.

### Screenshot ou resultado
Pasta erro 1

---

## BUG #02 — Middleware com Condição Invertida

### O que estava acontecendo
Usuários **autenticados** (com token válido) eram redirecionados para a tela de login, enquanto usuários **sem token** conseguiam acessar rotas protegidas normalmente — exatamente o oposto do comportamento esperado.

### Por que acontecia
No arquivo `middleware.ts` (linha ~28), a condição verificava `if (token)` para redirecionar ao login, quando na verdade deveria redirecionar quando **não havia** token:

```ts
if (token) {  // ← deveria ser !token
  return NextResponse.redirect(new URL("/login", request.url));
}
```

Isso invertia toda a lógica de proteção de rotas do Next.js Middleware.

### Como corrigi

**Antes:**
```ts
if (token) {
  return NextResponse.redirect(new URL("/login", request.url));
}
```

**Depois:**
```ts
if (!token) {
  return NextResponse.redirect(new URL("/login", request.url));
}
```

Bastou adicionar o operador de negação (`!`) para que o redirecionamento ocorra apenas quando o token **não existe**, protegendo corretamente as rotas privadas.

### Screenshot ou resultado
Pasta erro 2

---

## BUG #03 — Confirmação de Senha Compara com Nome

### O que estava acontecendo
No formulário de cadastro, o campo "confirmar senha" não funcionava como esperado: mesmo digitando a senha corretamente duas vezes, o sistema às vezes acusava erro, comparando a senha com o nome do usuário em vez da confirmação de senha.

### Por que acontecia
No arquivo `src/app/(auth)/cadastro/page.tsx` (linha ~30), a validação usava a variável errada — comparava `senha` com `nome` em vez de `confirmarSenha`:

```ts
if (senha !== nome) {  // ← variável errada!
```

Provavelmente um erro de digitação/autocomplete, já que `nome` e `confirmarSenha` são variáveis distintas declaradas próximas uma da outra no formulário.

### Como corrigi

**Antes:**
```ts
if (senha !== nome) {
```

**Depois:**
```ts
if (senha !== confirmarSenha) {
```

### Screenshot ou resultado
Pasta erro 3


---

## BUG #04 — Query Sem Filtro de userId

### O que estava acontecendo
Ao acessar a lista de personagens, um usuário conseguia ver os personagens de **todos os outros usuários** do sistema, não apenas os seus próprios.

### Por que acontecia
No arquivo `src/services/personagens.ts` (linha ~29), a query ao Firestore buscava todos os documentos da coleção `personagens` sem nenhum filtro por usuário:

```ts
const q = query(collection(db, "personagens"));
```

Sem a cláusula `where`, o Firestore retorna todos os documentos da coleção, independentemente de quem os criou.

### Como corrigi

**Antes:**
```ts
const q = query(collection(db, "personagens"));
```

**Depois:**
```ts
import { where } from "firebase/firestore";
// ...
const q = query(
  collection(db, "personagens"),
  where("userId", "==", uid)
);
```

Agora a query filtra os documentos pelo campo `userId`, retornando apenas os personagens pertencentes ao usuário autenticado (`uid`).

### Screenshot ou resultado
Pasta erro 4gi


---

## BUG #05 — Nome de Coleção Errado no Create

### O que estava acontecendo
Ao criar um novo personagem, ele não aparecia na listagem, mesmo que a operação parecesse ter sido concluída com sucesso (sem erros no console).

### Por que acontecia
No arquivo `src/services/personagens.ts` (linha ~52), o `addDoc` usava o nome da coleção no **singular** (`"personagem"`), enquanto o restante do app lê e escreve na coleção no **plural** (`"personagens"`):

```ts
const ref = await addDoc(collection(db, "personagem"), { ... });
//                                       ↑ singular — errado!
```

Como o Firestore cria coleções automaticamente ao inserir o primeiro documento, nenhum erro era lançado — os dados simplesmente iam parar em uma coleção diferente (`personagem`), que nunca era lida pelo resto do app.

### Como corrigi

**Antes:**
```ts
const ref = await addDoc(collection(db, "personagem"), { ... });
```

**Depois:**
```ts
const ref = await addDoc(collection(db, "personagens"), { ... });
```

### Screenshot ou resultado
[Inserir print: criação de personagem — antes sumindo da lista após criado, depois aparecendo corretamente]

---

## BUG #06 — setDoc Apaga o Documento Inteiro

### O que estava acontecendo
Ao equipar um item em um personagem (ex.: trocar a arma), todos os outros dados do personagem (nome, atributos, outros itens equipados) desapareciam, restando apenas o campo do item recém-equipado.

### Por que acontecia
No arquivo `src/services/personagens.ts` (linha ~82), a função usava `setDoc` para atualizar apenas um campo (`slot`):

```ts
await setDoc(doc(db, "personagens", personagemId), { [slot]: itemId });
```

O `setDoc`, por padrão, **substitui o documento inteiro** pelo objeto passado, a menos que se use a opção `{ merge: true }`. Como o objeto passado continha apenas o campo do slot, todo o resto do documento era apagado.

### Como corrigi

**Antes:**
```ts
await setDoc(doc(db, "personagens", personagemId), { [slot]: itemId });
```

**Depois:**
```ts
await updateDoc(doc(db, "personagens", personagemId), { [slot]: itemId });
```

O `updateDoc` atualiza apenas os campos especificados, preservando o restante do documento.

### Screenshot ou resultado
[Inserir print: personagem antes e depois de equipar um item — antes perdendo os demais dados, depois mantendo tudo intacto]

---

## BUG #07 — Deletar Usa Índice Como ID

### O que estava acontecendo
Ao clicar para deletar um personagem específico, um personagem **diferente** (ou nenhum) era removido, dependendo da posição dele na lista.

### Por que acontecia
No arquivo `src/services/personagens.ts` (linha ~100), a exclusão usava o **índice do array** (posição na lista, ex.: 0, 1, 2...) como se fosse o ID do documento no Firestore:

```ts
await deleteDoc(doc(db, "personagens", String(indice)));
//                                      ↑ índice 0, 1, 2... não é o ID!
```

O índice do array não tem relação nenhuma com o ID real do documento gerado pelo Firestore, então a exclusão tentava (e geralmente falhava, ou apagava o documento errado) usando um ID inexistente/incorreto.

### Como corrigi

**Antes:**
```ts
await deleteDoc(doc(db, "personagens", String(indice)));
```

**Depois:**
```ts
await deleteDoc(doc(db, "personagens", personagem.id));
```

Agora a exclusão usa o campo `id` real do objeto `personagem`, que corresponde ao ID do documento no Firestore.

### Screenshot ou resultado
[Inserir print: lista de personagens ao deletar um item específico — antes removendo o item errado, depois removendo o item correto]

---

## BUG #08 — Security Rules Abertas

### O que estava acontecendo
Qualquer pessoa — mesmo sem estar autenticada — conseguia ler, criar, editar ou apagar **qualquer documento** do banco de dados diretamente, sem passar pelo app.

### Por que acontecia
No arquivo `firestore.rules`, a regra de segurança liberava acesso total a qualquer coleção, sem exigir autenticação nem verificar o dono do dado:

```
match /{document=**} {
  allow read, write: if true;
}
```

Isso significa que a segurança dependia inteiramente do front-end "se comportar bem", o que é inseguro: qualquer pessoa poderia usar o console do navegador ou a API do Firebase diretamente para ler ou alterar dados de qualquer usuário.

### Como corrigi

**Antes:**
```
match /{document=**} {
  allow read, write: if true;
}
```

**Depois:**
```
match /personagens/{personagemId} {
  allow read: if request.auth != null &&
              request.auth.uid == resource.data.userId;
  allow create: if request.auth != null &&
                request.auth.uid == request.resource.data.userId;
  allow update, delete: if request.auth != null &&
                        request.auth.uid == resource.data.userId;
}
```

Agora as regras exigem que o usuário esteja autenticado (`request.auth != null`) **e** que o `uid` do usuário corresponda ao dono do documento (`userId`). Isso garante que cada usuário só consiga ler e modificar os próprios personagens, tanto pelo app quanto por qualquer acesso direto ao Firestore.

### Screenshot ou resultado
[Inserir print: tentativa de acesso direto ao Firestore (ex.: via console/Postman) sem autenticação ou com uid diferente — antes permitindo acesso, depois bloqueando com "Missing or insufficient permissions"]

---

## Resumo Geral

| Bug | Arquivo | Conceito Principal |
|-----|---------|---------------------|
| 01 | `login/page.tsx` | Tratamento de erros (try/catch) |
| 02 | `middleware.ts` | Proteção de rotas / negação lógica |
| 03 | `cadastro/page.tsx` | Validação de formulário |
| 04 | `services/personagens.ts` | Filtro de query com `where()` |
| 05 | `services/personagens.ts` | Nomenclatura consistente de coleções |
| 06 | `services/personagens.ts` | `setDoc` vs `updateDoc` |
| 07 | `services/personagens.ts` | ID de documento vs índice de array |
| 08 | `firestore.rules` | Firebase Security Rules |