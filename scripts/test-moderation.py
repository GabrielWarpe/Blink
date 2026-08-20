"""
Teste da moderação: o `unlisted` do painel administrativo REALMENTE tira o deck
do ar?

Filtrar no app não bastaria — qualquer um com um token consulta a tabela direto.
Quem precisa recusar é a RLS, e é isso que este script verifica: cria dois
usuários descartáveis (autor e curioso), publica um deck, confirma que o curioso
o enxerga, marca `unlisted` como o painel faria, e confirma que ele SOME para o
curioso e CONTINUA visível para o autor.

    python3 scripts/test-moderation.py
"""
import json, os, re, sys, urllib.request, uuid

def env(path, key):
    for line in open(path, encoding="utf-8"):
        line = line.strip()
        if line.startswith("export "): line = line[7:]
        if line.startswith(key + "="):
            return line.split("=", 1)[1].strip().strip('"\'')

URL = env("extractor/.env.local", "SUPABASE_URL")
SERVICE = env("extractor/.env.local", "SUPABASE_SERVICE_ROLE_KEY")
ANON = re.search(r"sb_publishable_[A-Za-z0-9_-]+", open(".env.local", encoding="utf-8").read()).group(0)

def req(method, path, key, body=None, token=None):
    r = urllib.request.Request(URL + path,
        data=json.dumps(body).encode() if body is not None else None, method=method)
    r.add_header("apikey", key); r.add_header("Authorization", f"Bearer {token or key}")
    if body is not None:
        r.add_header("Content-Type", "application/json")
        r.add_header("Prefer", "return=representation")
    try:
        with urllib.request.urlopen(r) as resp:
            t = resp.read().decode()
            return resp.status, (json.loads(t) if t.strip().startswith(("{", "[")) else t)
    except urllib.error.HTTPError as e:
        t = e.read().decode()
        return e.code, (json.loads(t) if t.strip().startswith(("{", "[")) else t)

def novo_usuario(rotulo):
    email = f"teste-moderacao-{rotulo}-{uuid.uuid4().hex[:8]}@exemplo-descartavel.com"
    senha = uuid.uuid4().hex + "Aa1!"
    s, u = req("POST", "/auth/v1/admin/users", SERVICE,
               {"email": email, "password": senha, "email_confirm": True})
    assert s == 200, (s, u)
    s, tok = req("POST", "/auth/v1/token?grant_type=password", ANON,
                 {"email": email, "password": senha})
    assert s == 200, (s, tok)
    return u["id"], tok["access_token"]

falhas, criados = [], []
def checa(condicao, descricao):
    print(("  ✓ " if condicao else "  ✗ ") + descricao)
    if not condicao: falhas.append(descricao)

try:
    print("preparando autor e curioso...")
    autor_id, autor_jwt = novo_usuario("autor"); criados.append(autor_id)
    outro_id, outro_jwt = novo_usuario("curioso"); criados.append(outro_id)

    s, dk = req("POST", "/rest/v1/playlists?select=id", SERVICE,
                {"user_id": autor_id, "name": "Origem", "tags": []})
    s, cd = req("POST", "/rest/v1/community_decks?select=id", SERVICE,
                {"author_id": autor_id, "source_playlist_id": dk[0]["id"],
                 "title": "Deck sob moderação", "tags": [], "card_count": 1})
    deck = cd[0]["id"]
    req("POST", "/rest/v1/community_cards", SERVICE,
        {"community_deck_id": deck, "front": "p", "back": "r", "position": 0})

    print("\nantes da remoção:")
    s, r = req("GET", f"/rest/v1/community_decks?id=eq.{deck}", ANON, token=outro_jwt)
    checa(len(r) == 1, "o curioso enxerga o deck publicado")
    s, r = req("GET", f"/rest/v1/community_cards?community_deck_id=eq.{deck}", ANON, token=outro_jwt)
    checa(len(r) == 1, "o curioso enxerga os cards")

    print("\nmoderador marca unlisted (como o painel faz)...")
    s, _ = req("PATCH", f"/rest/v1/community_decks?id=eq.{deck}", SERVICE, {"unlisted": True})

    print("\ndepois da remoção:")
    s, r = req("GET", f"/rest/v1/community_decks?id=eq.{deck}", ANON, token=outro_jwt)
    checa(len(r) == 0, "o deck SUMIU para o curioso (consulta direta pelo id)")
    s, r = req("GET", f"/rest/v1/community_cards?community_deck_id=eq.{deck}", ANON, token=outro_jwt)
    checa(len(r) == 0, "os cards sumiram junto")
    s, r = req("GET", "/rest/v1/community_decks?select=id", ANON, token=outro_jwt)
    checa(deck not in [x["id"] for x in r], "não aparece na listagem do catálogo")
    s, r = req("GET", f"/rest/v1/community_decks?id=eq.{deck}", ANON, token=autor_jwt)
    checa(len(r) == 1, "o AUTOR continua enxergando (não parece bug para ele)")
finally:
    for uid in criados:
        req("DELETE", f"/auth/v1/admin/users/{uid}", SERVICE)
    print(f"\n({len(criados)} usuários de teste removidos)")

print()
if falhas: print("✗ FALHOU:", "; ".join(falhas)); sys.exit(1)
print("✓ MODERAÇÃO VALENDO — o unlisted do painel tira o deck do ar de verdade.")
