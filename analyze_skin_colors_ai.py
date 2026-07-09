"""
analyze_skin_colors_ai.py — rate limit'e uyumlu sürüm
"""
import json, os, sys, time, base64, re
from io import BytesIO
from PIL import Image
import requests
import anthropic

API_KEY = os.environ.get("ANTHROPIC_API_KEY")
if not API_KEY:
    print("❌ ANTHROPIC_API_KEY eksik")
    sys.exit(1)

MODEL = "claude-haiku-4-5"
OUTPUT_FILE = "public/data/skin_colors.json"
INPUT_FILE = "public/data/skins.json"

# Rate limit: dakikada 50 istek = her 1.3 saniyede 1 istek
# Güvenli olmak için 1.4 saniyeye çıkarıyoruz (~43 istek/dk)
DELAY_BETWEEN_REQUESTS = 1.4

VALID_COLORS = {"red","blue","green","purple","gold","black","white","orange","pink","yellow","brown","gray"}
VALID_STYLES = {"cyberpunk","neon","vintage","military","premium","doppler-family","tactical","futuristic","tribal","graffiti"}

PROMPT = """Analyze this CS2 weapon skin image. Return ONLY JSON:
{"colors": ["color1","color2"], "style": "style_or_null"}

Valid colors: red,blue,green,purple,gold,black,white,orange,pink,yellow
Valid styles: cyberpunk,neon,vintage,military,premium,doppler-family,tactical,futuristic,null

Rules:
- Up to 3 dominant colors (>15% of skin pattern)
- Ignore wooden stock/grip colors
- Include accent colors even if small (e.g. Redline = red+black)
- Doppler/Fade/Marble Fade skins use style="doppler-family"
- If unclear: {"colors":[], "style":null}"""


def download_image(url):
    try:
        r = requests.get(url, timeout=15)
        if r.status_code != 200: return None
        img = Image.open(BytesIO(r.content)).convert("RGB")
        img.thumbnail((256, 256))
        buf = BytesIO()
        img.save(buf, format="JPEG", quality=85)
        return buf.getvalue()
    except: return None


def analyze(client, img_bytes, retries=3):
    img_b64 = base64.standard_b64encode(img_bytes).decode()
    for attempt in range(retries):
        try:
            msg = client.messages.create(
                model=MODEL, max_tokens=150,
                messages=[{
                    "role":"user",
                    "content":[
                        {"type":"image","source":{"type":"base64","media_type":"image/jpeg","data":img_b64}},
                        {"type":"text","text":PROMPT},
                    ],
                }],
            )
            text = msg.content[0].text.strip()
            m = re.search(r'\{[^}]+\}', text)
            if not m: return None
            parsed = json.loads(m.group())
            colors = [c for c in parsed.get("colors",[]) if c in VALID_COLORS]
            style = parsed.get("style")
            if style not in VALID_STYLES: style = None
            tags = colors[:]
            if style: tags.append(style)
            return tags
        except anthropic.RateLimitError:
            wait = 30 + (attempt * 20)  # 30s, 50s, 70s
            print(f"  ⏸️  Rate limit, {wait}sn bekliyor...")
            time.sleep(wait)
        except Exception as e:
            print(f"  ❌ {e}")
            return None
    return None


def main():
    skins = json.load(open(INPUT_FILE))
    print(f"📦 {len(skins)} skin")

    results = {}
    if os.path.exists(OUTPUT_FILE):
        results = json.load(open(OUTPUT_FILE))
        # Boş sonuçları temizle ki yeniden denesin
        results = {k:v for k,v in results.items() if v}
        print(f"♻️  {len(results)} skin daha önce başarılı")

    to_process = [s for s in skins if s["name"] not in results]
    print(f"🎨 {len(to_process)} skin işlenecek (~{len(to_process)*1.4/60:.0f}dk)")
    print(f"💰 ~${len(to_process)*0.0006:.2f}\n")

    if not to_process: return

    client = anthropic.Anthropic(api_key=API_KEY)
    start = time.time()
    processed = 0
    failed = 0

    for skin in to_process:
        req_start = time.time()
        img = download_image(skin["image"])
        if img:
            tags = analyze(client, img)
            if tags is not None:
                results[skin["name"]] = tags
            else:
                failed += 1
        else:
            failed += 1

        processed += 1
        # Her 20'de bir kaydet + ilerleme
        if processed % 20 == 0:
            with open(OUTPUT_FILE,"w") as f: json.dump(results, f, separators=(",",":"))
            elapsed = time.time()-start
            rate = processed/elapsed
            remaining = (len(to_process)-processed)/rate if rate>0 else 0
            print(f"  [{processed}/{len(to_process)}] ~{remaining/60:.1f}dk kaldı (son: {skin['name'][:35]} → {results.get(skin['name'])})")

        # Rate limit: 1.4 saniyede 1 istek
        elapsed_req = time.time() - req_start
        if elapsed_req < DELAY_BETWEEN_REQUESTS:
            time.sleep(DELAY_BETWEEN_REQUESTS - elapsed_req)

    with open(OUTPUT_FILE,"w") as f: json.dump(results, f, separators=(",",":"))
    print(f"\n✅ Bitti! {len(results)} başarılı, {failed} başarısız")
    print(f"⏱️  Toplam: {(time.time()-start)/60:.1f} dakika")


if __name__ == "__main__":
    main()
