/* Rueda de Sol — suivi des élèves. Une seule page, rendue en JS sans dépendance. */
'use strict';
/* ---------- Référentiels ---------- */
const APP_VERSION='1.7.0';
const SCRIPT_BASE=document.currentScript?document.currentScript.src:location.href;
const TODAY = new Date(); TODAY.setHours(12,0,0,0);
const isoDay=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const TODAY_ISO=isoDay(TODAY);
const PILLARS = [
  {id:'mouv', name:'Mouvements', color:'var(--p-mouv)'},
  {id:'jeu',  name:'Jeu & roda', color:'var(--p-jeu)'},
  {id:'mus',  name:'Musique',    color:'var(--p-mus)'},
  {id:'cult', name:'Culture',    color:'var(--p-cult)'},
  {id:'phys', name:'Physique',   color:'var(--p-phys)'},
  {id:'contrib', name:'Contribution', color:'var(--p-contrib)', session:false},
];
const SPILL = PILLARS.filter(p=>p.session!==false); // piliers travaillés en séance
const P = Object.fromEntries(PILLARS.map(p=>[p.id,p]));
const LEVELS = ['Découverte','En cours','Acquis','Maîtrisé'];
const SKILLS = [
  // c = corde pendant laquelle on travaille la compétence (0 = débutant sans corde, 1 = corde blanche…)
  // Mouvements par paliers de deux cordes : c = première corde du palier, c2 = dernière. Facultatifs à partir de la rouge.
  ['mouv','ginga','Ginga',0,0,1],['mouv','esq','Esquivas (dont cocorinha)',0,0,1],['mouv','negativa','Negativa',0,0,1],
  ['mouv','mlf','Meia-lua de frente',0,0,1],['mouv','bencao','Bênção',0,0,1],['mouv','role','Rolê',0,0,1],
  ['mouv','doppio','Doppio',0,0,1],['mouv','dentrofora','Coups de pied circulaires de dentro et de fora',0,0,1],
  ['mouv','molla','Molla',0,0,1],['mouv','delado','De lado',0,0,1],['mouv','ponteira','Ponteira',0,0,1],
  ['mouv','queix','Queixada',2,1,3],['mouv','martelo','Martelo',2,1,3],['mouv','cab','Cabeçada',2,1,3],['mouv','bananeira','Bananeira',2,1,3],
  ['mouv','au','Aú',2,1,3],['mouv','mlc','Meia-lua de compasso',2,1,3],['mouv','cp1','Premier coup de pied',2,1,3],['mouv','cp2','Deuxième coup de pied',2,1,3],
  ['mouv','rast','Rasteira',4,1,5],['mouv','ponte','Ponte',4,1,5],['mouv','aufech','Aú fechado',4,1,5],['mouv','auesq','Aú esquadro',4,1,5],
  ['mouv','marchao','Martelo no chão',4,1,5],['mouv','queda','Queda de rins',4,1,5],['mouv','armada','Armada',4,1,5],
  ['mouv','au1in',"Aú d'une main, main intérieure",6,1,7],['mouv','corta','Corta-capim',6,1,7],['mouv','banchao','Bananeira no chão',6,1,7],
  ['mouv','macaco','Macaco',8,1],['mouv','au1out',"Aú d'une main, main extérieure",8,1],
  ['jeu','palmas','Battre des mains en rythme dans la roda',0],['jeu','roda','Entrer et sortir de la roda',0],
  ['jeu','s1','Série 1 du groupe',1],['jeu','regional','Jogo de Regional',1],
  ['jeu','s2','Série 2 du groupe',2],['jeu','angola','Jogo de Angola',2],
  ['jeu','s3','Série 3 du groupe',3],['jeu','chamada','Chamada (Angola)',3],
  ['jeu','s4','Série 4 du groupe',4],['jeu','malicia','Malícia',4],
  ['mus','coro','Répondre aux chœurs simples',0],
  ['mus','pandeiro','Pandeiro',1],['mus','agogo','Agogô / reco-reco',1],['mus','t_sbg','Toque São Bento Grande',1],
  ['mus','gunga','Berimbau gunga',2],['mus','atabaque','Atabaque',2],['mus','t_angola','Toque Angola',2],
  ['mus','medio','Berimbau médio',3],['mus','t_benguela','Toque Benguela',3],['mus','corridos','Chanter un corrido en soliste',3],
  ['mus','viola','Berimbau viola',4],['mus','t_iuna','Toque Iúna',5],['mus','ladainha','Chanter une ladainha',5],
  ['cult','salut','Saluer et respecter le pied du berimbau',0],['cult','port','Vocabulaire portugais de base',0],
  ['cult','hist','Histoire de la capoeira',1],['cult','mestres','Mestre Bimba et Mestre Pastinha',2],
  ['cult','rituels','Rituels de la roda',3],['cult','trad','Comprendre les cantigas',4],
  ['phys','soupl','Souplesse',0],['phys','gainage','Gainage',0],['phys','cardio','Endurance',1],
  // Contribution au groupe : valable à tous les niveaux
  ['contrib','accueil','Accueillir et héberger les visiteurs',0],
  ['contrib','anim','Animer la vie du groupe (verres, activités en dehors des entraînements)',0],
  ['contrib','entraide','Accompagner les débutants',0],
  ['contrib','orga','Aider à organiser (comptabilité, voyages, logistique, événements)',0],
  ['contrib','seance','Aider au bon déroulé des séances (instruments, clés des salles)',0],
  ['contrib','transmission','Animer une partie du cours',0],
  ['contrib','events','Participer aux événements (France ou étranger)',0],
].map(([p,id,name,c,opt,c2])=>Object.assign({p,id,name,c,opt:!!opt},c2!=null?{c2}:{}));
const REF_V=2; // version du référentiel par défaut (migration dans applyState)
const DEFAULT_SKILLS = JSON.parse(JSON.stringify(SKILLS));
const S = Object.fromEntries(SKILLS.map(s=>[s.id,s]));
const LEVELS_C = ['Pas encore','Parfois','Souvent','Pilier'];
const lvLabel=(id,l)=>(S[id]&&S[id].p==='contrib'?LEVELS_C:LEVELS)[l];

const WHITE='#FFFFFF';
const CORDAS = [
  {name:'Sans corde', sub:'Débutant', colors:null},
  {name:'Blanche', colors:[WHITE]},
  {name:'Rouge', colors:['#D7322B']},
  {name:'Orange', colors:['#F0832E']},
  {name:'Jaune', colors:['#F2C230']},
  {name:'Verte', colors:['#3D9A4F']},
  {name:'Bleue', colors:['#2F6FC0']},
  {name:'Indigo', colors:['#3B3A8F']},
  {name:'Violette', sub:'Instructeur', colors:['#7A3E9D']},
  {name:'Blanche aux pointes de couleurs', sub:'Professeur', colors:'multi'},
  {name:'Blanche', sub:'Contre-mestre', colors:[WHITE]},
  {name:'Sans corde', sub:'Mestre', colors:null},
];
/* Passage de corde : au moins 1 an dans sa corde. Le reste (référentiel, contribution, présence) sert de repère, sans bloquer. */
const STEPS = {1:{},2:{},3:{},4:{},5:{},6:{},7:{},8:{}};

/* ---------- Données d'exemple ---------- */
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const R = rng(7);
const days=(a,b)=>Math.round((b-a)/864e5);
const AV = ['#C0392B','#D35400','#1F7A8C','#7D5A2B','#5E7130','#8E3B5E','#3B5BA5','#B8860B'];
// apelido, nom, arrivée, corde, assiduité, contribution (0-3), date de la dernière corde (batizados en juin)
const PEOPLE = [
  ['Pimenta','Léa Martin','2021-04-13',3,.9,1.6,'2024-06-15'],['Beija-flor','Hugo Bernard','2023-01-10',2,.85,1.2,'2025-06-14'],
  ['Sabiá','Inès Petit','2024-01-16',1,.8,2.2,'2025-06-14'],['Coruja','Nathan Robert','2021-03-09',4,.75,2.4,'2025-06-14'],
  ['Jabuti','Camille Durand','2025-02-11',1,.7,2.3,'2026-06-13'],['Tatu','Yanis Moreau','2023-02-07',2,.0,0.8,'2025-06-14'],
  ['Brisa','Sarah Laurent','2025-10-07',0,.9,0.6,null],['Gato Preto','Théo Simon','2025-09-16',0,.65,1.8,null],
  ['Formiga','Manon Michel','2020-10-06',3,.6,2.9,'2024-06-15'],['Sereia','Jade Lefèvre','2025-06-03',1,.85,1.0,'2026-06-13'],
  ['Cigarra','Lucas Garcia','2026-10-06',0,.95,0.2,null],['Vento','Chloé Roux','2024-03-05',1,.55,1.4,'2025-06-14'],
];
/* Remplit l'appli avec 12 élèves et 8 semaines de séances fictives, pour essayer. */
function buildSample(){
  const CONTRIBS = {
    Formiga:[['2026-06-13',"A organisé les repas du batizado"],['2026-10-18',"A hébergé deux capoeiristes venus de Lisbonne pour le week-end de roda"]],
    Jabuti:[['2026-11-12',"A réparé le pandeiro et changé l'arame du gunga"]],
    Sabiá:[['2026-11-05',"A accompagné Cigarra pendant ses premières séances"]],
    Coruja:[['2026-11-19',"A animé l'échauffement et la série 2"]],
    'Gato Preto':[['2026-09-27',"A hébergé un élève du groupe de Barcelone"]],
  };
  const sts = PEOPLE.map(([apelido,nom,arrivee,corda,assid,cb,last],i)=>{
    const levels={};
    SKILLS.forEach(s=>{
      let base;
      if(s.p==='contrib') base = cb + R()*1.4-0.7;
      else {
        const diff=corda-s.c;
        base = diff>0 ? 2.2+0.35*diff : diff===0 ? 1.4 : diff===-1 ? 0.4 : -0.5;
        base += R()*1.2-0.6;
        if(s.p==='mus' && i%3===1) base-=0.7;
        if(s.opt && i%2===0) base-=1.5;
        if(diff===0 && (apelido==='Sereia'||apelido==='Pimenta')) base+=1;
      }
      levels[s.id]=Math.max(0,Math.min(3,Math.round(base)));
    });
    const hist=[];
    if(last){const y=+last.slice(0,4);for(let c=1;c<=corda;c++)hist.push({corda:c,date:(y-(corda-c))+last.slice(4),event:'Batizado'})}
    const contribs=(CONTRIBS[apelido]||[]).map(([date,text])=>({date,text}));
    // date à laquelle chaque niveau actuel a été atteint, et derniers changements (exemples)
    const since={}, lvlHist=[]; const a0=new Date(arrivee+'T12:00:00').getTime(), span=TODAY.getTime()-a0;
    SKILLS.forEach(s=>{ if(levels[s.id]>0){ const d=isoDay(new Date(a0+span*(0.35+0.65*R()))); since[s.id]=d;
      if(days(new Date(d+'T12:00:00'),TODAY)<=120) lvlHist.push({sk:s.id,from:levels[s.id]-1,to:levels[s.id],date:d}); }});
    lvlHist.sort((x,y)=>x.date.localeCompare(y.date));
    return {id:'e'+i,apelido,nom,arrivee,corda,levels,hist,assid,color:AV[i%AV.length],notes:'',contribs,since,lvlHist};
  });
  // Séances : lundi (tatami) et mercredi (miroir), 8 dernières semaines
  const PLANS={1:[[['acro',20],['equil',10],['coups',15],['roda',15]],[['acro',20],['chao',10],['angola',15],['roda',15]],[['acro',20],['floreio',10],['series',15],['roda',15]]],
               3:[[['combo',20],['series',15],['roda',15],['cult',10]],[['miroir',10],['combo',15],['series',20],['roda',15]],[['combo',20],['series',20],['roda',20]]]};
  const build=plan=>[mkBlock(WARM),...plan.map(([k,m])=>mkBlock(LIBK[k],m)),mkBlock(MUSIC),mkBlock(CLOSE)];
  let sid=0; const ses=[];
  for(let w=8;w>=0;w--){
    for(const dow of [1,3]){
      const d=new Date(TODAY); d.setDate(d.getDate()-w*7-((d.getDay()+6)%7)+(dow-1));
      if(isoDay(d)>=TODAY_ISO) continue;
      const plan=PLANS[dow][sid%3];
      const present=sts.filter(s=>new Date(s.arrivee)<=d && (s.apelido!=='Tatu'||w>4) && R()<(s.apelido==='Tatu'?.8:s.assid)).map(s=>s.id);
      ses.push({id:'s'+(sid++),date:isoDay(d),time:settings.time,blocks:build(plan),present,done:true});
    }
  }
  ses.push({id:'x-today',date:TODAY_ISO,time:settings.time,done:false,present:[],blocks:build([['miroir',10],['combo',15],['series',20],['roda',15]])});
  ses.push({id:'x-next',date:nextTraining(true),time:settings.time,done:false,present:[],blocks:fixedBlocks()});
  const st=n=>sts.find(x=>x.apelido===n);
  Object.assign(st('Tatu'),{status:'pause',statusNote:'Blessure au genou, retour prévu en janvier'});
  Object.assign(st('Vento'),{status:'inactif',statusNote:'A déménagé à Lyon'});
  return {students:sts.filter(x=>x.status!=='inactif'),archived:sts.filter(x=>x.status==='inactif'),sessions:ses};
}
const students=[]; const sessions=[];

/* ---------- Calculs ---------- */
const archived=[]; // élèves inactifs : hors de la liste et de l'appel, rien n'est effacé
const byId=id=>students.find(s=>s.id===id)||archived.find(s=>s.id===id);
const STATUS={actif:'Actif',pause:'En pause',inactif:'Inactif'};
function setStatus(st,status,note){
  const was=st.status||'actif'; st.status=status; st.statusNote=note||'';
  if(status==='inactif'&&was!=='inactif'){students.splice(students.indexOf(st),1);archived.push(st)}
  if(status!=='inactif'&&was==='inactif'){archived.splice(archived.indexOf(st),1);students.push(st)}
}
const statusPill=st=>st.status==='pause'?'<span class="pill warn">En pause</span>':st.status==='inactif'?'<span class="pill neutral">Inactif</span>':'';
const sess=id=>sessions.find(s=>s.id===id);
function seniority(date){const d=new Date(date);let m=(TODAY.getFullYear()-d.getFullYear())*12+TODAY.getMonth()-d.getMonth();const y=Math.floor(m/12);m%=12;
  return (y?y+(y>1?' ans':' an'):'')+(y&&m?' ':'')+(m?m+' mois':'')||'Ce mois-ci'}
const fmt=d=>new Date(d+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
/* Anniversaire : date de naissance facultative (AAAA-MM-JJ). */
function bdayIn(st){ if(!st.naissance) return null; const [,m,d]=st.naissance.split('-').map(Number);
  let n=new Date(TODAY.getFullYear(),m-1,d,12); if(n<new Date(TODAY.getFullYear(),TODAY.getMonth(),TODAY.getDate(),0)) n=new Date(TODAY.getFullYear()+1,m-1,d,12);
  return {days:Math.round((n-new Date(TODAY.getFullYear(),TODAY.getMonth(),TODAY.getDate(),12))/864e5),date:n,age:n.getFullYear()-(+st.naissance.slice(0,4))}; }
const bdayTxt=st=>{const b=bdayIn(st);if(!b)return '';return `Anniversaire le ${new Date(st.naissance+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'long'})} (${b.age-(b.days?1:0)} ans)`};
const fmtL=d=>new Date(d+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
const done=()=>sessions.filter(s=>s.done).sort((a,b)=>a.date.localeCompare(b.date));
function presences(st){return done().filter(s=>s.present.includes(st.id))}
function lastSeen(st){const p=presences(st);return p.length?p[p.length-1].date:null}
function rate(st){const eligible=done().filter(s=>new Date(s.date)>=new Date(st.arrivee));if(!eligible.length)return null;return Math.round(100*presences(st).length/eligible.length)}
const scope=(st,p)=>SKILLS.filter(s=>s.c<=st.corda&&!s.opt&&(!p||s.p===p));
function pillarAvg(st,p){const sk=scope(st,p);return sk.length?sk.reduce((a,s)=>a+st.levels[s.id],0)/sk.length:0}
function lastCorda(st){return st.hist.length?st.hist[st.hist.length-1].date:st.arrivee}
const contribLabel=v=>v>=2.5?'Très forte':v>=1.8?'Forte':v>=1?'Moyenne':'Discrète';
function readiness(st){
  if(!STEPS[st.corda+1]) return null;
  const since=lastCorda(st); const months=Math.floor((TODAY-new Date(since+'T12:00:00'))/(864e5*30.4));
  const ref=SKILLS.filter(s=>s.c<=st.corda&&st.corda<=(s.c2??s.c)&&!s.opt&&s.p!=='contrib'); const acq=ref.filter(s=>st.levels[s.id]>=2);
  return {to:st.corda+1,since,months,eligible:months>=12,ref,acq,contrib:pillarAvg(st,'contrib'),pres:rate(st)};
}
const hm=m=>m>=60?`${Math.floor(m/60)}h${m%60?String(m%60).padStart(2,'0'):''}`:`${m} min`;
const split=b=>({cours:b.filter(x=>x.p!=='mus').reduce((a,x)=>a+x.min,0),mus:b.filter(x=>x.p==='mus').reduce((a,x)=>a+x.min,0)});
const fmtDur=b=>{const d=split(b);return `${hm(d.cours)} + ${d.mus} min musique`};
const monthYear=d=>new Date(d+'T12:00:00').toLocaleDateString('fr-FR',{month:'short',year:'numeric'});
function workedCount(st,sk){return done().filter(se=>se.present.includes(st.id)&&se.blocks.some(b=>b.skills.includes(sk))).length}
function lvInfo(st,sk){
  const l=st.levels[sk], parts=[lvLabel(sk,l)+(l>0&&st.since&&st.since[sk]?` depuis ${monthYear(st.since[sk])}`:'')];
  if(S[sk].p!=='contrib'){const n=workedCount(st,sk); parts.push(n?`travaillée ${n} fois`:'pas encore travaillée');}
  return parts.join(' · ');
}
function setLevel(st,sk,l){
  const from=st.levels[sk]; if(from===l) return; st.levels[sk]=l;
  const h=st.lvlHist; let i=h.length-1; while(i>=0&&!(h[i].sk===sk&&h[i].date===TODAY_ISO)) i--;
  if(i>=0){h[i].to=l; if(h[i].from===l) h.splice(i,1)} else h.push({sk,from,to:l,date:TODAY_ISO});
  if(l>0) st.since[sk]=TODAY_ISO; else delete st.since[sk];
}
function balance(daysBack=30){
  const from=new Date(TODAY);from.setDate(from.getDate()-daysBack);
  const tot={};SPILL.forEach(p=>tot[p.id]=0);
  done().filter(s=>new Date(s.date)>=from).forEach(s=>s.blocks.forEach(b=>tot[b.p]+=b.min));
  return tot;
}

/* ---------- Séances : blocs modulables et conseils ---------- */
// Chaque séance : 20 min d'échauffement et renforcement, 1h de blocs au choix, 30 min de musique,
// puis 10 min de salutation finale et d'étirements.
const FOCUS={
  tatami:{name:'Tatami',long:'Tatami : acrobaties et jeu au sol',must:['acro']},
  miroir:{name:'Miroir et parquet',long:'Miroir et parquet : combos à deux, séries et roda',must:['combo','series','roda']},
};
const WARM={k:'warm',p:'phys',title:'Échauffement et renforcement musculaire',min:20,skills:['cardio','gainage','soupl'],fixed:'start'};
const MUSIC={k:'mus',p:'mus',title:'Musique',min:30,skills:[],fixed:'end'};
const CLOSE={k:'close',p:'phys',title:'Salutation finale et étirements',min:10,skills:['soupl'],fixed:'close'};
const FIXED_LABEL={start:'Début de séance',end:'Après le cours',close:'Fin de séance'};
const LIB=[
  {k:'acro',p:'mouv',title:'Acrobaties au sol : aú, rolê, negativa',min:20,skills:['au','role','negativa'],where:'tatami'},
  {k:'equil',p:'mouv',title:'Bananeira et équilibres (facultatif)',min:15,skills:['bananeira','banchao','au','aufech','auesq'],where:'tatami',opt:true},
  {k:'floreio',p:'mouv',title:'Macaco et floreios (facultatif)',min:15,skills:['macaco','au1in','au1out','queda','ponte'],where:'tatami',opt:true},
  {k:'chao',p:'mouv',title:'Jeu au sol et transitions',min:15,skills:['negativa','role','esq','delado','molla','rast','marchao','corta'],where:'tatami'},
  {k:'combo',p:'jeu',title:'Combos à deux : attaque et esquive',min:20,skills:['esq','armada','queix','mlc','martelo','bencao','cab','rast'],where:'miroir'},
  {k:'series',p:'jeu',title:'Séries du groupe',min:20,skills:['s1','s2','s3','s4'],where:'miroir'},
  {k:'miroir',p:'mouv',title:'Technique au miroir : ginga et coups de pied',min:15,skills:['ginga','mlf','dentrofora','ponteira','bencao','queix','armada'],where:'miroir'},
  {k:'roda',p:'jeu',title:'Roda',min:20,skills:['roda','palmas','regional','angola','coro'],where:'miroir'},
  {k:'angola',p:'jeu',title:'Jogo de Angola : chamada et malícia',min:20,skills:['angola','chamada','malicia']},
  {k:'coups',p:'mouv',title:'Coups de pied tournants',min:20,skills:['dentrofora','queix','mlc','martelo','cp1','cp2','armada']},
  {k:'esquivas',p:'mouv',title:'Ginga, esquivas et déplacements',min:15,skills:['ginga','esq','delado','doppio']},
  {k:'cult',p:'cult',title:'Culture : histoire, mestres, rituels',min:10,skills:['hist','mestres','rituels','port']},
  {k:'soupl',p:'phys',title:'Souplesse et étirements',min:10,skills:['soupl']},
  {k:'libre',p:'mouv',title:'Bloc libre',min:15,skills:[]},
];
const LIBK=Object.fromEntries([WARM,MUSIC,CLOSE,...LIB].map(b=>[b.k,b]));
const weekday=date=>new Date(date+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'long'});
const cap=t=>t.charAt(0).toUpperCase()+t.slice(1);
const dayFocus=date=>(settings.focus||{})[new Date(date+'T12:00:00').getDay()]||'';
const pool=()=>students.filter(s=>s.status!=='pause');
// nombre d'élèves pour qui la compétence est au programme de leur corde et pas encore acquise
function need(sk){const s=S[sk]; if(!s) return 0; return pool().filter(st=>s.c<=st.corda&&(st.levels[sk]||0)<2).length}
function sinceWorked(sk,before){const l=done().filter(se=>se.date<before&&se.blocks.some(b=>b.skills.includes(sk))).pop(); return l?days(new Date(l.date+'T12:00:00'),new Date(before+'T12:00:00')):null}
function mkBlock(t,min){
  const b={k:t.k,p:t.p,title:t.title,min:min||t.min,skills:t.skills.filter(x=>S[x])}; if(t.fixed) b.fixed=t.fixed;
  if(t.k==='series'){const s=b.skills.filter(x=>need(x)>0); if(s.length) b.skills=s;}
  return b;
}
const fixedBlocks=()=>[mkBlock(WARM),mkBlock(MUSIC),mkBlock(CLOSE)];
/* Conseils : quels blocs ajouter, et pourquoi.
   Score = besoin du groupe (compétences pas encore acquises, pondérées par le temps depuis le dernier travail)
         + orientation du jour (tatami ou miroir) + rattrapage d'un pilier délaissé ce mois-ci. */
function advice(d){
  const n=pool().length, f=dayFocus(d.date), have=new Set(d.blocks.map(b=>b.k));
  const bal=balance(), tot=Object.values(bal).reduce((a,b)=>a+b,0);
  return LIB.filter(t=>t.k!=='libre'&&!have.has(t.k)).map(t=>{
    let best=null, score=0; const why=[];
    t.skills.forEach(sk=>{ if(!S[sk]||!n) return; const nd=need(sk), since=sinceWorked(sk,d.date);
      const v=(nd/n)*(0.4+0.6*(since==null?1:Math.min(1,since/21)))*(S[sk].opt?0.5:1);
      score+=v; if(nd&&(!best||v>best.v)) best={sk,v,nd,since}; });
    score/=Math.max(1,Math.sqrt(t.skills.length));
    const fit=!!(f&&t.where===f); if(fit) score+=1;
    else if(t.where==='tatami') score*=0.5;
    if(tot&&bal[t.p]/tot<.08){ score+=.4; why.push(`${P[t.p].name} : moins de 8 % du temps de cours ce mois-ci`); }
    if(best) why.push(`${S[best.sk].name} : ${best.nd} élève${best.nd>1?'s':''} sur ${n} ne l'${best.nd>1?'ont':'a'} pas encore acquis${best.since==null?', jamais travaillé':best.since>=14?`, pas travaillé depuis ${best.since} jours`:''}`);
    return {t,score,why,fit};
  }).sort((a,b)=>b.score-a.score);
}
/* Alerte : blocs pas travaillés depuis 3 semaines (environ 6 séances).
   Ignore les blocs facultatifs, les blocs de tatami un jour sans tatami, et ceux déjà dans la séance.
   Pas d'alerte tant qu'il n'y a pas 3 semaines d'historique. */
const STALE=21;
function staleBlocks(d){
  const ds=done(); const ref=new Date(d.date+'T12:00:00');
  if(!ds.length||days(new Date(ds[0].date+'T12:00:00'),ref)<STALE) return [];
  const f=dayFocus(d.date), have=new Set(d.blocks.map(b=>b.k));
  return LIB.filter(t=>t.k!=='libre'&&!t.opt&&!have.has(t.k)&&!(t.where==='tatami'&&f!=='tatami')).map(t=>{
    const l=ds.filter(se=>se.date<d.date&&se.blocks.some(b=>b.k===t.k)).pop();
    return {t,since:l?days(new Date(l.date+'T12:00:00'),ref):null};
  }).filter(x=>x.since==null||x.since>=STALE).sort((a,b)=>(b.since??1e9)-(a.since??1e9));
}
const sinceTxt=n=>n==null?'jamais travaillé':`pas travaillé depuis ${n>=14?Math.round(n/7)+' semaines':n+' jours'}`;
/* Séance complète proposée : échauffement, blocs du jour, blocs conseillés, roda, musique, salutation. 1h de blocs. */
function proposePlan(d){
  const f=dayFocus(d.date), mid=[]; let left=60;
  const add=k=>{const t=LIBK[k]; if(!t||mid.some(b=>b.k===k)) return; const m=Math.min(t.min,left); if(m<10) return; mid.push(mkBlock(t,m)); left-=m};
  ((FOCUS[f]&&FOCUS[f].must)||[]).forEach(add);
  const ranked=advice({date:d.date,blocks:mid});
  if(f==='tatami'){const x=ranked.find(a=>a.t.where==='tatami'&&!mid.some(b=>b.k===a.t.k)); if(x) add(x.t.k);}
  const roda=!mid.some(b=>b.k==='roda'); if(roda) left-=15;
  for(const a of ranked){ if(left<10) break; if(a.t.k!=='roda') add(a.t.k); }
  if(roda){ left+=15; add('roda'); }
  mid.sort((a,b)=>(a.k==='roda')-(b.k==='roda'));
  if(left>0&&mid.length) mid[mid.length-1].min+=left;
  d.blocks=[mkBlock(WARM),...mid,mkBlock(MUSIC),mkBlock(CLOSE)];
}
/* Une séance n'a pas de titre : on la résume par ses blocs principaux. */
function sessionLabel(s){
  const mid=s.blocks.filter((b,i)=>!b.fixed&&b.p!=='mus'&&!(i===0&&b.p==='phys'));
  if(!mid.length) return 'Séance à préparer';
  return mid.slice(0,3).map(b=>b.title.split(/\s*[:(]/)[0].trim()).join(' · ');
}

/* ---------- Réglages et sauvegarde ---------- */
let settings={days:[1,3],time:'19:30',lastExport:null,focus:{1:'tatami',3:'miroir'}};
let sample=false, loaded=false;
const DAYS=[[1,'Lun'],[2,'Mar'],[3,'Mer'],[4,'Jeu'],[5,'Ven'],[6,'Sam'],[0,'Dim']];
function nextTraining(strictlyAfter){
  const d=new Date(TODAY);
  for(let k=strictlyAfter?1:0;k<=7;k++){const x=new Date(TODAY);x.setDate(d.getDate()+k);if(settings.days.includes(x.getDay()))return isoDay(x)}
  return TODAY_ISO;
}
/* Référentiel v2 (nov. 2026) : nouveaux mouvements par paliers et nouvelle contribution.
   Les compétences ajoutées à la main sont gardées ; les niveaux notés suivent quand une compétence est fusionnée ou renommée. */
const OLD_REF=['ginga','esq','cocor','negativa','mlf','au','bencao','armada','queix','role','martelo','mlc','cab','bananeira','rast','macaco',
  'accueil','entraide','orga','instru','transmission','vie'];
const REF_MAP={cocor:'esq',instru:'seance',vie:'events'};
function migrateRef(people){
  const keep=SKILLS.filter(s=>!((s.p==='mouv'||s.p==='contrib')&&OLD_REF.includes(s.id)));
  const fresh=JSON.parse(JSON.stringify(DEFAULT_SKILLS)).filter(s=>s.p==='mouv'||s.p==='contrib');
  SKILLS.splice(0,SKILLS.length,...fresh.filter(s=>s.p==='mouv'),...keep.filter(s=>!fresh.some(f=>f.id===s.id)),...fresh.filter(s=>s.p==='contrib'));
  people.forEach(x=>{
    const lv=x.levels||{};
    Object.entries(REF_MAP).forEach(([a,b])=>{ if(lv[a]>(lv[b]||0)){ lv[b]=lv[a]; if(x.since&&x.since[a]) x.since[b]=x.since[a]; } delete lv[a]; if(x.since) delete x.since[a]; });
    (x.lvlHist||[]).forEach(h=>{ if(REF_MAP[h.sk]) h.sk=REF_MAP[h.sk]; });
  });
}
function snapshot(){return {app:'rueda-de-sol',v:1,savedAt:new Date().toISOString(),localSavedAt,students,archived,sessions,skills:SKILLS,settings,sample}}
function applyState(st){
  students.splice(0,students.length,...(st.students||[]));
  archived.splice(0,archived.length,...(st.archived||[]));
  sessions.splice(0,sessions.length,...(st.sessions||[]));
  SKILLS.splice(0,SKILLS.length,...(st.skills&&st.skills.length?st.skills:JSON.parse(JSON.stringify(DEFAULT_SKILLS))));
  const old=st.settings||{};
  if(st.skills&&st.skills.length&&(old.refV||1)<REF_V) migrateRef([...(st.students||[]),...(st.archived||[])]);
  Object.keys(S).forEach(k=>delete S[k]); SKILLS.forEach(s=>S[s.id]=s);
  [...students,...archived].forEach(x=>{x.levels=x.levels||{};x.since=x.since||{};x.lvlHist=x.lvlHist||[];x.contribs=x.contribs||[];x.hist=x.hist||[];SKILLS.forEach(s=>{if(x.levels[s.id]==null)x.levels[s.id]=0})});
  settings=Object.assign({days:[1,3],time:'19:30',lastExport:null},old,{refV:REF_V});
  // anciens réglages par défaut (mardi et jeudi) : passage au lundi (tatami) et mercredi (miroir)
  if(!old.focus){ if(String(old.days)==='2,4') settings.days=[1,3]; settings.focus={1:'tatami',3:'miroir'}; }
  sample=!!st.sample;
}
/* Enregistrement local : seulement quand les données ont changé (pas à chaque changement d'écran). */
let saveT=null, lastSavedJson=null, localSavedAt=0, syncUid=null, sentPhotos={};
const dataJson=()=>JSON.stringify({students,archived,sessions,skills:SKILLS,settings,sample});
const saveMeta=()=>idbSet('meta',{localSavedAt,syncUid,sentPhotos}).catch(()=>{});
function saveNow(opts={}){
  clearTimeout(saveT); saveT=null; if(!loaded) return Promise.resolve();
  const j=dataJson(); if(j===lastSavedJson&&!opts.force) return Promise.resolve();
  lastSavedJson=j; if(!opts.keepStamp) localSavedAt=Date.now();
  return idbSet('state',JSON.parse(JSON.stringify(snapshot()))).then(saveMeta).then(()=>{if(!opts.keepStamp) schedulePush()})
    .catch(err=>{console.error(err);toast("L'enregistrement sur ce téléphone a échoué. Exporte une sauvegarde depuis les réglages.")});
}
function scheduleSave(){clearTimeout(saveT);saveT=setTimeout(saveNow,300)}

/* ---------- Compte en ligne (Firebase, facultatif) ---------- */
const cloud={enabled:!!window.FIREBASE_CONFIG,mod:null,user:null,authKnown:false,status:'off',lastSync:null,error:''};
let pushT=null;
const refreshCloud=()=>{updateGate(); if(view.name==='settings'&&!gateMode)keep()};
async function cloudStart(){
  if(!cloud.enabled) return;
  try{ cloud.mod=await import(new URL('sync.js?v='+APP_VERSION,SCRIPT_BASE).href); }
  catch(e){ console.warn(e); cloud.status='offline'; refreshCloud(); return; }
  cloud.status='off';
  cloud.mod.start(window.FIREBASE_CONFIG,u=>{cloud.user=u; cloud.authKnown=true; if(u) cloudConnect(); else {cloud.status='off'; refreshCloud()}});
  cloud.mod.redirectError().then(x=>{ if(x&&!AUTH_SILENT.includes(x.code)) toast(AUTH_ERR[x.code]||'La connexion Google a échoué. Réessaie.') });
}
function cloudFail(e){
  console.error(e);
  if(!navigator.onLine){cloud.status='offline';return}
  cloud.status='error';
  cloud.error=e&&e.code==='unavailable'?"la base en ligne ne répond pas (vérifie que Firestore Database est bien créée dans Firebase)":e&&e.message==='trop-gros'?"les données dépassent la taille maximale d'une copie en ligne":e&&e.code==='permission-denied'?"accès refusé (vérifie les règles Firestore)":"la copie en ligne n'a pas pu être mise à jour";
}
async function cloudPull(){
  const st=await cloud.mod.pull(cloud.user.uid);
  applyState(st); localSavedAt=st.localSavedAt||Date.now(); syncUid=cloud.user.uid;
  sentPhotos={}; [...students,...archived].forEach(x=>{if(x.photo)sentPhotos[x.id]=x.photo.length+':'+x.photo.slice(-40)});
  await saveNow({force:true,keepStamp:true});
  cloud.status='ok'; cloud.lastSync=Date.now(); render();
}
async function cloudPush(){
  if(!cloud.user||!cloud.mod) return;
  clearTimeout(pushT); pushT=null;
  if(sample){ cloud.status='sample'; refreshCloud(); return; } // les données d'exemple ne partent jamais en ligne
  cloud.status='syncing'; refreshCloud();
  try{ await cloud.mod.push(cloud.user.uid,JSON.parse(JSON.stringify(snapshot())),sentPhotos); syncUid=cloud.user.uid; await saveMeta(); cloud.status='ok'; cloud.lastSync=Date.now(); }
  catch(e){ cloudFail(e); }
  refreshCloud();
}
function schedulePush(){ if(!cloud.user||sample) return; clearTimeout(pushT); pushT=setTimeout(cloudPush,2000); }
async function cloudConnect(){
  if(!cloud.user||!cloud.mod) return;
  cloud.status='syncing'; refreshCloud();
  try{
    const remote=await cloud.mod.remoteStamp(cloud.user.uid);
    const hasLocal=!sample&&(students.length||archived.length||sessions.length);
    if(!remote){ await cloudPush(); }
    else if(syncUid!==cloud.user.uid){ if(hasLocal){ mergeSheet(remote); cloud.status='off'; } else await cloudPull(); }
    else if((remote.localSavedAt||0)>localSavedAt){ await cloudPull(); toast('Données mises à jour depuis la copie en ligne'); }
    else if((remote.localSavedAt||0)<localSavedAt){ await cloudPush(); }
    else { cloud.status='ok'; cloud.lastSync=Date.now(); }
  }catch(e){ cloudFail(e); }
  refreshCloud();
}
function mergeSheet(remote){
  const when=remote.localSavedAt?new Date(remote.localSavedAt).toLocaleString('fr-FR',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'}):'date inconnue';
  openSheet(`<form class="sheet" id="mergeform" aria-label="Choisir les données à garder">
    <h2>Quelles données garder ?</h2>
    <p style="margin:0">Une copie en ligne existe déjà (${esc(when)}, ${remote.students||0} élèves, ${remote.sessions||0} séances).</p>
    <p style="margin:0">Ce téléphone a aussi des données : ${students.length+archived.length} élèves, ${sessions.length} séances.</p>
    <p class="muted" style="margin:0">Les données non gardées seront remplacées. Exporte d'abord une sauvegarde si tu as un doute.</p>
    <div class="btns"><button type="button" class="btn" data-act="keeplocal">Garder ce téléphone</button><button type="button" class="btn primary" data-act="keepremote">Récupérer la copie en ligne</button></div>
  </form>`);
}
const AUTH_ERR={'auth/invalid-credential':'E-mail ou mot de passe incorrect.','auth/wrong-password':'E-mail ou mot de passe incorrect.','auth/user-not-found':'E-mail ou mot de passe incorrect.','auth/invalid-email':"Cette adresse e-mail n'est pas valide.",'auth/too-many-requests':'Trop de tentatives. Réessaie dans quelques minutes.','auth/network-request-failed':'Pas de réseau. Réessaie une fois connecté·e.','auth/unauthorized-domain':"Ce site n'est pas dans les domaines autorisés de Firebase (Authentication › Paramètres).",'auth/operation-not-allowed':"Ce mode de connexion n'est pas activé dans Firebase.",'auth/admin-restricted-operation':"Aucun compte n'existe encore pour cette adresse, et la création de compte est désactivée dans Firebase.",'auth/email-already-in-use':'Un compte existe déjà avec cette adresse : utilise « Se connecter », ou Google si tu l\'as créé avec Google.','auth/weak-password':'Mot de passe trop court : 6 caractères minimum.','auth/account-exists-with-different-credential':'Un compte existe déjà avec cette adresse : connecte-toi avec ton e-mail et ton mot de passe.'};
const AUTH_SILENT=['auth/popup-closed-by-user','auth/cancelled-popup-request','auth/user-cancelled'];
const G_LOGO='<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
function accountCard(){
  const head='<section class="card"><h2>Compte en ligne</h2>';
  if(!cloud.enabled) return head+`<span class="muted" style="font-size:.875rem">La copie en ligne n'est pas encore configurée pour cette appli.</span></section>`;
  if(!cloud.user) return head+`<span class="muted" style="font-size:.875rem">${cloud.status==='offline'?'Pas de réseau : la connexion au compte sera possible au retour du réseau. Tes données restent sur ce téléphone.':'Chargement…'}</span></section>`;
  const st={syncing:'Synchronisation en cours…',ok:`Copie en ligne à jour${cloud.lastSync?' ('+new Date(cloud.lastSync).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})+')':''}.`,offline:'Hors ligne : la copie en ligne sera mise à jour au retour du réseau.',error:`Échec : ${cloud.error}.`,off:'En attente de ton choix.',sample:"Données d'exemple : elles ne sont pas envoyées en ligne. Efface-les pour commencer avec tes vrais élèves."}[cloud.status]||'';
  return head+`<span>Connecté·e : <b>${esc(cloud.user.email||'')}</b></span>
    <span class="row" style="gap:8px;font-size:.875rem"><span class="pill ${cloud.status==='ok'?'ok':cloud.status==='error'?'red':'warn'}">${cloud.status==='ok'?'À jour':cloud.status==='error'?'Échec':cloud.status==='syncing'?'En cours':cloud.status==='sample'?'Exemple':'En attente'}</span><span class="muted">${esc(st)}</span></span>
    <div class="btns"><button class="btn" data-act="logout">Se déconnecter</button><button class="btn primary" data-act="syncnow">Synchroniser maintenant</button></div></section>`;
}

/* Écran de connexion : couvre l'appli tant que personne n'est connecté.
   Pas d'écran si la copie en ligne n'est pas configurée, ou si Firebase n'a pas pu se charger (hors ligne) :
   dans ce cas, l'appli s'ouvre avec les données du téléphone. */
let gateMode=null;
function gateWanted(){
  if(!cloud.enabled||cloud.user||cloud.status==='offline') return null;
  return cloud.authKnown?'login':'loading';
}
function gateHtml(mode){
  const brand=`<div class="gate-logos"><img src="icons/logo-groupe.png" alt="Logo Capoeira Rueda de Sol" width="88" height="88"><img src="icons/logo-asso.png" alt="Logo association Tao Te Chia" width="64" height="64"></div>
    <h1 tabindex="-1">Rueda de Sol</h1><p class="muted" style="margin:0">Suivi des élèves</p>`;
  if(mode==='loading') return brand+`<p class="muted" role="status" style="margin-top:24px">Connexion…</p>`;
  return brand+`<div class="gate-box stack">
    <p style="margin:0">Connecte-toi pour retrouver tes élèves. Une copie de tes données est gardée en ligne, pour ne rien perdre si tu vides le cache ou changes de téléphone.</p>
    <button type="button" class="btn gbtn" data-act="google">${G_LOGO}Continuer avec Google</button>
    <p id="acc-gerr" role="alert" style="margin:0;color:var(--pill-red);font-size:.875rem"></p>
    <details class="mailopt"><summary>Utiliser plutôt un e-mail et un mot de passe</summary>
    <form id="loginform" class="stack" style="gap:10px;margin-top:12px">
      <div class="field"><label for="acc-email">E-mail</label><input class="input" type="email" id="acc-email" autocomplete="username" required></div>
      <div class="field"><label for="acc-pw">Mot de passe</label><input class="input" type="password" id="acc-pw" autocomplete="current-password" minlength="6" aria-describedby="acc-pwhint" required>
        <span id="acc-pwhint" class="muted" style="font-size:.8125rem">6 caractères minimum.</span></div>
      <button type="button" class="btn ghost" style="align-self:flex-start" data-act="resetpw">Mot de passe oublié</button>
      <p id="acc-err" role="alert" style="margin:0;color:var(--pill-red);font-size:.875rem"></p>
      <div class="btns"><button class="btn" type="submit" value="signup">Créer un compte</button><button class="btn primary" type="submit" value="login">Se connecter</button></div>
    </form></details></div>`;
}
function updateGate(){
  const mode=gateWanted(); if(mode===gateMode) return;
  const was=gateMode; gateMode=mode;
  const g=document.getElementById('gate');
  document.body.classList.toggle('gated',!!mode);
  g.hidden=!mode;
  if(mode){ g.innerHTML=gateHtml(mode); document.title='Connexion · Rueda de Sol'; if(mode==='login') g.querySelector('h1').focus({preventScroll:true}); }
  else { g.innerHTML=''; if(was) render('#view h1'); }
}

window.addEventListener('online',()=>{ if(cloud.user) cloudConnect(); else if(cloud.enabled&&!cloud.mod) cloudStart(); });
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){ if(saveT) saveNow(); if(pushT) cloudPush(); }});
async function exportBackup(){
  const name=`rueda-de-sol-${TODAY_ISO}.json`;
  const file=new File([JSON.stringify(snapshot(),null,1)],name,{type:'application/json'});
  try{
    if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:'Sauvegarde Rueda de Sol'})}
    else{const a=document.createElement('a');a.href=URL.createObjectURL(file);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
    settings.lastExport=TODAY_ISO; toast('Sauvegarde exportée'); keep();
  }catch(e){ if(e&&e.name==='AbortError') return; toast("L'export n'a pas abouti. Réessaie."); }
}
let pendingImport=null;
function pickBackup(){
  const inp=document.createElement('input'); inp.type='file'; inp.accept='application/json,.json';
  inp.addEventListener('change',()=>{const f=inp.files&&inp.files[0]; if(!f) return;
    f.text().then(t=>{const d=JSON.parse(t); if(d.app!=='rueda-de-sol'||!Array.isArray(d.students)) throw new Error('format');
      pendingImport=d; importSheet(d)}).catch(()=>toast("Ce fichier n'est pas une sauvegarde Rueda de Sol."))});
  inp.click();
}
function importSheet(d){
  const when=d.savedAt?new Date(d.savedAt).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'}):'date inconnue';
  openSheet(`<form class="sheet" id="importform" aria-label="Importer une sauvegarde">
    <h2>Importer cette sauvegarde ?</h2>
    <p style="margin:0">Sauvegarde du ${esc(when)} : ${d.students.length+(d.archived||[]).length} élèves, ${(d.sessions||[]).length} séances.</p>
    <p class="muted" style="margin:0">Elle remplace toutes les données actuelles de ce téléphone. Exporte d'abord une sauvegarde si tu veux pouvoir revenir en arrière.</p>
    <div class="btns"><button type="button" class="btn" data-act="close">Annuler</button><button class="btn primary" type="submit">Remplacer</button></div>
  </form>`);
}

/* ---------- Petits composants ---------- */
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function cordaEl(c,sm){const k=CORDAS[c],cl='corda'+(sm?' sm':''),a=`role="img" aria-label="Corde ${esc(cordaName(c))}" title="${esc(cordaName(c))}"`;
  if(!k.colors) return `<span class="${cl} none" ${a}></span>`;
  if(k.colors==='multi') return `<span class="${cl}" ${a} style="background:linear-gradient(90deg,#D7322B 0 9%,#F2C230 9% 16%,#3D9A4F 16% 23%,#fff 23% 77%,#2F6FC0 77% 84%,#7A3E9D 84% 91%,#F0832E 91%)"></span>`;
  return `<span class="${cl}" ${a} style="background:${k.colors[0]}"></span>`}
const cordaName=c=>CORDAS[c].name+(CORDAS[c].sub?` · ${CORDAS[c].sub}`:'');
const initials=st=>st.apelido.split(/[\s-]/).map(w=>w[0]).join('').slice(0,2).toUpperCase();
const avatar=(st,big)=>st.photo?`<img class="avatar${big?' big':''}" src="${st.photo}" alt="">`:`<div class="avatar${big?' big':''}" style="background:${st.color}" aria-hidden="true">${initials(st)}</div>`;
const CAM='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>';
/* Photo : choisie dans la galerie ou prise avec l'appareil, recadrée en carré de 320 px */
function pickPhoto(cb){
  const inp=document.createElement('input'); inp.type='file'; inp.accept='image/*';
  inp.addEventListener('change',()=>{const file=inp.files&&inp.files[0]; if(!file) return;
    const url=URL.createObjectURL(file), img=new Image();
    img.onload=()=>{const n=320,c=document.createElement('canvas');c.width=c.height=n;const side=Math.min(img.naturalWidth,img.naturalHeight);
      c.getContext('2d').drawImage(img,(img.naturalWidth-side)/2,(img.naturalHeight-side)/2,side,side,0,0,n,n);URL.revokeObjectURL(url);cb(c.toDataURL('image/jpeg',0.85))};
    img.onerror=()=>{URL.revokeObjectURL(url);toast("Cette image n'a pas pu être lue. Essaie une photo JPEG ou PNG.")};
    img.src=url;});
  inp.click();
}
let pendingPhoto=null;
function pillarBar(blocks){const t=blocks.reduce((a,b)=>a+b.min,0)||1;const g={};blocks.forEach(b=>g[b.p]=(g[b.p]||0)+b.min);
  return `<div class="bar">${PILLARS.filter(p=>g[p.id]).map(p=>`<span style="width:${100*g[p.id]/t}%;background:${p.color}"></span>`).join('')}</div>`}
const legend=()=>`<div class="legend">${SPILL.map(p=>`<span><i class="dot" style="background:${p.color}"></i>${p.name}</span>`).join('')}</div>`;
function levelBtns(stId,skId,val){
  const p=S[skId].p;
  return `<div class="levels" role="radiogroup" aria-label="Niveau : ${esc(S[skId].name)}">${[0,1,2,3].map(l=>{const on=l>0&&l<=val,sel=l===val;
    return `<button type="button" role="radio" aria-checked="${sel}" tabindex="${sel?0:-1}" class="lv${on?' on':''}${sel?' sel':''}" style="${on?`background:${P[p].color};color:var(--on-${p})`:''}" data-act="lvl" data-st="${stId}" data-sk="${skId}" data-l="${l}" aria-label="${lvLabel(skId,l)}" title="${lvLabel(skId,l)}">${l}</button>`}).join('')}</div>`}
function radar(st){
  const W=330,H=240,cx=165,cy=124,r=80,n=PILLARS.length;
  const pt=(i,v)=>{const a=-Math.PI/2+i*2*Math.PI/n;return[cx+Math.cos(a)*r*v,cy+Math.sin(a)*r*v]};
  const poly=v=>PILLARS.map((_,i)=>pt(i,v).join(',')).join(' ');
  let g='';
  for(const v of [1/3,1]) g+=`<polygon points="${poly(v)}" fill="none" stroke="var(--line)"/>`;
  PILLARS.forEach((p,i)=>{const[x,y]=pt(i,1);g+=`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--line)"/>`;
    const[lx,ly]=pt(i,1.24);g+=`<text x="${lx}" y="${ly+4}" text-anchor="${Math.abs(lx-cx)<8?'middle':lx>cx?'start':'end'}">${p.name}</text>`});
  g+=`<polygon points="${poly(2/3)}" fill="none" stroke="var(--orange)" stroke-width="1.5" stroke-dasharray="4 3"/>`;
  const pts=PILLARS.map((p,i)=>pt(i,pillarAvg(st,p.id)/3));
  g+=`<polygon points="${pts.map(p=>p.join(',')).join(' ')}" fill="var(--red)" fill-opacity=".18" stroke="var(--red)" stroke-width="2"/>`;
  pts.forEach(([x,y])=>g+=`<circle cx="${x}" cy="${y}" r="3.5" fill="var(--red)"/>`);
  return `<svg class="radar" viewBox="0 0 ${W} ${H}" width="100%" style="max-width:380px;align-self:center" role="img" aria-label="Profil de ${esc(st.apelido)} sur 3, attendu 2 (acquis) : ${PILLARS.map(p=>`${p.name} ${pillarAvg(st,p.id).toFixed(1).replace('.',',')}`).join(', ')}">${g}</svg>`;
}

/* ---------- État de navigation ---------- */
let heroOpen=true;
let refOpen=new Set(['contrib','c0']);
document.addEventListener('toggle',e=>{const t=e.target;if(t.id==='hero-acc')heroOpen=t.open;const k=t.dataset&&t.dataset.k;if(k)t.open?refOpen.add(k):refOpen.delete(k)},true);
let view={name:'home'}; let tab='home'; let filter=''; let skillsTab='ref';
function focusKey(el){
  if(!el||el===document.body||!el.closest||!el.closest('#view,#tabs')) return null;
  if(el.tagName==='H1') return '#view h1';
  if(el.id) return '#'+CSS.escape(el.id);
  const d=el.dataset; if(!d||!d.act) return null;
  return `[data-act="${d.act}"]`+Object.keys(d).filter(k=>k!=='act'&&k!=='step').map(k=>`[data-${k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase())}="${CSS.escape(d[k])}"]`).join('');
}
const go=(name,params={})=>{view={name,...params};if(['home','students','sessions','skills'].includes(name))tab=name;render('#view h1');window.scrollTo(0,0)};
let sheetOpener=null;
function openSheet(html){
  sheetOpener=focusKey(document.activeElement);
  const layer=document.getElementById('layer');
  layer.innerHTML=`<dialog class="dlg" data-act="close">${html}</dialog>`;
  const dlg=layer.querySelector('dialog'), form=dlg.querySelector('form');
  if(form&&form.getAttribute('aria-label')) dlg.setAttribute('aria-label',form.getAttribute('aria-label'));
  dlg.addEventListener('close',()=>{dlg.remove();const k=sheetOpener;sheetOpener=null;if(k){const el=document.querySelector(k);if(el)el.focus({preventScroll:true})}});
  dlg.showModal();
}
function closeSheet(restore=true){const d=document.querySelector('#layer dialog');if(!d)return;if(!restore)sheetOpener=null;d.close()}
let toastT; function toast(m){clearTimeout(toastT);const el=document.body;el.insertAdjacentHTML('beforeend',`<div class="toast" role="status">${esc(m)}</div>`);toastT=setTimeout(()=>el.querySelector('.toast')?.remove(),4500)}

/* ---------- Écrans ---------- */
function welcome(){
  return `
  <div class="stack" style="gap:2px"><span class="eyebrow">${fmtL(TODAY_ISO)}</span><h1>Bem-vindo·a</h1></div>
  <section class="card">
    <h2>Pour commencer</h2>
    <p style="margin:0">Ajoute tes élèves un par un. Le référentiel de compétences et les cordes du groupe sont déjà en place : tu peux les adapter dans l'onglet Compétences.</p>
    <p class="muted" style="margin:0;font-size:.875rem">Tout reste sur ce téléphone. Pense à exporter une sauvegarde de temps en temps depuis les réglages (roue dentée en haut).</p>
    <div class="btns"><button class="btn" data-act="sample">Essayer avec des exemples</button><button class="btn primary" data-act="add">Ajouter un élève</button></div>
  </section>
  <div class="footer-logos"><img src="icons/logo-asso.png" alt="Logo de l'association Tao Te Chia">Association Tao Te Chia</div>`;
}
function noSession(nxt){
  return `<section class="card">
    <span class="eyebrow">Aujourd'hui</span><h2>Pas de séance prévue</h2>
    ${nxt?`<span class="muted">Prochaine : ${fmtL(nxt.date)}, ${esc(sessionLabel(nxt))}</span>`:''}
    <div class="btns">${nxt?`<button class="btn" data-act="edit" data-id="${nxt.id}">Voir la prochaine</button>`:''}<button class="btn primary" data-act="newtoday">Créer une séance aujourd'hui</button></div>
  </section>`;
}
function home(){
  if(!students.length&&!archived.length) return welcome();
  const t=sessions.find(s=>s.date===TODAY_ISO);
  const nxt=sessions.filter(s=>!s.done&&s.date>TODAY_ISO).sort((a,b)=>a.date.localeCompare(b.date))[0];
  const absents=students.filter(s=>{if(s.status==='pause')return false;const l=lastSeen(s);return new Date(s.arrivee)<TODAY && days(new Date(s.arrivee+'T12:00:00'),TODAY)>=21 && (!l||days(new Date(l+'T12:00:00'),TODAY)>=21)});
  const ready=students.map(s=>({s,r:readiness(s)})).filter(x=>x.r&&x.r.eligible).sort((a,b)=>b.r.contrib-a.r.contrib);
  const bal=balance(); const btotRaw=Object.values(bal).reduce((a,b)=>a+b,0); const btot=btotRaw||1;
  const low=btotRaw?SPILL.filter(p=>bal[p.id]/btot<.08):[];
  return `
  <div class="stack" style="gap:2px"><span class="eyebrow">${fmtL(TODAY_ISO)}</span><h1>Bom treino, professor·a</h1></div>
  ${t?`  <details class="card hero acc" id="hero-acc"${heroOpen?' open':''}>
    <summary><div class="stack" style="gap:6px;flex:1;min-width:0">
      <div class="row between"><span class="eyebrow">${t.done?`Appel fait · ${t.present.length} présents`:`Séance du jour · ${t.time}`}</span><span class="eyebrow num">${fmtDur(t.blocks)}</span></div>
      <h2 style="font-size:1.375rem">${esc(sessionLabel(t))}</h2></div><span class="chev" aria-hidden="true"></span></summary>
    <div class="stack" style="gap:4px;font-size:0.875rem">${t.blocks.map(b=>`<div class="row" style="gap:8px"><span class="num muted" style="min-width:3.75rem;white-space:nowrap">${b.min} min</span><span>${esc(b.title)}</span></div>`).join('')}</div>
    <div class="btns">${t.done?`<button class="btn" data-act="appel" data-id="${t.id}">Corriger l'appel</button><button class="btn primary" data-act="evalgo" data-id="${t.id}">Évaluer (facultatif)</button>`:`<button class="btn" data-act="edit" data-id="${t.id}">Modifier</button><button class="btn primary" data-act="appel" data-id="${t.id}">Faire l'appel</button>`}</div>
  </details>`:noSession(nxt)}
  ${(()=>{const bd=students.filter(s=>s.status!=='pause').map(s=>({s,b:bdayIn(s)})).filter(x=>x.b&&x.b.days<=7).sort((a,b)=>a.b.days-b.b.days);
    return bd.length?`<section class="stale bday" role="note">
    <span class="row" style="gap:8px"><span class="pill warn">Anniversaire</span><span style="font-size:.875rem">${bd.length>1?bd.length+' cette semaine':'Cette semaine'}</span></span>
    ${bd.map(({s,b})=>`<button class="adv-row ready-row" data-act="student" data-id="${s.id}">${avatar(s)}<div class="grow"><div class="title">${esc(s.apelido)}</div><div class="sub">${b.days===0?"Aujourd'hui":b.days===1?'Demain':cap(b.date.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'}))} · ${b.age} ans</div></div></button>`).join('')}
  </section>`:''})()}
  ${ready.length?`<section class="stale" role="note">
    <span class="row" style="gap:8px"><span class="pill warn">Corde</span><span style="font-size:.875rem">${ready.length>1?`${ready.length} élèves peuvent changer de corde`:'Un·e élève peut changer de corde'}</span></span>
    ${ready.map(({s,r})=>`<button class="adv-row ready-row" data-act="student" data-id="${s.id}">${avatar(s)}<div class="grow"><div class="title">${esc(s.apelido)}</div><div class="sub row wrap" style="gap:6px">${cordaEl(s.corda)} → ${cordaEl(r.to)} <span>Contribution ${contribLabel(r.contrib).toLowerCase()}</span></div></div></button>`).join('')}
  </section>`:''}
  <section class="stack">
    <div class="row between"><h2>À relancer</h2><span class="muted" style="font-size:0.8125rem">Absents depuis 3 semaines ou plus</span></div>
    <div class="list">${absents.length?absents.map(s=>{const l=lastSeen(s);return `<button class="li" data-act="student" data-id="${s.id}">${avatar(s)}<div class="grow"><div class="title">${esc(s.apelido)}</div><div class="sub">Dernière venue : ${l?fmt(l):'jamais'}</div></div><span class="pill red num">${l?days(new Date(l),TODAY)+' j':'—'}</span></button>`}).join(''):`<div class="li muted">Tout le monde est venu récemment.</div>`}</div>
  </section>
  <section class="card">
    <div class="row between"><h2>Équilibre sur 30 jours</h2><span class="muted num" style="font-size:.8125rem">${btotRaw?Math.round(btotRaw/60)+' h de cours':'Aucune séance faite'}</span></div>
    <div class="bar" style="height:14px">${SPILL.map(p=>`<span style="width:${100*bal[p.id]/btot}%;background:${p.color}" title="${p.name} ${Math.round(100*bal[p.id]/btot)} %"></span>`).join('')}</div>
    <div class="legend">${SPILL.map(p=>`<span><i class="dot" style="background:${p.color}"></i>${p.name} <b class="num">${Math.round(100*bal[p.id]/btot)} %</b></span>`).join('')}</div>
    ${low.length?`<div style="font-size:0.875rem"><span class="pill warn">À renforcer</span> ${low.map(p=>p.name).join(', ')} : moins de 8 % du temps de cours ce mois-ci.</div>`:''}
  </section>
  <div class="footer-logos"><img src="icons/logo-asso.png" alt="Logo de l'association Tao Te Chia">Association Tao Te Chia</div>`;
}

function studentsList(){
  const q=filter.toLowerCase();
  const list=students.filter(s=>!q||(s.apelido+' '+s.nom).toLowerCase().includes(q)).sort((a,b)=>b.corda-a.corda||a.apelido.localeCompare(b.apelido));
  return `
  <div class="row between"><h1>Élèves</h1><button class="btn primary" data-act="add">Ajouter</button></div>
  <input class="search" id="q" type="search" placeholder="Chercher un apelido ou un nom" value="${esc(filter)}" aria-label="Rechercher">
  <span class="muted num" style="font-size:0.8125rem">${(()=>{const p=list.filter(s=>s.status==='pause').length,a=list.length-p;return `${a} actif${a>1?'s':''}${p?` · ${p} en pause`:''}${archived.length?` · ${archived.length} inactif${archived.length>1?'s':''}`:''}`})()}</span>
  ${list.length?'':`<div class="card"><span class="muted">${q?'Aucun élève ne correspond à cette recherche.':'Aucun élève pour l\'instant. Touche « Ajouter » pour créer le premier.'}</span></div>`}
  <div class="list"${list.length?'':' hidden'}>${list.map(s=>{const r=rate(s);return `<button class="li" data-act="student" data-id="${s.id}">${avatar(s)}
    <div class="grow"><div class="title row wrap" style="gap:6px">${esc(s.apelido)}${statusPill(s)}</div><div class="sub">${esc(s.nom)} · ${seniority(s.arrivee)}</div></div>
    <div class="stack" style="gap:4px;align-items:flex-end"><span class="row" style="gap:6px"><span class="sub" style="font-size:0.8125rem" aria-hidden="true">${CORDAS[s.corda].sub||CORDAS[s.corda].name}</span>${cordaEl(s.corda)}</span><span class="sub num" style="font-size:0.8125rem">${r==null?'—':r+' % prés.'}</span></div></button>`}).join('')}</div>
  ${archived.length?`<details class="card lvl" data-k="arch"${refOpen.has('arch')?' open':''}><summary class="row"><span style="flex:1"><b>Inactifs</b> <span class="muted num">(${archived.length})</span></span></summary>
    <div class="stack" style="gap:0">${archived.map(s=>`<button class="li" data-act="student" data-id="${s.id}">${avatar(s)}<div class="grow"><div class="title">${esc(s.apelido)}</div><div class="sub">${esc(s.nom)}${s.statusNote?` · ${esc(s.statusNote)}`:''}</div></div></button>`).join('')}</div></details>`:''}`;
}

function studentPage(){
  const st=byId(view.id); const r=readiness(st); const rt=rate(st); const l=lastSeen(st);
  return `
  <button class="back" data-act="go" data-to="students">‹ Élèves</button>
  <section class="row" style="gap:14px"><button class="avbtn" data-act="photo" data-id="${st.id}" aria-label="${st.photo?'Changer':'Ajouter'} la photo de ${esc(st.apelido)}">${avatar(st,true)}<span class="cam">${CAM}</span></button><div class="stack" style="gap:3px;min-width:0">
    <h1>${esc(st.apelido)}</h1>${st.status&&st.status!=='actif'?`<span class="row wrap" style="gap:6px;font-size:0.8125rem">${statusPill(st)}${st.statusNote?`<span class="muted">${esc(st.statusNote)}</span>`:''}</span>`:''}<span class="muted">${esc(st.nom)}</span>${st.naissance?`<span class="muted" style="font-size:0.875rem">${bdayTxt(st)}</span>`:''}
    <span class="row" style="gap:8px;font-size:0.875rem">${cordaEl(st.corda)} ${cordaName(st.corda)}</span></div></section>
  <div class="btns"><button class="btn" data-act="stedit" data-id="${st.id}">Modifier</button>${st.corda<CORDAS.length-1?`<button class="btn primary" data-act="bat" data-id="${st.id}">Nouvelle corde</button>`:''}</div>
  <section class="card" style="flex-direction:row;justify-content:space-between;text-align:center">
    <div class="stack" style="gap:2px"><span class="eyebrow">Arrivée</span><b class="num">${fmt(st.arrivee)} ${st.arrivee.slice(0,4)}</b><span class="muted" style="font-size:0.8125rem">${seniority(st.arrivee)}</span></div>
    <div class="stack" style="gap:2px"><span class="eyebrow">Présence</span><b class="num">${rt==null?'—':rt+' %'}</b><span class="muted" style="font-size:0.8125rem">8 dernières sem.</span></div>
    <div class="stack" style="gap:2px"><span class="eyebrow">Dernière fois</span><b class="num">${l?fmt(l):'—'}</b><span class="muted" style="font-size:0.8125rem">${l?days(new Date(l),TODAY)+' jours':''}</span></div>
  </section>
  <p class="muted" style="margin:0;font-size:0.8125rem">Les piliers plus bas se déplient pour noter les niveaux.</p>
  <section class="card"><h2>Profil</h2>${radar(st)}
    <div class="legend" style="justify-content:center"><span><i class="dot" style="background:var(--red)"></i>${esc(st.apelido)}</span><span><i class="dash"></i>Attendu jusqu'à sa corde : acquis</span></div>
    <p class="muted" style="margin:0;font-size:0.8125rem">La toile compare ${esc(st.apelido)} au référentiel de sa corde et des cordes précédentes (${scope(st).length} compétences). Le bord extérieur correspond à « Maîtrisé ».</p></section>
  ${r?`<section class="card">
    <div class="row between wrap"><h2>Vers la corde ${CORDAS[r.to].name.toLowerCase()}</h2><span class="pill ${r.eligible?'ok':'warn'}">${r.eligible?'Possible au prochain batizado':'Encore '+(12-r.months)+' mois'}</span></div>
    <div class="stack" style="gap:6px"><div class="row between" style="font-size:0.875rem"><span>Temps dans sa corde</span><b class="num">${r.months} mois <span class="muted" style="font-weight:400">/ 12 minimum</span></b></div>
      <div class="progress"><span style="width:${Math.min(100,100*r.months/12)}%;background:${r.eligible?'var(--ok)':'var(--orange)'}"></span></div></div>
    <span class="eyebrow" style="padding-top:4px">Repères pour en parler, non bloquants</span>
    <div class="stack" style="gap:8px;font-size:0.875rem">
      <div class="row between"><span class="row" style="gap:8px"><i class="dot" style="background:var(--p-contrib)"></i>Contribution au groupe</span><b>${contribLabel(r.contrib)}</b></div>
      <div class="row between"><span>Référentiel de sa corde acquis</span><b class="num">${r.acq.length} / ${r.ref.length}</b></div>
      <div class="row between"><span>Présence sur 8 semaines</span><b class="num">${r.pres==null?'—':r.pres+' %'}</b></div>
    </div>
    ${r.ref.length>r.acq.length?`<div class="muted" style="font-size:0.8125rem">À accompagner : ${r.ref.filter(s=>st.levels[s.id]<2).map(s=>esc(s.name)).join(', ')}</div>`:''}
  </section>`:''}
  ${[...PILLARS.slice(-1),...SPILL].map(p=>{const sk=SKILLS.filter(s=>s.p===p.id&&s.c<=st.corda);const later=SKILLS.filter(s=>s.p===p.id&&s.c>st.corda).length;
    return `<details class="card lvl" data-k="st-${p.id}"${refOpen.has('st-'+p.id)?' open':''}><summary class="row"><h2 class="row" style="gap:8px;flex:1;min-width:0"><i class="dot" style="background:${p.color};width:10px;height:10px"></i>${p.name}</h2><span class="muted num" style="font-size:0.8125rem">${sk.length} · ${pillarAvg(st,p.id).toFixed(1)} / 3</span></summary>
    <div>${sk.map(s=>`<div class="skillrow">${s.p==='contrib'?'':cordaEl(s.c,1)}<span class="name">${esc(s.name)}${s.opt?' <span class="pill warn" style="font-size:0.75rem">Facultatif</span>':''}<span class="lvname">${lvInfo(st,s.id)}</span></span>${levelBtns(st.id,s.id,st.levels[s.id])}</div>`).join('')}</div>
    ${later?`<span class="muted" style="font-size:0.8125rem">${later} compétence${later>1?'s':''} à venir avec les cordes suivantes</span>`:''}${p.id==='contrib'?journal(st):''}</details>`}).join('')}
  ${(()=>{const h=st.lvlHist.filter(x=>S[x.sk]).slice().reverse();return `<section class="card"><div class="row between"><h2>Progression</h2><span class="muted" style="font-size:0.8125rem">Changements de niveau datés</span></div>
    ${h.length?`<div class="stack" style="gap:8px">${h.slice(0,6).map(x=>`<div class="row" style="gap:10px;align-items:flex-start;font-size:0.875rem"><span class="muted num" style="font-size:0.8125rem;min-width:3.75rem;white-space:nowrap;flex:none;padding-top:2px">${fmt(x.date)}</span><span style="min-width:0"><i class="dot" style="background:${P[S[x.sk].p].color};display:inline-block;margin-right:6px"></i>${esc(S[x.sk].name)} : ${lvLabel(x.sk,x.from)} → <b>${lvLabel(x.sk,x.to)}</b></span></div>`).join('')}</div>${h.length>6?`<span class="muted" style="font-size:0.8125rem">et ${h.length-6} changement${h.length-6>1?'s':''} plus ancien${h.length-6>1?'s':''}</span>`:''}`:`<span class="muted" style="font-size:0.8125rem">Aucun changement de niveau noté pour l'instant.</span>`}
  </section>`})()}
  <section class="card"><h2>Parcours de cordes</h2>
    <div class="ladder">${[{corda:0,date:st.arrivee,event:'Arrivée'},...st.hist].reverse().map(h=>`<div class="rung" style="align-items:center">${cordaEl(h.corda)}<div class="grow"><b>${CORDAS[h.corda].name}</b> <span class="muted">· ${h.event}</span></div><span class="muted num" style="font-size:0.8125rem">${fmt(h.date)} ${h.date.slice(0,4)}</span></div>`).join('')}</div>
  </section>
  <section class="card"><h2>Notes</h2><textarea class="input" id="notes-${st.id}" placeholder="Points à travailler, blessures, objectifs…" data-act="notes" data-id="${st.id}">${esc(st.notes)}</textarea></section>`;
}

function journal(st){
  return `<div class="stack" style="gap:8px;border-top:1px solid var(--line);padding-top:10px">
    <div class="row between"><span class="eyebrow">Journal de contribution</span><button class="btn ghost" data-act="contrib" data-id="${st.id}">+ Noter</button></div>
    ${st.contribs.length?st.contribs.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(c=>`<div class="row" style="gap:10px;align-items:flex-start;font-size:0.875rem"><span class="muted num" style="font-size:0.8125rem;min-width:3.75rem;white-space:nowrap;flex:none;padding-top:2px">${fmt(c.date)}</span><span style="min-width:0">${esc(c.text)}</span></div>`).join(''):`<span class="muted" style="font-size:0.8125rem">Rien de noté pour l'instant.</span>`}
  </div>`;
}
function contribSheet(id){
  const st=byId(id);
  openSheet(`<form class="sheet" id="contribform" data-id="${id}" aria-label="Noter une contribution">
    <h2>Contribution de ${esc(st.apelido)}</h2>
    <div class="field"><label for="c-dt">Date</label><input class="input" type="date" id="c-dt" value="${TODAY_ISO}" required></div>
    <div class="field"><label for="c-txt">Ce qu'il ou elle a fait pour le groupe</label><textarea class="input" id="c-txt" placeholder="A hébergé les capoeiristes venus de…, a aidé un débutant…" required></textarea></div>
    <div class="btns"><button type="button" class="btn" data-act="close">Annuler</button><button class="btn primary" type="submit">Enregistrer</button></div>
  </form>`);
  document.getElementById('c-txt').focus();
}
function skillSheet(id,preset){
  const s=id?S[id]:{name:'',p:preset.p||'mouv',c:preset.c!=null?+preset.c:0,opt:false};
  const noted=id?students.filter(st=>st.levels[id]>0).length:0;
  openSheet(`<form class="sheet" id="skillform" data-id="${id||''}" aria-label="${id?'Modifier la compétence':'Nouvelle compétence'}">
    <h2>${id?'Modifier la compétence':'Nouvelle compétence'}</h2>
    <div class="field"><label for="k-name">Nom</label><input class="input" id="k-name" value="${esc(s.name)}" placeholder="Ex. Série 5 du groupe, Toque Cavalaria…" required></div>
    <div class="field"><label for="k-p">Pilier</label><select class="input" id="k-p">${PILLARS.map(p=>`<option value="${p.id}"${p.id===s.p?' selected':''}>${p.name}</option>`).join('')}</select></div>
    <div class="field"><label for="k-c">Niveau du référentiel</label><select class="input" id="k-c">${CORDAS.slice(0,9).map((k,i)=>`<option value="${i}"${i===s.c?' selected':''}>${i===0?'Débutant (sans corde)':'Corde '+k.name.toLowerCase()}</option>`).join('')}</select>
      <span class="muted" style="font-size:0.8125rem">Sans effet pour la contribution, qui vaut pour tous les niveaux.</span></div>
    <label class="check-row" for="k-opt"><input type="checkbox" id="k-opt"${s.opt?' checked':''}><span>Facultatif<br><span class="muted" style="font-size:0.8125rem">Se note, mais ne compte ni dans la toile ni dans les repères de passage.</span></span></label>
    ${id&&noted?`<span class="muted" style="font-size:0.8125rem">${noted} élève${noted>1?'s ont':' a'} déjà un niveau noté sur cette compétence.</span>`:''}
    <div class="btns">${id?`<button type="button" class="btn ghost" style="margin-right:auto;color:var(--red)" data-act="skdel" data-id="${id}">Supprimer</button>`:''}<button type="button" class="btn" data-act="close">Annuler</button><button class="btn primary" type="submit">Enregistrer</button></div>
  </form>`);
  document.getElementById('k-name').focus();
}
function settingsPage(){
  const n=students.length+archived.length;
  return `
  <button class="back" data-act="go" data-to="home">‹ Accueil</button>
  <h1>Réglages</h1>
  <section class="card">
    <h2>Entraînements</h2>
    <fieldset style="border:0;padding:0;margin:0;display:flex;flex-direction:column;gap:6px"><legend class="eyebrow" style="padding:0;margin-bottom:6px">Jours</legend>
      <div class="days">${DAYS.map(([d,l])=>`<label><input type="checkbox" data-set="day" value="${d}"${settings.days.includes(d)?' checked':''}>${l}</label>`).join('')}</div></fieldset>
    ${DAYS.filter(([d])=>settings.days.includes(d)).map(([d])=>`<div class="field"><label for="foc-${d}">${cap(['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'][d])} : lieu et axe de travail</label>
      <select class="input" id="foc-${d}" data-set="focus" data-day="${d}"><option value="">Pas d'orientation</option>${Object.entries(FOCUS).map(([k,v])=>`<option value="${k}"${(settings.focus||{})[d]===k?' selected':''}>${esc(v.long)}</option>`).join('')}</select></div>`).join('')}
    <div class="field"><label for="set-time">Heure de début</label><input class="input" type="time" id="set-time" data-set="time" value="${settings.time}" style="max-width:9rem"></div>
    <span class="muted" style="font-size:.875rem">Sert à proposer la date, l'heure et les blocs des nouvelles séances.</span>
  </section>
  ${accountCard()}
  <section class="card">
    <h2>Sauvegarde</h2>
    <p style="margin:0">${cloud.user?'Une copie en ligne est faite automatiquement. Un export de temps en temps reste une bonne double sécurité.':'Sans compte en ligne, tes données sont enregistrées sur ce téléphone uniquement. Si tu le perds ou vides le cache, seule une sauvegarde exportée permet de les retrouver.'}</p>
    <span class="muted" style="font-size:.875rem">Dernière sauvegarde exportée : ${settings.lastExport?fmtL(settings.lastExport):'jamais'}.</span>
    <div class="btns"><button class="btn" data-act="import">Importer</button><button class="btn primary" data-act="export">Exporter une sauvegarde</button></div>
  </section>
  <section class="card">
    <h2>Données</h2>
    <span class="muted" style="font-size:.875rem">${n} élève${n>1?'s':''}, ${sessions.length} séance${sessions.length>1?'s':''}, ${SKILLS.length} compétences.${sample?' Ce sont des données d\'exemple.':''}</span>
    <div class="btns">${n?'':'<button class="btn" data-act="sample">Charger des exemples</button>'}<button class="btn ghost" style="color:var(--red)" data-act="wipe">Tout effacer</button></div>
  </section>
  <p class="muted" style="margin:0;font-size:.8125rem">Rueda de Sol · version ${APP_VERSION}</p>`;
}
function sessionsList(){
  const up=sessions.filter(s=>!s.done).sort((a,b)=>a.date.localeCompare(b.date));
  const past=done().slice().reverse();
  const row=s=>{const tot=s.blocks.reduce((a,b)=>a+b.min,0);return `<button class="li" data-act="${s.done?'edit':'edit'}" data-id="${s.id}"><div class="grow stack" style="gap:6px">
    <div class="row between"><span class="title">${esc(sessionLabel(s))}</span><span class="sub num">${weekday(s.date).slice(0,3)}. ${fmt(s.date)}</span></div>
    ${s.blocks.length?pillarBar(s.blocks):'<span class="sub">Aucun bloc pour l\'instant</span>'}
    <span class="sub num">${fmtDur(s.blocks)}${s.done?` · ${s.present.length} présents`:''}</span></div></button>`};
  return `
  <div class="row between"><h1>Séances</h1><button class="btn primary" data-act="new">Nouvelle séance</button></div>
  ${legend()}
  <span class="eyebrow">À venir</span>${up.length?`<div class="list">${up.map(row).join('')}</div>`:'<span class="muted">Aucune séance prévue. Touche « Nouvelle séance » pour préparer la prochaine.</span>'}
  <span class="eyebrow">Passées</span>${past.length?`<div class="list">${past.map(row).join('')}</div>`:'<span class="muted">Les séances apparaissent ici une fois l\'appel fait.</span>'}`;
}

let draft=null;
function editor(){
  if(!draft||draft.id!==view.id){ draft=JSON.parse(JSON.stringify(sess(view.id)));
    if(!draft.done&&draft.blocks.some(b=>b.fixed==='start')&&!draft.blocks.some(b=>b.k==='close')) draft.blocks.push(mkBlock(CLOSE)); }
  const f=dayFocus(draft.date), hasMid=draft.blocks.some(b=>!b.fixed);
  const stale=draft.done?[]:staleBlocks(draft); const staleK=new Set(stale.map(x=>x.t.k));
  const adv=draft.done?[]:advice(draft).filter(a=>!staleK.has(a.t.k)).slice(0,3);
  const chips=b=>{const ids=[...new Set([...((LIBK[b.k]||{}).skills||[]),...b.skills,...SKILLS.filter(s=>s.p===b.p).map(s=>s.id)])].filter(id=>S[id]);
    return ids.map(id=>`<button class="chip${b.skills.includes(id)?' on':''}" data-act="bsk" data-i="${draft.blocks.indexOf(b)}" data-sk="${id}" aria-pressed="${b.skills.includes(id)}">${esc(S[id].name)}</button>`).join('')};
  const firstMovable=draft.blocks[0]&&draft.blocks[0].fixed==='start'?1:0;
  return `
  <button class="back" data-act="go" data-to="sessions">‹ Séances</button>
  <div class="stack" style="gap:4px"><span class="eyebrow">${fmtL(draft.date)}</span><h1>${draft.done?'Séance passée':'Préparer la séance'}</h1>
    <span class="row wrap" style="gap:6px;font-size:.875rem">${f?`<span class="pill neutral">${esc(FOCUS[f].long)}</span>`:`<span class="muted">Pas d'orientation pour ce jour (à régler dans Réglages).</span>`}</span></div>
  <div class="row" style="gap:10px"><div class="field" style="flex:1"><label for="dt">Date</label><input class="input" type="date" id="dt" value="${draft.date}" data-act="dt"></div>
    <div class="field" style="width:7.5rem"><label for="tm">Heure</label><input class="input" type="time" id="tm" value="${draft.time}" data-act="tm"></div></div>
  ${draft.done?'':`<section class="card advice">
    <h2>Que travailler ?</h2>
    ${hasMid?'':`<p style="margin:0">${f==='tatami'?cap(weekday(draft.date))+', tatami : la séance met l\'accent sur le sol et les acrobaties (toujours facultatives).':f==='miroir'?'Miroir, parquet et souvent plus de monde : la séance met l\'accent sur les combos à deux, les séries et la roda.':''} Le reste dépend de ce que le groupe n'a pas encore acquis et de ce qui n'a pas été travaillé depuis longtemps.</p>
      <div class="btns"><button class="btn primary" data-act="plan">Proposer une séance complète</button></div>`}
    ${stale.length?`<div class="stale" role="note"><span class="row" style="gap:8px"><span class="pill warn">À reprendre</span><span style="font-size:.875rem">${stale.length>1?`${stale.length} blocs pas travaillés depuis 3 semaines ou plus`:'Un bloc pas travaillé depuis 3 semaines ou plus'}</span></span>
      <div class="stack" style="gap:0">${stale.map(x=>`<div class="adv-row"><i class="dot" style="background:${P[x.t.p].color}" aria-hidden="true"></i>
        <div class="grow stack" style="gap:2px"><b>${esc(x.t.title)}</b><span class="muted" style="font-size:.8125rem">${cap(sinceTxt(x.since))}</span></div>
        <button class="btn" data-act="addlib" data-k="${x.t.k}" aria-label="Ajouter : ${esc(x.t.title)}">Ajouter</button></div>`).join('')}</div></div>`:''}
    ${adv.length?`<span class="eyebrow">${hasMid?'Blocs conseillés':'Ou ajoute les blocs un par un'}</span>
    <div class="stack" style="gap:0">${adv.map(a=>`<div class="adv-row"><i class="dot" style="background:${P[a.t.p].color}" aria-hidden="true"></i>
      <div class="grow stack" style="gap:2px"><b>${esc(a.t.title)}</b>${a.why.length?'':`<span class="muted" style="font-size:.8125rem">Le groupe maîtrise déjà bien ces compétences.</span>`}${a.why.map(w=>`<span class="muted" style="font-size:.8125rem">${esc(w)}</span>`).join('')}</div>
      <button class="btn" data-act="addlib" data-k="${a.t.k}" aria-label="Ajouter : ${esc(a.t.title)}">Ajouter</button></div>`).join('')}</div>`:''}
  </section>`}
  <div class="card" style="gap:8px"><div class="row between"><span class="eyebrow">Répartition</span><span class="num" style="font-weight:700">${fmtDur(draft.blocks)}</span></div>${draft.blocks.length?pillarBar(draft.blocks):''}${legend()}${(()=>{const d=split(draft.blocks);return d.cours===90&&d.mus===30?'':`<span style="font-size:0.8125rem"><span class="pill warn">À ajuster</span> Prévu : 1h30 de cours (20 min d'échauffement, 1h de blocs, 10 min de salutation finale) et 30 min de musique. Actuellement ${hm(d.cours)} et ${d.mus} min.</span>`})()}</div>
  ${draft.blocks.map((b,i)=>`<div class="block${b.fixed?' fixed':''}">
    <div class="block-head">${b.fixed?`<span class="eyebrow" style="color:${P[b.p].color}">${FIXED_LABEL[b.fixed]||''}</span>`:`<select class="input" style="width:auto;flex:none;color:${P[b.p].color};font-weight:700" data-act="bp" data-i="${i}" aria-label="Pilier" id="bp-${i}">${SPILL.map(p=>`<option value="${p.id}"${p.id===b.p?' selected':''}>${p.name}</option>`).join('')}</select>`}
      <span style="flex:1"></span>
      ${b.fixed?'':`<button class="iconbtn" data-act="bup" data-i="${i}" aria-label="Monter" ${i>firstMovable?'':'disabled'}>↑</button>
      <button class="iconbtn" data-act="bdel" data-i="${i}" aria-label="Supprimer le bloc">✕</button>`}</div>
    <div class="row" style="gap:8px"><input class="input" id="bt-${i}" value="${esc(b.title)}" data-act="bt" data-i="${i}" aria-label="Titre du bloc" style="flex:1">
      <div class="stepper"><button data-act="bmin" data-i="${i}" data-d="-5" aria-label="Moins 5 minutes">−</button><span class="num">${b.min} min</span><button data-act="bmin" data-i="${i}" data-d="5" aria-label="Plus 5 minutes">+</button></div></div>
    <div class="row wrap" style="gap:6px">${chips(b)}</div>
  </div>`).join('')}
  <button class="btn" data-act="badd">+ Ajouter un bloc</button>
  <div class="btns" style="padding-top:6px"><button class="btn" data-act="leave" data-to="sessions">Annuler</button>${draft.done?`<button class="btn" data-act="appel" data-id="${draft.id}">Corriger l'appel</button><button class="btn" data-act="evalgo" data-id="${draft.id}">Évaluer</button>`:`<button class="btn" data-act="saveappel">Enregistrer et faire l'appel</button>`}<button class="btn primary" data-act="save">Enregistrer</button></div>`;
}
function libSheet(){
  const f=dayFocus(draft.date), have=new Set(draft.blocks.map(b=>b.k));
  const staleMap=Object.fromEntries(staleBlocks(draft).map(x=>[x.t.k,x.since])), staleK=new Set(Object.keys(staleMap));
  const row=t=>`<button class="li" data-act="addlib" data-k="${t.k}"><i class="dot" style="background:${P[t.p].color}" aria-hidden="true"></i><div class="grow"><div class="title">${esc(t.title)}</div><div class="sub">${P[t.p].name} · ${t.min} min${have.has(t.k)?' · déjà dans la séance':staleK.has(t.k)?` · <span style="color:var(--warn)">${sinceTxt(staleMap[t.k])}</span>`:''}</div></div></button>`;
  const fl=f?LIB.filter(t=>t.where===f):[], other=LIB.filter(t=>!fl.includes(t));
  openSheet(`<div class="sheet" aria-label="Ajouter un bloc"><h2>Ajouter un bloc</h2>
    ${fl.length?`<span class="eyebrow">Conseillés ce jour-là : ${esc(FOCUS[f].name.toLowerCase())}</span><div class="list">${fl.map(row).join('')}</div>`:''}
    <span class="eyebrow">${fl.length?'Autres blocs':'Blocs'}</span><div class="list">${other.map(row).join('')}</div>
    <div class="btns"><button type="button" class="btn" data-act="close">Fermer</button></div></div>`);
}

let appelSel=null;
function appel(){
  const s=sess(view.id); if(!appelSel) appelSel=new Set(s.present);
  const list=students.filter(x=>x.status!=='pause').sort((a,b)=>a.apelido.localeCompare(b.apelido)); const paused=students.filter(x=>x.status==='pause');
  return `
  <button class="back" data-act="go" data-to="home">‹ Accueil</button>
  <div class="stack" style="gap:2px"><span class="eyebrow">Appel · ${weekday(s.date)} ${fmt(s.date)} ${s.time}</span><h1>${esc(sessionLabel(s))}</h1></div>
  <div class="row between"><span class="muted">Touche les élèves présents</span><b class="num">${appelSel.size} / ${list.length}</b></div>
  ${paused.length?`<span class="muted" style="font-size:0.8125rem">En pause, non affiché${paused.length>1?'s':''} : ${paused.map(x=>esc(x.apelido)).join(', ')}</span>`:''}
  ${list.length?'':'<span class="muted">Aucun élève actif. Ajoute des élèves depuis l\'onglet Élèves.</span>'}<div class="grid-tiles">${list.map(st=>`<button class="tile${appelSel.has(st.id)?' on':''}" data-act="tog" data-id="${st.id}" aria-pressed="${appelSel.has(st.id)}"><span class="check">✓</span>${avatar(st)}<span>${esc(st.apelido)}</span>${cordaEl(st.corda)}</button>`).join('')}</div>
  <div class="btns"><button class="btn" data-act="go" data-to="home">Plus tard</button><button class="btn primary" data-act="valid" data-id="${s.id}" ${appelSel.size?'':'disabled'}>Valider l'appel</button></div>`;
}

function evaluate(){
  const s=sess(view.id); const sk=[...new Set(s.blocks.flatMap(b=>b.skills))]; const pres=s.present.map(byId);
  return `
  <div class="stack" style="gap:2px"><span class="eyebrow">${s.present.length} présents · ${fmt(s.date)}</span><h1>Évaluer la séance</h1></div>
  <p class="muted" style="margin:0">Facultatif. Le nombre de séances travaillées se compte tout seul à partir de l'appel. Note ici seulement les progrès que tu as remarqués : chaque changement est daté sur la fiche de l'élève.</p>
  ${sk.map(id=>`<details class="card lvl" data-k="ev-${s.id}-${id}"${refOpen.has('ev-'+s.id+'-'+id)?' open':''}><summary class="row"><h2 class="row" style="gap:8px;flex:1;min-width:0"><i class="dot" style="background:${P[S[id].p].color};width:10px;height:10px"></i>${esc(S[id].name)}</h2><span class="muted num" style="font-size:0.8125rem">${pres.filter(st=>st.levels[id]>=2).length}/${pres.length} acquis</span></summary>
    <div>${pres.map(st=>`<div class="skillrow"><span class="name">${esc(st.apelido)}<span class="lvname">${lvInfo(st,id)}</span></span>${levelBtns(st.id,id,st.levels[id])}</div>`).join('')}</div></details>`).join('')}
  <div class="btns"><button class="btn" data-act="go" data-to="home">Passer</button><button class="btn primary" data-act="evaldone">Terminer</button></div>`;
}

function skillsPage(){
  const seg=`<div class="seg" role="group" aria-label="Affichage"><button aria-pressed="${skillsTab==='ref'}" class="${skillsTab==='ref'?'on':''}" data-act="seg" data-v="ref">Référentiel</button><button aria-pressed="${skillsTab==='cordas'}" class="${skillsTab==='cordas'?'on':''}" data-act="seg" data-v="cordas">Cordes</button></div>`;
  if(skillsTab==='ref') return `<h1>Compétences</h1>${seg}
    <p class="muted" style="margin:0;font-size:0.875rem">Chaque corde a son référentiel, qui sert de repère et ne bloque pas le passage. Touche une compétence pour la renommer, la déplacer ou la supprimer. La barre montre la part des élèves concernés au niveau « Acquis » (« Souvent » pour la contribution).</p>
    <details class="card lvl" data-k="contrib"${refOpen.has('contrib')?' open':''}><summary class="row"><span class="row" style="gap:10px;flex:1;min-width:0"><i class="dot" style="background:var(--p-contrib);width:12px;height:12px"></i><span class="stack" style="gap:0"><b>Contribution au groupe</b><span class="muted" style="font-size:0.8125rem">Tous niveaux, compte autant que la technique</span></span></span></summary>
      ${SKILLS.filter(s=>s.p==='contrib').map(s=>{const n=students.filter(st=>st.levels[s.id]>=2).length;return `<div class="skillrow"><button class="skbtn" data-act="skedit" data-id="${s.id}">${esc(s.name)}<span class="pen" aria-hidden="true">✎</span></button><div class="progress" style="width:70px;flex:none"><span style="width:${100*n/students.length}%;background:var(--p-contrib)"></span></div><span class="muted num" style="font-size:0.8125rem;min-width:2.75rem;text-align:right;white-space:nowrap">${n}/${students.length}</span></div>`}).join('')}
      <button class="btn ghost" style="align-self:flex-start" data-act="skedit" data-p="contrib">+ Ajouter une contribution</button>
    </details>
    ${CORDAS.map((k,i)=>{const sk=SKILLS.filter(s=>s.c===i&&s.p!=='contrib');if(i>8)return '';const concern=students.filter(st=>st.corda>=i);
      return `<details class="card lvl" data-k="c${i}"${refOpen.has('c'+i)?' open':''}><summary class="row"><span class="row grow" style="gap:10px;flex:1;min-width:0">${cordaEl(i)}<span class="stack" style="gap:0"><b>${i===0?'Débutant':'Corde '+k.name.toLowerCase()}</b><span class="muted" style="font-size:0.8125rem">${i===0?'Sans corde, vers la blanche':'Vers la corde '+CORDAS[i+1].name.toLowerCase()}</span></span></span><span class="muted num" style="font-size:0.8125rem">${sk.length} compétences</span></summary>
      ${PILLARS.filter(p=>sk.some(s=>s.p===p.id)).map(p=>`<div class="stack" style="gap:0"><span class="eyebrow row" style="gap:6px;padding-top:4px"><i class="dot" style="background:${p.color}"></i>${p.name}${(()=>{const c2=Math.max(...sk.filter(s=>s.p===p.id).map(s=>s.c2??s.c));return c2>i?(i===0?' · débutants et corde blanche':` · cordes ${k.name.toLowerCase()} et ${CORDAS[c2].name.toLowerCase()}`):''})()}</span>${sk.filter(s=>s.p===p.id).map(s=>{const n=concern.filter(st=>st.levels[s.id]>=2).length;return `<div class="skillrow"><button class="skbtn" data-act="skedit" data-id="${s.id}">${esc(s.name)}${s.opt?' <span class="pill warn" style="font-size:0.75rem">Facultatif</span>':''}<span class="pen" aria-hidden="true">✎</span></button><div class="progress" style="width:70px;flex:none"><span style="width:${concern.length?100*n/concern.length:0}%;background:${p.color}"></span></div><span class="muted num" style="font-size:0.8125rem;min-width:2.75rem;text-align:right;white-space:nowrap">${n}/${concern.length}</span></div>`}).join('')}</div>`).join('')}
      ${sk.length?'':'<span class="muted" style="font-size:0.8125rem">Aucune compétence pour l\'instant.</span>'}
      <button class="btn ghost" style="align-self:flex-start" data-act="skedit" data-c="${i}">+ Ajouter à ce niveau</button>
      </details>`}).join('')}
    <button class="btn" data-act="skedit">+ Nouvelle compétence</button>`;
  return `<h1>Compétences</h1>${seg}
  <div class="list" style="padding:0 14px"><div class="ladder">${CORDAS.map((c,i)=>{const now=students.filter(s=>s.corda===i);const cr=STEPS[i];
    const ready=students.filter(s=>s.corda===i-1&&readiness(s)?.eligible);
    return `<div class="rung"><div style="padding-top:6px">${cordaEl(i)}</div><div class="grow stack" style="gap:4px">
      <div class="row between"><b>${c.name}${c.sub?` <span class="muted" style="font-weight:500">· ${c.sub}</span>`:''}</b><span class="muted num" style="font-size:0.8125rem">${now.length?now.length+' élève'+(now.length>1?'s':''):''}</span></div>
      ${cr?`<span class="muted" style="font-size:0.8125rem">Au moins 1 an ${i===1?'de pratique':'en corde '+CORDAS[i-1].name.toLowerCase()}. Repères : référentiel, contribution, présence.</span>`:i===0?'<span class="muted" style="font-size:0.8125rem">À l\'arrivée</span>':i>=8?'<span class="muted" style="font-size:0.8125rem">Décision du mestre</span>':'<span class="muted" style="font-size:0.8125rem">Critères à définir</span>'}
      ${ready.length?`<span style="font-size:0.8125rem"><span class="pill ok">Possible</span> ${ready.map(s=>esc(s.apelido)).join(', ')}</span>`:''}
    </div></div>`}).join('')}</div></div>`;
}

function studentSheet(id){
  const st=byId(id);
  openSheet(`<form class="sheet" id="stform" data-id="${id}" aria-label="Modifier ${esc(st.apelido)}">
    <h2>Modifier ${esc(st.apelido)}</h2>
    <div class="field"><label for="s-ap">Apelido</label><input class="input" id="s-ap" value="${esc(st.apelido)}" required></div>
    <div class="field"><label for="s-nom">Prénom et nom</label><input class="input" id="s-nom" value="${esc(st.nom)}" required></div>
    ${st.photo?`<div class="photo-field">${avatar(st)}<span class="muted" style="flex:1;font-size:0.8125rem">Pour changer la photo, touche-la sur la fiche.</span><button type="button" class="btn ghost" style="color:var(--red)" data-act="rmphoto" data-id="${id}">Retirer la photo</button></div>`:''}
    <div class="field"><label for="s-dt">Date d'arrivée</label><input class="input" type="date" id="s-dt" value="${st.arrivee}" required></div>
    <div class="field"><label for="s-bd">Date de naissance (facultatif)</label><input class="input" type="date" id="s-bd" value="${st.naissance||''}" max="${TODAY_ISO}"></div>
    <fieldset style="border:0;padding:0;margin:0;display:flex;flex-direction:column;gap:5px"><legend style="font-size:0.8125rem;font-weight:600;color:var(--muted);padding:0;margin-bottom:5px">Statut</legend>
      <div class="seg">${Object.entries(STATUS).map(([k,l])=>`<label class="segopt"><input type="radio" name="s-status" value="${k}"${(st.status||'actif')===k?' checked':''}>${l}</label>`).join('')}</div>
      <span class="muted" style="font-size:0.8125rem">En pause : reste dans la liste, sort de l'appel et des relances. Inactif : sort de la liste et de l'appel, rien n'est effacé.</span></fieldset>
    <div class="field"><label for="s-snote">Précision sur le statut (facultatif)</label><input class="input" id="s-snote" value="${esc(st.statusNote||'')}" placeholder="Blessure, voyage, a déménagé…"></div>
    <div class="btns"><button type="button" class="btn" data-act="close">Annuler</button><button class="btn primary" type="submit">Enregistrer</button></div>
  </form>`);
  document.getElementById('s-ap').focus();
}
function batizadoSheet(id){
  const st=byId(id), last=lastCorda(st);
  openSheet(`<form class="sheet" id="batform" data-id="${id}" aria-label="Nouvelle corde pour ${esc(st.apelido)}">
    <h2>Nouvelle corde pour ${esc(st.apelido)}</h2>
    <p class="muted" style="margin:0;font-size:0.875rem">Corde actuelle : ${cordaName(st.corda)}, depuis le ${fmt(last)} ${last.slice(0,4)}.</p>
    <div class="field"><label for="b-c">Nouvelle corde</label><select class="input" id="b-c">${CORDAS.map((k,i)=>i>st.corda?`<option value="${i}"${i===st.corda+1?' selected':''}>${cordaName(i)}</option>`:'').join('')}</select></div>
    <div class="field"><label for="b-dt">Date</label><input class="input" type="date" id="b-dt" value="${TODAY_ISO}" required></div>
    <div class="field"><label for="b-ev">Occasion</label><select class="input" id="b-ev"><option>Batizado</option><option>Troca de cordas</option></select></div>
    <div class="btns"><button type="button" class="btn" data-act="close">Annuler</button><button class="btn primary" type="submit">Enregistrer</button></div>
  </form>`);
  document.getElementById('b-c').focus();
}
function leaveSheet(to){
  openSheet(`<form class="sheet" id="leaveform" aria-label="Modifications non enregistrées">
    <h2>Modifications non enregistrées</h2>
    <p class="muted" style="margin:0">La séance du ${fmtL(draft.date)} a des changements qui ne sont pas encore enregistrés.</p>
    <div class="btns"><button type="button" class="btn" data-act="leave" data-to="${to}">Quitter sans enregistrer</button><button type="button" class="btn primary" data-act="saveleave" data-to="${to}">Enregistrer</button></div>
  </form>`);
}
function addSheet(){
  openSheet(`<form class="sheet" id="addform" aria-label="Ajouter un élève">
    <h2>Nouvel élève</h2>
    <div class="photo-field"><span id="f-prev"><div class="avatar" style="background:var(--sunk);color:var(--muted)" aria-hidden="true">${CAM}</div></span><button type="button" class="btn" data-act="addphoto">Ajouter une photo</button><span class="muted" style="font-size:0.8125rem">Facultatif</span></div>
    <div class="field"><label for="f-ap">Apelido</label><input class="input" id="f-ap" placeholder="Laisser vide s'il n'a pas encore été baptisé"></div>
    <div class="field"><label for="f-nom">Prénom et nom</label><input class="input" id="f-nom" required></div>
    <div class="field"><label for="f-dt">Date d'arrivée</label><input class="input" type="date" id="f-dt" value="${TODAY_ISO}" required></div>
    <div class="field"><label for="f-bd">Date de naissance (facultatif)</label><input class="input" type="date" id="f-bd" max="${TODAY_ISO}"></div>
    <div class="field"><label for="f-c">Corde actuelle</label><select class="input" id="f-c">${CORDAS.map((c,i)=>`<option value="${i}">${cordaName(i)}</option>`).join('')}</select></div>
    <div class="btns"><button type="button" class="btn" data-act="close">Annuler</button><button class="btn primary" type="submit">Ajouter</button></div>
  </form>`);
  document.getElementById('f-nom').focus();
}

/* ---------- Rendu & événements ---------- */
const TABS=[['home','Accueil','<path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"/>'],
  ['students','Élèves','<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M16 14.6c2.6-.1 4.6 1.6 5.4 4.4"/>'],
  ['sessions','Séances','<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'],
  ['skills','Compétences','<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3"/><path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3"/>']];
function render(focusSel){
  const prev=focusSel||focusKey(document.activeElement);
  const V={home,students:studentsList,student:studentPage,sessions:sessionsList,edit:editor,appel,evaluate,skills:skillsPage,settings:settingsPage};
  document.getElementById('view').innerHTML=V[view.name]();
  document.getElementById('tabs').innerHTML=TABS.map(([id,l,ic])=>`<button class="${tab===id?'on':''}" data-act="go" data-to="${id}" aria-current="${tab===id?'page':'false'}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ic}</svg>${l}</button>`).join('');
  const h1=document.querySelector('#view h1'); if(h1) h1.tabIndex=-1;
  if(!gateMode) document.title=(h1?h1.textContent.trim():'Accueil')+' · Rueda de Sol';
  document.getElementById('demo-badge').hidden=!sample;
  scheduleSave();
  if(prev){const el=document.querySelector(prev);if(el)el.focus({preventScroll:true})}
}
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-act]'); if(!t) return;
  const a=t.dataset.act, d=t.dataset;
  if(a==='close'){ if(e.target===t) closeSheet(); return }
  if(['ttl','dt','tm','bt','bp','notes'].includes(a)) return;
  e.preventDefault();
  switch(a){
    case 'go': if(view.name==='edit'&&draft&&JSON.stringify(draft)!==JSON.stringify(sess(draft.id))){leaveSheet(d.to);break} draft=null; appelSel=null; go(d.to); break;
    case 'leave': closeSheet(false); draft=null; appelSel=null; go(d.to||'sessions'); break;
    case 'saveleave':{closeSheet(false); const i=sessions.findIndex(x=>x.id===draft.id); sessions[i]=draft; draft=null; toast('Séance enregistrée'); go(d.to); break}
    case 'evalgo': go('evaluate',{id:d.id}); break;
    case 'student': go('student',{id:d.id}); tab='students'; render(); break;
    case 'add': pendingPhoto=null; addSheet(); break;
    case 'sample':{if(students.length||archived.length)break; const d=buildSample(); students.push(...d.students); archived.push(...d.archived); sessions.push(...d.sessions); sample=true; toast('Exemples chargés'); go('home'); break}
    case 'export': exportBackup(); break;
    case 'import': pickBackup(); break;
    case 'keeplocal': closeSheet(false); cloudPush(); toast('La copie en ligne est remplacée par ce téléphone'); break;
    case 'keepremote': closeSheet(false); cloud.status='syncing'; refreshCloud(); cloudPull().then(()=>{toast('Copie en ligne récupérée');go('home')}).catch(e=>{cloudFail(e);refreshCloud()}); break;
    case 'logout': if(cloud.mod) cloud.mod.signOut().then(()=>toast('Déconnecté·e. Les données restent sur ce téléphone.')); break;
    case 'syncnow': cloudConnect(); break;
    case 'google':{const err=document.getElementById('acc-gerr'); if(err) err.textContent='';
      cloud.mod.signInGoogle().catch(x=>{ if(AUTH_SILENT.includes(x.code)) return; const e2=document.getElementById('acc-gerr'); if(e2) e2.textContent=AUTH_ERR[x.code]||'La connexion Google a échoué. Réessaie.'}); break}
    case 'resetpw':{const em=(document.getElementById('acc-email')||{}).value; if(!em){toast("Saisis d'abord ton e-mail.");break}
      cloud.mod.resetPassword(em).then(()=>toast('E-mail de réinitialisation envoyé')).catch(()=>toast("L'e-mail n'a pas pu être envoyé. Vérifie l'adresse.")); break}
    case 'wipe':{
      if(!d.step){t.dataset.step='1';t.textContent='Confirmer : tout effacer';t.classList.remove('ghost');t.classList.add('danger');break}
      if(cloud.user&&cloud.mod){clearTimeout(pushT);pushT=null;cloud.mod.signOut()} syncUid=null; sentPhotos={};
      applyState({}); toast(cloud.enabled?'Données de ce téléphone effacées. La copie en ligne est conservée.':'Toutes les données ont été effacées'); go('home'); break}
    case 'newtoday':{const id='n'+Date.now();sessions.push({id,date:TODAY_ISO,time:settings.time,done:false,present:[],blocks:fixedBlocks()});draft=null;go('edit',{id});tab='sessions';render();break}
    case 'photo': {const st=byId(d.id); pickPhoto(url=>{st.photo=url; toast('Photo enregistrée'); keep();}); break}
    case 'rmphoto': {const st=byId(d.id); delete st.photo; closeSheet(); toast('Photo retirée'); keep(); break}
    case 'addphoto': pickPhoto(url=>{pendingPhoto=url; const p=document.getElementById('f-prev'); if(p) p.innerHTML=`<img class="avatar" src="${url}" alt="Aperçu de la photo">`; t.textContent='Changer la photo';}); break;
    case 'stedit': studentSheet(d.id); break;
    case 'bat': batizadoSheet(d.id); break;
    case 'contrib': contribSheet(d.id); break;
    case 'lvl':{const st=byId(d.st); setLevel(st,d.sk,+d.l); const y=window.scrollY; render(); window.scrollTo(0,y); break}
    case 'edit': draft=null; go('edit',{id:d.id}); tab='sessions'; render(); break;
    case 'new':{const id='n'+Date.now();sessions.push({id,date:sessions.some(s=>s.date===TODAY_ISO)?nextTraining(true):nextTraining(false),time:settings.time,done:false,present:[],blocks:fixedBlocks()});draft=null;go('edit',{id});tab='sessions';render();break}
    case 'bmin': draft.blocks[d.i].min=Math.max(5,draft.blocks[d.i].min+ +d.d); keep(); break;
    case 'bsk':{const b=draft.blocks[d.i];b.skills=b.skills.includes(d.sk)?b.skills.filter(x=>x!==d.sk):[...b.skills,d.sk];keep();break}
    case 'bdel': draft.blocks.splice(d.i,1); keep(); break;
    case 'bup':{const i=+d.i;[draft.blocks[i-1],draft.blocks[i]]=[draft.blocks[i],draft.blocks[i-1]];keep();break}
    case 'badd': libSheet(); break;
    case 'addlib':{const t=LIBK[d.k]; if(!t||!draft) break; const b=mkBlock(t); let at=draft.blocks.findIndex(x=>x.fixed==='end'); if(at<0) at=draft.blocks.length;
      draft.blocks.splice(at,0,b); closeSheet(false); keep(); toast(`Ajouté : ${t.title}`); break}
    case 'plan': proposePlan(draft); keep(); toast('Séance proposée : ajuste-la si besoin'); break;
    case 'save': case 'saveappel':{const i=sessions.findIndex(s=>s.id===draft.id);sessions[i]=draft;const id=draft.id;draft=null;
      if(a==='saveappel'){appelSel=null;go('appel',{id});tab='home';render()}else{go('sessions');toast('Séance enregistrée')};break}
    case 'appel': appelSel=null; go('appel',{id:d.id}); break;
    case 'tog': appelSel.has(d.id)?appelSel.delete(d.id):appelSel.add(d.id); keep(); break;
    case 'valid':{const s=sess(d.id);const was=s.done;s.present=[...appelSel];s.done=true;appelSel=null;if(was){toast(`Appel corrigé : ${s.present.length} présents`);draft=null;go('sessions');break}toast(`${s.present.length} présences enregistrées`);draft=null;go(s.date===TODAY_ISO?'home':'sessions');break}
    case 'evaldone': toast('Niveaux mis à jour'); go('home'); break;
    case 'seg': skillsTab=d.v; render(); break;
    case 'skedit': skillSheet(d.id,{p:d.p,c:d.c}); break;
    case 'skdel':{
      if(!d.step){t.dataset.step='1';t.textContent='Confirmer la suppression';t.classList.remove('ghost');t.classList.add('danger');break}
      const id=d.id; SKILLS.splice(SKILLS.findIndex(x=>x.id===id),1); delete S[id];
      sessions.forEach(se=>se.blocks.forEach(b=>b.skills=b.skills.filter(x=>x!==id)));
      if(draft) draft.blocks.forEach(b=>b.skills=b.skills.filter(x=>x!==id));
      closeSheet(); toast('Compétence supprimée'); keep(); break}
  }
});
function keep(sel){const y=window.scrollY;render(sel);window.scrollTo(0,y)}
document.addEventListener('input',e=>{
  const t=e.target, a=t.dataset.act;
  if(t.id==='q'){filter=t.value;const pos=t.selectionStart;render();const q=document.getElementById('q');q.focus();q.setSelectionRange(pos,pos);return}
  if(!draft&&a!=='notes') return;
  if(a==='ttl') draft.title=t.value; if(a==='dt') draft.date=t.value; if(a==='tm') draft.time=t.value;
  if(a==='bt') draft.blocks[t.dataset.i].title=t.value;
  if(a==='notes') byId(t.dataset.id).notes=t.value;
  if(a==='notes') scheduleSave();
});
document.addEventListener('change',e=>{const t=e.target;
  if(t.dataset.set==='day'){const v=+t.value;settings.days=t.checked?[...new Set([...settings.days,v])]:settings.days.filter(x=>x!==v);keep();return}
  if(t.dataset.set==='focus'){settings.focus=Object.assign({},settings.focus,{[t.dataset.day]:t.value});scheduleSave();return}
  if(t.dataset.set==='time'){settings.time=t.value||'19:30';scheduleSave();return}if(t.dataset.act==='bp'){const b=draft.blocks[t.dataset.i];b.p=t.value;b.skills=[];keep()}});
document.addEventListener('submit',e=>{
  e.preventDefault();
  if(e.target.id==='loginform'){
    const em=document.getElementById('acc-email').value.trim(), pw=document.getElementById('acc-pw').value, err=document.getElementById('acc-err');
    if(!cloud.mod) return; err.textContent='';
    const signup=e.submitter&&e.submitter.value==='signup';
    (signup?cloud.mod.signUp(em,pw):cloud.mod.signIn(em,pw)).catch(x=>{err.textContent=AUTH_ERR[x.code]||(signup?"Le compte n'a pas pu être créé. Réessaie.":'La connexion a échoué. Réessaie.')}); return}
  if(e.target.id==='importform'){ if(!pendingImport) return; applyState(pendingImport); pendingImport=null; closeSheet(false); toast('Sauvegarde importée'); go('home'); return}
  if(e.target.id==='stform'){
    const st=byId(e.target.dataset.id), ap=document.getElementById('s-ap').value.trim(), nom=document.getElementById('s-nom').value.trim();
    if(!ap||!nom) return; Object.assign(st,{apelido:ap,nom,arrivee:document.getElementById('s-dt').value,naissance:document.getElementById('s-bd').value||null});
    const was=st.status||'actif', ns=document.querySelector('input[name="s-status"]:checked').value; setStatus(st,ns,document.getElementById('s-snote').value.trim());
    closeSheet(); toast(ns!==was?`${st.apelido} : ${STATUS[ns].toLowerCase()}`:'Fiche mise à jour'); keep(); return}
  if(e.target.id==='batform'){
    const st=byId(e.target.dataset.id), c=+document.getElementById('b-c').value;
    st.hist.push({corda:c,date:document.getElementById('b-dt').value,event:document.getElementById('b-ev').value});
    st.hist.sort((a,b)=>a.date.localeCompare(b.date)); st.corda=c;
    closeSheet(); toast(`${st.apelido} passe en corde ${CORDAS[c].name.toLowerCase()}`); keep(); return}
  if(e.target.id==='skillform'){
    const name=document.getElementById('k-name').value.trim(); if(!name) return;
    const p=document.getElementById('k-p').value, c=p==='contrib'?0:+document.getElementById('k-c').value, opt=document.getElementById('k-opt').checked;
    const id=e.target.dataset.id;
    if(id){ if(S[id].c!==c) delete S[id].c2; Object.assign(S[id],{name,p,c,opt}); }
    else {const nid='k'+Date.now(), sk={p,id:nid,name,c,opt}; SKILLS.push(sk); S[nid]=sk; students.forEach(st=>st.levels[nid]=0);}
    refOpen.add(p==='contrib'?'contrib':'c'+c);
    closeSheet(); toast(id?'Compétence modifiée':'Compétence ajoutée'); keep(); return}
  if(e.target.id==='contribform'){const st=byId(e.target.dataset.id);const text=document.getElementById('c-txt').value.trim();if(!text)return;
    st.contribs.push({date:document.getElementById('c-dt').value,text});closeSheet();toast('Contribution notée');keep();return}
  const nom=document.getElementById('f-nom').value.trim(); if(!nom) return;
  const ap=document.getElementById('f-ap').value.trim()||nom.split(' ')[0];
  const st={id:'e'+Date.now(),apelido:ap,nom,arrivee:document.getElementById('f-dt').value,naissance:document.getElementById('f-bd').value||null,corda:+document.getElementById('f-c').value,levels:Object.fromEntries(SKILLS.map(s=>[s.id,0])),hist:[],assid:.8,color:AV[students.length%AV.length],notes:'',contribs:[],since:{},lvlHist:[]}; if(pendingPhoto){st.photo=pendingPhoto;pendingPhoto=null}
  students.push(st); closeSheet(false); toast(`${ap} ajouté·e`); go('student',{id:st.id}); tab='students'; render();
});
// Flèches pour changer de niveau dans un groupe de boutons radio
document.addEventListener('keydown',e=>{
  const t=e.target; if(!t.getAttribute||t.getAttribute('role')!=='radio'||t.dataset.act!=='lvl') return;
  const dir={ArrowRight:1,ArrowUp:1,ArrowLeft:-1,ArrowDown:-1}[e.key]; if(!dir) return;
  e.preventDefault(); const st=byId(t.dataset.st), sk=t.dataset.sk, l=Math.max(0,Math.min(3,st.levels[sk]+dir)); setLevel(st,sk,l);
  keep(`[data-act="lvl"][data-st="${st.id}"][data-sk="${sk}"][data-l="${l}"]`);
});
/* ---------- Démarrage ---------- */
(async function init(){
  try{ const st=await idbGet('state'); if(st) applyState(st);
    const m=await idbGet('meta'); if(m){ localSavedAt=m.localSavedAt||0; syncUid=m.syncUid||null; sentPhotos=m.sentPhotos||{}; }
    lastSavedJson=dataJson(); }
  catch(e){ console.error(e); toast("Les données de ce téléphone n'ont pas pu être lues."); }
  loaded=true;
  if(navigator.storage&&navigator.storage.persist) navigator.storage.persist().catch(()=>{});
  updateGate(); render();
  if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(e=>console.warn('Service worker',e));
  cloudStart();
})();
