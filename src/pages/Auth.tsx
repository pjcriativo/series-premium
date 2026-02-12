import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Film, Mail, Lock, User, ArrowLeft, Eye, EyeOff } from "lucide-react";

type AuthMode = "login" | "register" | "forgot" | "reset";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(() => {
    const m = searchParams.get("mode");
    return m === "reset" ? "reset" : "login";
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp, signInWithGoogle, resetPassword, updatePassword, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Listen for PASSWORD_RECOVERY event
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("reset");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Redirect if already logged in (except reset mode)
  useEffect(() => {
    if (user && mode !== "reset") {
      navigate("/", { replace: true });
    }
  }, [user, mode, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      switch (mode) {
        case "login":
          await signIn(email, password);
          navigate("/");
          break;
        case "register":
          await signUp(email, password, displayName);
          toast({
            title: "Conta criada!",
            description: "Verifique seu email para confirmar a conta.",
          });
          break;
        case "forgot":
          await resetPassword(email);
          toast({
            title: "Email enviado!",
            description: "Verifique sua caixa de entrada para redefinir a senha.",
          });
          setMode("login");
          break;
        case "reset":
          if (password !== confirmPassword) {
            toast({ title: "Erro", description: "As senhas não coincidem.", variant: "destructive" });
            return;
          }
          await updatePassword(password);
          toast({ title: "Senha atualizada!", description: "Sua senha foi redefinida com sucesso." });
          navigate("/");
          break;
      }
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      toast({
        title: "Erro ao entrar com Google",
        description: "Verifique se o provedor Google está configurado no Supabase.",
        variant: "destructive",
      });
    }
  };

  const titles: Record<AuthMode, string> = {
    login: "Bem-vindo de volta",
    register: "Crie sua conta",
    forgot: "Esqueceu a senha?",
    reset: "Nova senha",
  };

  const descriptions: Record<AuthMode, string> = {
    login: "Entre para continuar assistindo",
    register: "Preencha os dados para se registrar",
    forgot: "Enviaremos um link para redefinir sua senha",
    reset: "Escolha uma nova senha para sua conta",
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left panel — branding (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-background to-primary/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(var(--primary)/0.15),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(var(--primary)/0.1),transparent_60%)]" />

        <div className="relative z-10 px-12 max-w-md text-center space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
            <Film className="h-10 w-10 text-primary-foreground" />
          </div>
          <h2 className="text-4xl font-black text-foreground tracking-tight">
            ReelShort
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Séries curtas e envolventes para maratonar a qualquer momento. Drama, romance e suspense na palma da sua mão.
          </p>
          <div className="flex justify-center gap-2 pt-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-1.5 rounded-full bg-primary/40"
                style={{ width: i === 2 ? 40 : 16 }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 lg:w-1/2">
        {/* Mobile branding header */}
        <div className="lg:hidden mb-8 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/25">
            <Film className="h-7 w-7 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-black text-foreground">ReelShort</h2>
        </div>

        <Card className="w-full max-w-md border-border bg-card">
          <CardHeader className="text-center pb-4">
            {(mode === "forgot" || mode === "reset") && (
              <button
                type="button"
                onClick={() => setMode("login")}
                className="absolute top-4 left-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <CardTitle className="text-2xl font-bold text-foreground">
              {titles[mode]}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {descriptions[mode]}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Google button for login/register */}
            {(mode === "login" || mode === "register") && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleGoogleLogin}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continuar com Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">ou</span>
                  </div>
                </div>
              </>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Display Name — register only */}
              {mode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="displayName">Nome</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Seu nome"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Email — login, register, forgot */}
              {mode !== "reset" && (
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Password — login, register, reset */}
              {mode !== "forgot" && (
                <div className="space-y-2">
                  <Label htmlFor="password">
                    {mode === "reset" ? "Nova senha" : "Senha"}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-9 pr-9"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Confirm Password — reset only */}
              {mode === "reset" && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-9"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              )}

              {/* Forgot password link on login */}
              {mode === "login" && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-xs text-primary hover:underline"
                  >
                    Esqueci minha senha
                  </button>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? "Carregando..."
                  : mode === "login"
                  ? "Entrar"
                  : mode === "register"
                  ? "Criar conta"
                  : mode === "forgot"
                  ? "Enviar link"
                  : "Redefinir senha"}
              </Button>
            </form>

            {/* Toggle login / register */}
            {(mode === "login" || mode === "register") && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setMode(mode === "login" ? "register" : "login")}
                  className="text-sm text-primary hover:underline"
                >
                  {mode === "login"
                    ? "Não tem conta? Registre-se"
                    : "Já tem conta? Faça login"}
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
