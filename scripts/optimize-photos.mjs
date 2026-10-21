import sharp from 'sharp';
import {readdir,unlink,writeFile} from 'node:fs/promises';
for(const name of await readdir('public/images')){
 if(!name.endsWith('.jpg'))continue;
 const base=name.slice(0,-4),src=`public/images/${name}`;
 await sharp(src).rotate().resize({width:base==='hero'?1600:900,withoutEnlargement:true}).webp({quality:78}).toFile(`public/images/${base}.webp`);
 await sharp(src).rotate().resize({width:400}).webp({quality:70}).toFile(`public/images/${base}-sm.webp`);
 await sharp(src).rotate().resize({width:base==='hero'?1600:900}).avif({quality:52}).toFile(`public/images/${base}.avif`);
 await unlink(src);
}
await sharp({create:{width:512,height:512,channels:4,background:'#111310'}}).composite([{input:Buffer.from('<svg width="512" height="512"><text x="105" y="365" font-family="Georgia" font-weight="bold" font-size="340" fill="#d9ae72">G.</text></svg>')}]).png().toFile('public/icon-512.png');
await sharp('public/icon-512.png').resize(192).toFile('public/icon-192.png');
await writeFile('public/images/blur.txt','Photographs optimized locally with sharp.');
