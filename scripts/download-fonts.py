import urllib.request,pathlib,re
root=pathlib.Path('public/fonts');root.mkdir(parents=True,exist_ok=True)
for family,name in [('Barlow+Condensed:wght@700','barlow-condensed-bold'),('DM+Sans:wght@400..700','dm-sans')]:
 url=f'https://fonts.googleapis.com/css2?family={family}&display=swap'
 req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'})
 css=urllib.request.urlopen(req,timeout=60).read().decode()
 urls=re.findall(r'url\((https://[^)]+)\)',css)
 asset=urls[-1]
 data=urllib.request.urlopen(asset,timeout=60).read()
 (root/f'{name}.woff2').write_bytes(data)
 print(name,len(data),asset)
 license='https://github.com/google/fonts/blob/main/ofl/'+('barlowcondensed' if name.startswith('barlow') else 'dmsans')+'/OFL.txt'
 (root/f'{name}-LICENSE.txt').write_bytes(urllib.request.urlopen(license.replace('github.com','raw.githubusercontent.com').replace('/blob/','/'),timeout=60).read())
