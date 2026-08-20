"""
Teste de ponta a ponta da Edge Function `delete-account`.

Existe porque a exclusão de conta é IRREVERSÍVEL e o caminho feliz não pode ser
verificado à mão sem apagar a conta de alguém: o script cria um usuário
descartável, dá dados de verdade a ele (deck, card, deck publicado e dois
arquivos — um em subpasta funda, para exercitar a varredura recursiva do
Storage), chama a função com o token DELE e confere que nada sobrou.

Roda contra o projeto real; não toca em nenhuma conta existente.

    python3 scripts/test-delete-account.py
"""
import json, os, re, sys, urllib.request, uuid

def env(path, key):
    for line in open(path, encoding="utf-8"):
        line = line.strip()
        if line.startswith("export "): line = line[7:]
        if line.startswith(key + "="):
            return line.split("=", 1)[1].strip().strip('"\'')
    return None

URL = env("extractor/.env.local", "SUPABASE_URL")
SERVICE = env("extractor/.env.local", "SUPABASE_SERVICE_ROLE_KEY") or env("extractor/.env.local", "SUPABASE_SERVICE_KEY")
ANON = None
for f in (".env.local", ".env"):
    if os.path.exists(f):
        m = re.search(r"sb_publishable_[A-Za-z0-9_-]+", open(f, encoding="utf-8").read())
        if m: ANON = m.group(0); break

def req(method, path, key, body=None, token=None, raw=None, ctype="application/json", base=None):
    u = (base or URL) + path
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    r = urllib.request.Request(u, data=data, method=method)
    r.add_header("apikey", key)
    r.add_header("Authorization", f"Bearer {token or key}")
    if data is not None: r.add_header("Content-Type", ctype)
    if method == "POST" and path.startswith("/rest/v1/"):
        r.add_header("Prefer", "return=representation")
    try:
        with urllib.request.urlopen(r) as resp:
            t = resp.read().decode()
            return resp.status, (json.loads(t) if t.strip().startswith(("{", "[")) else t)
    except urllib.error.HTTPError as e:
        t = e.read().decode()
        return e.code, (json.loads(t) if t.strip().startswith(("{", "[")) else t)

email = f"teste-exclusao-{uuid.uuid4().hex[:8]}@exemplo-descartavel.com"
senha = uuid.uuid4().hex + "Aa1!"

print("1. criando usuário descartável...")
s, u = req("POST", "/auth/v1/admin/users", SERVICE,
           {"email": email, "password": senha, "email_confirm": True})
assert s == 200, (s, u)
uid = u["id"]; print(f"   uid={uid}")

print("2. login para obter o token do próprio usuário...")
s, tok = req("POST", "/auth/v1/token?grant_type=password", ANON,
             {"email": email, "password": senha})
assert s == 200, (s, tok)
jwt = tok["access_token"]

print("3. criando dados: deck + card...")
s, pl = req("POST", "/rest/v1/playlists?select=id", SERVICE,
            {"user_id": uid, "name": "Deck de teste", "emoji": "", "color": "",
             "source_type": "manual", "tags": []})
print(f"   playlists -> HTTP {s}")
deck_id = pl[0]["id"] if s in (200, 201) and isinstance(pl, list) and pl else None
if deck_id:
    s2, _ = req("POST", "/rest/v1/flashcards", SERVICE,
                {"user_id": uid, "playlist_id": deck_id, "front": "f", "back": "b"})
    print(f"   flashcards -> HTTP {s2}")
    s3, cd = req("POST", "/rest/v1/community_decks?select=id", SERVICE,
                 {"author_id": uid, "source_playlist_id": deck_id,
                  "title": "Publicado de teste", "tags": [], "card_count": 1})
    print(f"   community_decks -> HTTP {s3}")

print("4. subindo arquivos (um deles em subpasta funda, para testar a recursão)...")
for bucket, caminho in [("card-images", f"{uid}/teste.jpg"),
                        ("imports", f"{uid}/{uuid.uuid4()}/img/0003.png")]:
    s, _ = req("POST", f"/storage/v1/object/{bucket}/{caminho}", SERVICE,
               raw=b"\xff\xd8\xff\xdbconteudo-de-teste", ctype="image/jpeg")
    print(f"   {bucket}/{caminho[-28:]} -> HTTP {s}")

print("5. CHAMANDO delete-account com o token do usuário...")
s, out = req("POST", "/functions/v1/delete-account", ANON, body=None, token=jwt)
print(f"   HTTP {s} {out}")

print("\n6. verificando o que sobrou:")
falhas = []
s, prof = req("GET", f"/rest/v1/profiles?id=eq.{uid}", SERVICE)
print(f"   profiles: {len(prof) if isinstance(prof, list) else prof}")
if prof: falhas.append("profile sobreviveu")

s, pls = req("GET", f"/rest/v1/playlists?user_id=eq.{uid}", SERVICE)
print(f"   playlists: {len(pls) if isinstance(pls, list) else pls}")
if pls: falhas.append("deck sobreviveu")

s, cards = req("GET", f"/rest/v1/flashcards?user_id=eq.{uid}", SERVICE)
print(f"   flashcards: {len(cards) if isinstance(cards, list) else cards}")
if cards: falhas.append("cards sobreviveram")

s, cds = req("GET", f"/rest/v1/community_decks?author_id=eq.{uid}", SERVICE)
print(f"   community_decks: {len(cds) if isinstance(cds, list) else cds}")
if cds: falhas.append("publicação sobreviveu")

s, usr = req("GET", f"/auth/v1/admin/users/{uid}", SERVICE)
print(f"   auth.users: HTTP {s}")
if s == 200: falhas.append("conta de auth sobreviveu")

for bucket in ("card-images", "imports"):
    s, lst = req("POST", f"/storage/v1/object/list/{bucket}", SERVICE,
                 {"prefix": uid, "limit": 100})
    n = len(lst) if isinstance(lst, list) else "?"
    print(f"   storage {bucket}: {n} objeto(s) sob {uid[:8]}/")
    if isinstance(lst, list) and lst: falhas.append(f"arquivos em {bucket}")

print()
if falhas:
    print("✗ FALHOU:", "; ".join(falhas)); sys.exit(1)
print("✓ TUDO APAGADO — conta, dados em cascata e arquivos dos dois buckets.")
