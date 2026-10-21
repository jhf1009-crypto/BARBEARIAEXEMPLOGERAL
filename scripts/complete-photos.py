import urllib.request,re,pathlib,json,html,concurrent.futures
root=pathlib.Path('public/images')
pages={
 'service-5':'https://unsplash.com/photos/barber-cutting-mans-hair-idzUojjazCg',
 'service-6':'https://unsplash.com/photos/a-man-getting-his-hair-cut-at-a-barber-shop-XqVhINFvXK0',
 'service-7':'https://unsplash.com/photos/shallow-focus-photo-of-man-holding-scissors-taZSJ6xmt48',
 'service-8':'https://unsplash.com/photos/man-in-black-long-sleeve-shirt-cutting-hair-of-man-in-black-shirt-7Fxxt8Of_mc',
 'service-9':'https://unsplash.com/photos/a-man-with-a-beard-is-getting-his-hair-cut-cmoQYMqGgoI',
}
assets={'service-5':'photo-1520338661084-680395057c93','service-6':'photo-1653875700322-cf550d9a52ff','service-7':'photo-1553521041-d168abd31de3','service-8':'photo-1605497788245-3c047575d789','service-9':'photo-1639511177364-0866c0da16fa'}
def get(item):
 name,page=item
 try:
  # Asset URLs observed on the verified, freely licensed photo pages via web research.
  source='https://images.unsplash.com/'+assets[name]+'?auto=format&fit=crop&w=900&q=85'
  data=urllib.request.urlopen(source,timeout=90).read();(root/f'{name}.jpg').write_bytes(data)
  return {'file':name,'source':source,'photoPage':page,'license':'Unsplash License — https://unsplash.com/license','bytes':len(data)}
 except Exception as e:return {'file':name,'source':page,'error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:results=list(pool.map(get,pages.items()))
path=pathlib.Path('docs/PHOTO-SOURCES.json');records=json.loads(path.read_text(encoding='utf-8'));records=[r for r in records if r['file'] not in pages];records+=results
for r in records:
 if r.get('photoPage','').startswith('https://unsplash.com/photos/photo-'):r.pop('photoPage')
path.write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(results,ensure_ascii=False,indent=2))
