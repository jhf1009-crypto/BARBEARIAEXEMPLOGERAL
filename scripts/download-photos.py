"""Download licensed Unsplash photographs; optimization runs separately with sharp."""
import urllib.request, pathlib, json, concurrent.futures
photos = {
 'hero': ('photo-1503951914875-452162b0f3f1', 'Barbeiro trabalhando em um corte masculino'),
 'space': ('photo-1585747860715-2ba37e788b70', 'Interior de barbearia com cadeiras e espelhos'),
 'service-1': ('photo-1599351431202-1e0f0137899a', 'Corte masculino com máquina'),
 'service-2': ('photo-1622287162716-f311baa1a2b8', 'Acabamento de corte masculino'),
 'service-3': ('photo-1599351431202-1e0f0137899a', 'Cuidado com cabelo e barba'),
 'service-4': ('photo-1621605815971-fbc98d665033', 'Ferramentas de barbearia'),
 'barber-1': ('photo-1500648767791-00dcc994a43e', 'Retrato masculino'),
 'barber-2': ('photo-1506794778202-cad84cf45f1d', 'Retrato masculino'),
 'barber-3': ('photo-1535713875002-d1d0cf377fde', 'Retrato masculino'),
 'gallery-1': ('photo-1621605815971-fbc98d665033', 'Corte e acabamento'),
 'gallery-2': ('photo-1622287162716-f311baa1a2b8', 'Corte masculino'),
 'gallery-3': ('photo-1503951914875-452162b0f3f1', 'Barbeiro no trabalho'),
 'gallery-4': ('photo-1599351431202-1e0f0137899a', 'Cabelo e barba'),
 'gallery-5': ('photo-1585747860715-2ba37e788b70', 'O espaço'),
 'gallery-6': ('photo-1621605815971-fbc98d665033', 'Detalhes da barbearia'),
}
root=pathlib.Path('public/images');root.mkdir(parents=True,exist_ok=True)
def get(item):
 name,(photo,alt)=item
 url=f'https://images.unsplash.com/{photo}?auto=format&fit=crop&w={1600 if name=="hero" else 900}&q=85'
 try:
  req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'})
  with urllib.request.urlopen(req,timeout=90) as r: data=r.read()
  (root/f'{name}.jpg').write_bytes(data)
  return {'file':name,'source':url,'photoPage':f'https://unsplash.com/photos/{photo}','license':'Unsplash License — https://unsplash.com/license','alt':alt,'bytes':len(data)}
 except Exception as e:return {'file':name,'error':str(e),'source':url}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool: results=list(pool.map(get,photos.items()))
pathlib.Path('docs/PHOTO-SOURCES.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(results,ensure_ascii=False,indent=2))
