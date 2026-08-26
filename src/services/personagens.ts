"use client";

import {
  collection,
  query,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import type { Classe, Personagem } from "@/types";
import { where } from "firebase/firestore";

// ---------------------------------------------------------------------------
// LISTAR — BUG 04 🐛
// ---------------------------------------------------------------------------
// O que está acontecendo: a lista exibe personagens de TODOS os usuários,
// não apenas os do usuário logado. Qualquer pessoa consegue ver os heróis
// criados por outros jogadores!
//
// Por quê? A query abaixo não usa nenhum filtro. Ela busca tudo da coleção
// "personagens" sem verificar a qual usuário cada documento pertence.
//
// CORREÇÃO: adicione um filtro com where('userId', '==', uid) para que
// cada usuário veja apenas os seus próprios personagens.
// ---------------------------------------------------------------------------
export async function listarPersonagens(_uid: string): Promise<Personagem[]> {
  const q = query(
  collection(db, "personagens"),
  where("userId", "==", _uid)
);

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Personagem));
}

// ---------------------------------------------------------------------------
// CRIAR — BUG 05 🐛
// ---------------------------------------------------------------------------
// O que está acontecendo: o personagem é criado e o formulário confirma
// sucesso, mas o herói nunca aparece no dashboard!
//
// Por quê? O addDoc está salvando na coleção "personagem" (singular) mas
// o listarPersonagens lê de "personagens" (plural). São coleções diferentes
// no Firestore — o dado vai para o lugar errado e some.
//
// CORREÇÃO: troque "personagem" por "personagens" no addDoc abaixo.
// ---------------------------------------------------------------------------
export async function criarPersonagem(
  uid: string,
  nome: string,
  classe: Classe
): Promise<string> {
 
  const ref = await addDoc(collection(db, "personagens"), {
    nome,
    classe,
    nivel: 1,
    xp: 0,
    userId: uid,
    criadoEm: serverTimestamp(),
  });
  return ref.id;
}

// ---------------------------------------------------------------------------
// BUSCAR UM PERSONAGEM
// ---------------------------------------------------------------------------
export async function buscarPersonagem(id: string): Promise<Personagem | null> {
  const snap = await getDoc(doc(db, "personagens", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Personagem;
}

// ---------------------------------------------------------------------------
// EQUIPAR ITEM — BUG 06 🐛
// ---------------------------------------------------------------------------
// O que está acontecendo: quando você equipa uma arma, a armadura some.
// Quando você equipa um anel, a arma e a armadura desaparecem!
// Cada novo item apaga os anteriores.
//
// Por quê? setDoc substitui o documento INTEIRO pelo objeto que você passa.
// Se você mandar só { arma: "espada" }, o Firestore vai apagar nome, classe,
// userId e todos os outros campos do personagem.
//
// CORREÇÃO: troque setDoc por updateDoc. O updateDoc atualiza apenas os
// campos que você passar, sem mexer nos outros.
// ---------------------------------------------------------------------------
export async function equiparItem(
  personagemId: string,
  slot: "arma" | "armadura" | "anel",
  itemId: string
): Promise<void> {
  // 🐛 BUG 06 — setDoc apaga o documento inteiro ao invés de atualizar só o campo
  await setDoc(doc(db, "personagens", personagemId), { [slot]: itemId });
}

// ---------------------------------------------------------------------------
// DELETAR — BUG 07 🐛
// ---------------------------------------------------------------------------
// O que está acontecendo: ao tentar deletar um personagem específico,
// o app deleta o ERRADO ou gera um erro de "documento não encontrado".
//
// Por quê? A função recebe o personagem inteiro, mas usa o parâmetro
// "indice" (a posição na lista: 0, 1, 2...) como se fosse o ID do documento
// no Firestore. O ID real é uma string aleatória gerada pelo Firebase.
//
// CORREÇÃO: use personagem.id ao invés de String(indice) no deleteDoc.
// ---------------------------------------------------------------------------
export async function deletarPersonagem(
  personagem: Personagem,
  indice: number
): Promise<void> {
  // 🐛 BUG 07 — usa o índice da lista (0, 1, 2) como ID do documento
  await deleteDoc(doc(db, "personagens", String(indice)));
}

// ---------------------------------------------------------------------------
// ADICIONAR XP (sem bug — exemplo de increment atômico)
// ---------------------------------------------------------------------------
export async function adicionarXP(personagemId: string, quantidade: number) {
  await updateDoc(doc(db, "personagens", personagemId), {
    xp: quantidade,
  });
}
