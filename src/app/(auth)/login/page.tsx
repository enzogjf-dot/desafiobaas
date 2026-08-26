"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import BugBanner from "@/components/BugBanner";

// ---------------------------------------------------------------------------
// 🐛 BUG 01 — ERRO DE LOGIN ENGOLIDO
// O bloco catch está vazio: quando o usuário erra a senha ou o e-mail não
// existe, o app não exibe nenhuma mensagem. O formulário simplesmente trava
// no estado "Entrando..." para sempre, sem explicar o que houve.
// ---------------------------------------------------------------------------

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");   // ← esta variável existe mas nunca é usada
  const router = useRouter();
  const { entrar } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    setErro(""); // ← limpa o erro anterior, mas o novo erro nunca é exibido

    try {
      await entrar(email, senha);
      router.push("/dashboard");
    } catch (err) {
  const msg = err instanceof Error ? err.message : "Erro desconhecido";
  if (msg.includes("invalid-credential") || msg.includes("wrong-password")) {
    setErro("E-mail ou senha incorretos.");
  } else if (msg.includes("user-not-found")) {
    setErro("Nenhuma conta encontrada com este e-mail.");
  } else {
    setErro("Erro ao entrar. Tente novamente.");
  }
} finally {
      setCarregando(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.25rem",
        background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(124,58,237,0.1) 0%, transparent 70%)",
      }}
    >
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <Link
          href="/"
          className="nav-logo gold-text"
          style={{ display: "block", textAlign: "center", marginBottom: "2rem", fontSize: "1.3rem" }}
        >
          ⚔️ NEXUS DOS HERÓIS
        </Link>

        {/* Banner do Bug */}
        <BugBanner
          numero={1}
          titulo="Erro de Login Engolido"
          oQueAcontece="Quando você erra a senha ou digita um e-mail que não existe, o botão fica travado em 'Entrando...' e nenhuma mensagem de erro aparece. O app parece ter travado!"
          porQue="O bloco catch dentro da função handleSubmit está completamente vazio. Em JavaScript, o catch captura o erro que o Firebase jogou, mas se você não faz nada com ele (como exibir na tela), o erro desaparece em silêncio."
          dica="Encontre o catch{} vazio e adicione: setErro('E-mail ou senha inválidos.'). Depois mostre o conteúdo de {erro} na tela. Atenção: a variável setErro já existe — ela só nunca é chamada."
        />

        <div className="card animate-slide-in" style={{ padding: "2rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.25rem" }}>Entrar</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            Acesse o Nexus e gerencie seus heróis.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                className="input-field"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="senha">Senha</label>
              <input
                id="senha"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>

            {/* 🐛 BUG 01 — {erro} nunca é preenchido, então este bloco nunca aparece */}
            {erro && <p className="msg-error">{erro}</p>}

            <button type="submit" className="btn btn-primary" disabled={carregando} style={{ width: "100%", marginTop: "0.5rem" }}>
              {carregando ? "Entrando..." : "⚔️ Entrar no Nexus"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.85rem", color: "var(--muted)" }}>
            Não tem conta?{" "}
            <Link href="/cadastro" style={{ color: "var(--primary-light)", fontWeight: 600, textDecoration: "none" }}>
              Criar agora
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
