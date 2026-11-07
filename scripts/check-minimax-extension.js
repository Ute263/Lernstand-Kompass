const fs=require('fs'), vm=require('vm'), path=require('path'), assert=require('assert');
const source=fs.readFileSync(path.join(__dirname,'../models.js'),'utf8');
const context={console,window:{crypto:require('crypto').webcrypto},crypto:require('crypto').webcrypto};
vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../minimax-katalog-daten.js'),'utf8'),context,{filename:'minimax-katalog-daten.js'});vm.runInContext(source,context,{filename:'models.js'});
const check=vm.runInContext(`(function(){
 const provided=LK_MINIMAX_MATERIAL_ERGAENZUNG;
 const group=(g,p)=>provided.filter(x=>x.schoolYear===String(g)&&x.part===p);
 const allPages=(items)=>items.reduce((s,x)=>{for(let n=x.startPage;n<=x.endPage;n++)s.add(n);return s},new Set());
 const classId='school-class-a';
 const original=[{id:'custom-1',classId,catalogKey:'user-custom',subject:'Mathe',workbook:'Eigenes Heft',page:5}];
 const added=mergeDefaultWorkbookCatalogForClass(original,classId);
 const twice=mergeDefaultWorkbookCatalogForClass(added,classId);
 return {originalSafe:added[0]===original[0],once:added.length,twice:twice.length,extensionCount:provided.length,
 groups:[[1,'Zahlen und Rechnen Teil A',87],[1,'Zahlen und Rechnen Teil B',78],[1,'Geometrie',30],[1,'Größen und Sachrechnen',38],[3,'Zahlen und Rechnen Teil A',79],[3,'Zahlen und Rechnen Teil B',71],[3,'Geometrie',39],[3,'Größen und Sachrechnen',55],[4,'Zahlen und Rechnen Teil A',79],[4,'Zahlen und Rechnen Teil B',63],[4,'Geometrie',47],[4,'Größen und Sachrechnen',55]].map(([g,p,count])=>({g,p,count:allPages(group(g,p)).size,expected:count})),
 keysUnique:new Set(provided.map(x=>x.catalogKey)).size===provided.length,
 existed:DEFAULT_WORKBOOK_CATALOG.filter(x=>x.workbook==='MiniMax 2').length};
})()`,context);
assert(check.originalSafe,'Individuelle Einträge verändert');assert.equal(check.once,check.twice,'Migration erzeugt Duplikate');assert(check.keysUnique,'Katalogschlüssel nicht eindeutig');assert(check.existed>0,'MiniMax 2 fehlt');
check.groups.forEach(x=>assert.equal(x.count,x.expected,`Seitenabdeckung ${x.g} ${x.p}`));
console.log(`MiniMax-Erweiterung erfolgreich: ${check.extensionCount} Themen-/Bereichseinträge, ${check.groups.length} Heftgruppen, stabile Zusammenführung und erhaltenes MiniMax 2.`);
