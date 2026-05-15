"""
analyze_skin_colors.py

Downloads each CS2 skin image from Steam CDN and extracts dominant colors
using K-means clustering. Outputs a JSON mapping skin name -> color tags.

Usage:
    python3 analyze_skin_colors.py

Inputs:
    public/data/skins.json  (already in project)

Outputs:
    public/data/skin_colors.json  (new file, ~50KB)

Runtime: ~15-20 minutes for 2000+ skins (downloads + analysis)
"""
import json
import os
import sys
import time
from io import BytesIO
from concurrent.futures import ThreadPoolExecutor, as_completed

try:
    from PIL import Image
    import requests
    import numpy as np
except ImportError as e:
    print(f"\n❌ Eksik kütüphane: {e.name}")
    print(f"Şu komutla kur: pip3 install pillow requests numpy --break-system-packages\n")
    sys.exit(1)


# ============================================================
# K-MEANS RENK ÇIKARMA
# ============================================================

def kmeans_simple(pixels, k=5, max_iter=10):
    """Minimal K-means — numpy ile hızlı dominant renk bulma."""
    if len(pixels) == 0:
        return [], []
    # Rastgele k merkez seç
    idx = np.random.choice(len(pixels), size=min(k, len(pixels)), replace=False)
    centers = pixels[idx].astype(float)
    
    for _ in range(max_iter):
        # Her pikseli en yakın merkeze ata
        dists = np.linalg.norm(pixels[:, None, :] - centers[None, :, :], axis=2)
        labels = np.argmin(dists, axis=1)
        # Merkezleri güncelle
        new_centers = np.array([
            pixels[labels == i].mean(axis=0) if (labels == i).any() else centers[i]
            for i in range(len(centers))
        ])
        if np.allclose(centers, new_centers, atol=1.0):
            break
        centers = new_centers
    
    # Her kümenin pixel sayısını da döndür
    counts = np.array([(labels == i).sum() for i in range(len(centers))])
    return centers, counts


def rgb_to_hsv(r, g, b):
    """0-255 RGB -> H(0-360), S(0-1), V(0-1)"""
    r, g, b = r / 255.0, g / 255.0, b / 255.0
    mx = max(r, g, b)
    mn = min(r, g, b)
    df = mx - mn
    if df == 0:
        h = 0
    elif mx == r:
        h = (60 * ((g - b) / df) + 360) % 360
    elif mx == g:
        h = (60 * ((b - r) / df) + 120) % 360
    else:
        h = (60 * ((r - g) / df) + 240) % 360
    s = 0 if mx == 0 else df / mx
    v = mx
    return h, s, v


# ============================================================
# RENK ETİKETLEME (HSV uzayında)
# ============================================================

def classify_color(r, g, b, weight):
    """
    Bir RGB rengi alıp ['red', 'blue', ...] gibi etiketler döndürür.
    HSV uzayında çalışır (renk algısı için daha doğru).
    Weight = bu rengin görseldeki oranı (0-1).
    """
    h, s, v = rgb_to_hsv(r, g, b)
    tags = []
    
    # Düşük saturation (gri tonları) ve düşük value (siyah)
    if v < 0.18:
        tags.append('black')
        return tags
    if v > 0.88 and s < 0.12:
        tags.append('white')
        return tags
    if s < 0.18:
        # Gri ton — value'ya göre
        if v < 0.50:
            tags.append('black')
        elif v > 0.75:
            tags.append('white')
        return tags
    
    # AHŞAP/KABZA RENKLERİ — silah gövdesinin doğal kahve/tahta rengi
    # Hue 20-40 arasında, orta-düşük saturation, orta value
    # Bu aralık AK-47 tahta gövdesi, M4 plastik kabza, vs.
    is_wood = (
        20 <= h <= 40 and 
        0.25 <= s <= 0.65 and 
        0.25 <= v <= 0.60
    )
    if is_wood:
        # Tahta rengi etiketleme yapma — silah skin'inin asıl rengi değil
        return tags
    
    # Renk hue'una göre
    if h >= 345 or h <= 15:
        tags.append('red')
    elif h <= 40:
        # Sadece parlak turuncu (yüksek saturation + value) gerçek skin rengi
        if s > 0.55 and v > 0.55:
            tags.append('orange')
            if h >= 25:
                tags.append('gold')
    elif h <= 65:
        if v > 0.55:
            tags.append('gold')
        elif s > 0.45:
            tags.append('orange')
    elif h <= 165:
        tags.append('green')
    elif h <= 195:
        tags.append('blue')
        if s > 0.55 and v > 0.65:
            tags.append('neon')
    elif h <= 255:
        tags.append('blue')
    elif h <= 290:
        tags.append('purple')
    else:
        tags.append('pink')
        if s > 0.65 and v > 0.65:
            tags.append('neon')
    
    return tags


def extract_color_tags(rgb_clusters, counts):
    """
    K-means kümelerini renk etiketlerine dönüştür.
    Toplam ağırlık >= %15 olan renkleri etiketle.
    """
    total = counts.sum()
    if total == 0:
        return []
    
    tag_weights = {}  # tag -> toplam ağırlık
    for color, count in zip(rgb_clusters, counts):
        weight = count / total
        if weight < 0.06:  # %6'dan az olan kümeleri atla (vurgu renkleri yakalansın)
            continue
        r, g, b = int(color[0]), int(color[1]), int(color[2])
        for tag in classify_color(r, g, b, weight):
            tag_weights[tag] = tag_weights.get(tag, 0) + weight
    
    # En az %7 ağırlığı olan etiketleri al (vurgu/aksan renkleri için düşük eşik)
    final = [tag for tag, w in tag_weights.items() if w >= 0.07]
    
    # Cyberpunk/neon tespiti: hem mor/pembe hem mavi/cyan birlikte = cyberpunk
    has_cool_warm_mix = (
        ('purple' in final or 'pink' in final) and 
        ('blue' in final or 'neon' in final)
    )
    if has_cool_warm_mix and 'cyberpunk' not in final:
        final.append('cyberpunk')
    
    return final


# ============================================================
# GÖRSEL İŞLEME
# ============================================================

def remove_background(img_array):
    """
    Steam skin görselleri genelde şeffaf veya gri arka planlı.
    Köşelerdeki pikselleri "arka plan" olarak işaretle ve at.
    """
    h, w = img_array.shape[:2]
    # 4 köşeden örnekle
    corners = [
        img_array[0, 0],
        img_array[0, w - 1],
        img_array[h - 1, 0],
        img_array[h - 1, w - 1],
    ]
    bg_color = np.mean(corners, axis=0)
    
    # Arka plana yakın pikselleri filtrele (toleranslı)
    dist = np.linalg.norm(img_array - bg_color, axis=2)
    mask = dist > 25  # arka planla 25 birim üstü farklı olan pikseller
    return img_array[mask]


def analyze_image(url, timeout=15):
    """Bir skin görselini indir, baskın renklerini çıkar, etiketle."""
    try:
        r = requests.get(url, timeout=timeout)
        if r.status_code != 200:
            return None
        img = Image.open(BytesIO(r.content)).convert('RGB')
        # Hız için küçült
        img.thumbnail((96, 96))
        arr = np.array(img)
        
        # Arka planı temizle
        pixels = remove_background(arr)
        if len(pixels) < 50:
            # Çok az piksel kaldı — direkt orijinali kullan
            pixels = arr.reshape(-1, 3)
        
        # K-means dominant renk
        centers, counts = kmeans_simple(pixels, k=5)
        if len(centers) == 0:
            return []
        
        return extract_color_tags(centers, counts)
    except Exception as e:
        return None


# ============================================================
# ANA AKIŞ
# ============================================================

def main():
    # Proje klasöründe olduğumuzdan emin ol
    skins_path = 'public/data/skins.json'
    if not os.path.exists(skins_path):
        print(f"❌ {skins_path} bulunamadı.")
        print("Bu script'i loadoutlab klasöründen çalıştırmalısın:")
        print("   cd ~/Desktop/loadoutlab")
        print("   python3 analyze_skin_colors.py")
        sys.exit(1)
    
    with open(skins_path) as f:
        skins = json.load(f)
    
    print(f"📦 {len(skins)} skin yüklendi")
    
    # Mevcut sonuçlar varsa devam et (kesintide kaldığı yerden)
    out_path = 'public/data/skin_colors.json'
    results = {}
    if os.path.exists(out_path):
        with open(out_path) as f:
            results = json.load(f)
        print(f"♻️  {len(results)} skin önceden analiz edilmiş, devam ediliyor")
    
    to_process = [s for s in skins if s['name'] not in results]
    print(f"🎨 {len(to_process)} skin analiz edilecek\n")
    
    if not to_process:
        print("✅ Hepsi zaten analiz edilmiş!")
        return
    
    # Paralel indirme + analiz (10 thread, Steam CDN'i yormamak için)
    start = time.time()
    processed = 0
    
    def worker(skin):
        tags = analyze_image(skin['image'])
        return skin['name'], tags
    
    with ThreadPoolExecutor(max_workers=10) as pool:
        futures = {pool.submit(worker, s): s for s in to_process}
        for future in as_completed(futures):
            name, tags = future.result()
            results[name] = tags or []
            processed += 1
            
            # Her 50 skin'de bir ara kaydet (kesintiye karşı)
            if processed % 50 == 0:
                with open(out_path, 'w') as f:
                    json.dump(results, f, separators=(',', ':'))
                
                elapsed = time.time() - start
                rate = processed / elapsed
                remaining = (len(to_process) - processed) / rate if rate > 0 else 0
                print(f"  [{processed}/{len(to_process)}] "
                      f"~{remaining:.0f}sn kaldı  "
                      f"(son: {name[:40]} → {tags})")
    
    # Final kaydet
    with open(out_path, 'w') as f:
        json.dump(results, f, separators=(',', ':'))
    
    elapsed = time.time() - start
    print(f"\n✅ Bitti! {len(results)} skin analizi {elapsed:.0f} saniyede tamamlandı.")
    print(f"📁 Sonuç: {out_path}")
    
    # İstatistik
    from collections import Counter
    tag_counts = Counter()
    for tags in results.values():
        for t in tags:
            tag_counts[t] += 1
    print("\n📊 Renk dağılımı:")
    for tag, count in tag_counts.most_common():
        print(f"   {tag:12} {count:5d} skin")


if __name__ == '__main__':
    main()
