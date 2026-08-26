"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import BugBanner from "@/components/BugBanner";

// ---------------------------------------------------------------------------
// 🐛 BUG 03 — CONFIRMAÇÃO DE SENHA COMPARA COM O CAMPO ERRADO
// A validação compara a senha com o nome do usuário (variável `nome`)
// em vez de comparar com a confirmação de senha (variável `confirmarSenha`).
// Resultado: qualquer senha é aceita — a confirmação nunca funciona.
// ---------------------------------------------------------------------------

export default function CadastroPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();
  const { cadastrar } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");


    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    if (senha.length < 6) {
      setErro("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setCarregando(true);
    try {
      await cadastrar(nome, email, senha);
      router.push("/dashboard");
    } catch {
      setErro("Erro ao criar conta. Verifique os dados e tente novamente.");
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
      <div style={{ width: "100%", maxWidth: "440px" }}>
        <Link
          href="/"
          className="nav-logo gold-text"
          style={{ display: "block", textAlign: "center", marginBottom: "2rem", fontSize: "1.3rem" }}
        >
          ⚔️ NEXUS DOS HERÓIS
        </Link>

        <BugBanner
          numero={3}
          titulo="Confirmação de Senha Quebrada"
          oQueAcontece="O campo 'Confirmar Senha' não funciona! Você pode digitar qualquer coisa nele que o cadastro vai passar — a validação nunca detecta que as senhas são diferentes."
          porQue="O código compara a senha com a variável errada: em vez de checar if (senha !== confirmarSenha), está comparando if (senha !== nome). Como a senha quase nunca é igual ao nome, a condição 'são diferentes' fica falsa e o erro nunca dispara."
          dica="Procure o if (senha !== nome) e troque 'nome' por 'confirmarSenha'. Parece pequeno, mas é exatamente esse tipo de bug que cria brechas de segurança no mundo real."
        />

        <div className="card animate-slide-in" style={{ padding: "2rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.25rem" }}>Criar Conta</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            Junte-se ao Nexus e forje seu primeiro herói.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label htmlFor="nome">Nome de Aventureiro</label>
              <input
                id="nome"
                type="text"
                className="input-field"
                placeholder="Como te chamam nas tavernas?"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>

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
                placeholder="Mínimo 6 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="confirmarSenha">Confirmar Senha</label>
              <input
                id="confirmarSenha"
                type="password"
                className="input-field"
                placeholder="Repita a senha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                required
              />
            </div>

            {erro && <p className="msg-error">{erro}</p>}

            <button type="submit" className="btn btn-primary" disabled={carregando} style={{ width: "100%", marginTop: "0.5rem" }}>
              {carregando ? "Criando conta..." : "✦ Forjar meu Herói"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.85rem", color: "var(--muted)" }}>
            Já tem conta?{" "}
            <Link href="/login" style={{ color: "var(--primary-light)", fontWeight: 600, textDecoration: "none" }}>
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
