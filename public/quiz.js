
(function(){
  var themes=[
    {id:"cars",label:"Cars & Bikes",emoji:"\u{1F3CE}",color:"#ef4444",filter:"Cars, Bikes & Racing"},
    {id:"anime",label:"Anime",emoji:"\u26E9",color:"#8b5cf6",filter:"Anime & Manga"},
    {id:"gaming",label:"Gaming",emoji:"\u{1F3AE}",color:"#06b6d4",filter:"Gaming"},
    {id:"spiritual",label:"Spiritual",emoji:"\u{1F549}",color:"#f59e0b",filter:"Spiritual & Faith"},
    {id:"motivational",label:"Hustle",emoji:"\u{1F4AA}",color:"#10b981",filter:"Motivational & Hustle"},
    {id:"nature",label:"Travel",emoji:"\u{1F3D4}",color:"#22c55e",filter:"Nature & Travel"},
    {id:"animals",label:"Animals",emoji:"\u{1F43E}",color:"#f97316",filter:"Animals & Pets"},
    {id:"dark",label:"Dark & Edgy",emoji:"\u{1F480}",color:"#6b7280",filter:"Dark & Edgy"},
    {id:"music",label:"Music",emoji:"\u{1F3B8}",color:"#ec4899",filter:"Music"},
    {id:"food",label:"Food",emoji:"\u{1F355}",color:"#f59e0b",filter:"Food & Drinks"},
    {id:"space",label:"Space",emoji:"\u{1F680}",color:"#6366f1",filter:"Space & Sci-Fi"},
    {id:"humor",label:"Humor",emoji:"\u{1F602}",color:"#eab308",filter:"Humor & Attitude"},
    {id:"sports",label:"Sports",emoji:"\u26BD",color:"#14b8a6",filter:"Sports & Fitness"},
    {id:"tech",label:"Tech & Code",emoji:"\u{1F4BB}",color:"#3b82f6",filter:"Tech & Code"},
    {id:"love",label:"Love",emoji:"\u2764",color:"#f43f5e",filter:"Love & Emotions"},
    {id:"japanese",label:"JDM",emoji:"\u{1F1EF}\u{1F1F5}",color:"#e11d48",filter:"Japanese & JDM"},
    {id:"warning",label:"Warning Signs",emoji:"\u26A0",color:"#eab308",filter:"Warning & Signs"},
    {id:"indian",label:"Desi",emoji:"\u{1F1EE}\u{1F1F3}",color:"#f97316",filter:"Indian & Desi"},
    {id:"popculture",label:"Pop Culture",emoji:"\u{1F3AC}",color:"#a855f7",filter:"Pop Culture"},
    {id:"abstract",label:"Abstract",emoji:"\u{1F3A8}",color:"#8b5cf6",filter:"Abstract & Artistic"},
    {id:"quotes",label:"Quotes",emoji:"\u270D",color:"#94a3b8",filter:"Quotes & Typography"}
  ];
  var styles=[
    {id:"minimal",label:"MINIMAL",desc:"Clean & Simple",grad:"linear-gradient(135deg,#334155,#1e293b)",icon:"\u25FB",filter:"Minimal"},
    {id:"bold",label:"BOLD & LOUD",desc:"In Your Face",grad:"linear-gradient(135deg,#dc2626,#f97316)",icon:"\u{1F525}",filter:"Bold & Loud"},
    {id:"darkstyle",label:"DARK",desc:"Moody & Edgy",grad:"linear-gradient(135deg,#1a1a2e,#0a0a14)",icon:"\u{1F5A4}",filter:"Dark"},
    {id:"neon",label:"NEON GLOW",desc:"Electric Vibes",grad:"linear-gradient(135deg,#7c3aed,#2563eb)",icon:"\u{1F49C}",filter:"Neon & Glow"},
    {id:"cute",label:"CUTE",desc:"Kawaii & Soft",grad:"linear-gradient(135deg,#ec4899,#f9a8d4)",icon:"\u{1F338}",filter:"Cute & Kawaii"},
    {id:"illustrated",label:"ILLUSTRATED",desc:"Art & Detail",grad:"linear-gradient(135deg,#0891b2,#2563eb)",icon:"\u{1F3A8}",filter:"Illustrated"},
    {id:"lineart",label:"LINE ART",desc:"Simple Lines",grad:"linear-gradient(135deg,#475569,#64748b)",icon:"\u270F",filter:"Line Art"},
    {id:"retro",label:"RETRO",desc:"Old School",grad:"linear-gradient(135deg,#b45309,#d97706)",icon:"\u{1F4FB}",filter:"Retro & Vintage"}
  ];
  var themeCounts={
    cars:193, anime:429, gaming:68, spiritual:164, motivational:509,
    nature:178, animals:76, dark:125, music:33, food:73, space:82,
    humor:984, sports:123, tech:102, love:74, japanese:37, warning:62,
    indian:167, popculture:286, abstract:51, quotes:60
  };
  var curStep=0,persona=null,selThemes=[],selStyle=null;
  var tg=document.getElementById('fvqThemes');
  themes.forEach(function(t){
    var b=document.createElement('button');b.className='fvq-theme-btn';b.id='fvqt-'+t.id;
    b.innerHTML='<div class="fvq-theme-emoji">'+t.emoji+'</div><div class="fvq-theme-label">'+t.label+'</div>';
    b.onclick=function(){toggleTheme(t.id,t.color)};tg.appendChild(b);
  });
  var sg=document.getElementById('fvqStyles');
  styles.forEach(function(s){
    var b=document.createElement('button');b.className='fvq-style-btn';b.style.background=s.grad;
    b.innerHTML='<span class="fvq-style-emoji">'+s.icon+'</span><span class="fvq-style-label">'+s.label+'</span><span class="fvq-style-desc">'+s.desc+'</span>';
    b.onclick=function(){selStyle=s.id;setTimeout(function(){fvqGo(4)},350)};sg.appendChild(b);
  });
  function toggleTheme(id,color){
    var idx=selThemes.indexOf(id);
    if(idx>-1)selThemes.splice(idx,1);else if(selThemes.length<3)selThemes.push(id);else return;
    themes.forEach(function(t){
      var el=document.getElementById('fvqt-'+t.id);var on=selThemes.indexOf(t.id)>-1;
      el.className='fvq-theme-btn'+(on?' on':'');el.style.borderColor=on?t.color:'#1a1f2e';el.style.borderWidth=on?'2px':'1px';
      var old=el.querySelector('.fvq-check');if(old)old.remove();
      if(on){var ck=document.createElement('div');ck.className='fvq-check';ck.style.background=t.color;ck.textContent='\u2713';el.appendChild(ck)}
      el.querySelector('.fvq-theme-label').style.color=on?'#fff':'#94a3b8';
    });
    document.getElementById('fvqCount').textContent=selThemes.length;
    document.getElementById('fvqNextBtn').hidden=selThemes.length===0;
  }
  window.fvqGo=function(n){
    var wrap=document.getElementById('fvqS'+curStep);wrap.classList.add('fvq-fade');
    setTimeout(function(){
      for(var i=0;i<=4;i++){var el=document.getElementById('fvqS'+i);if(el)el.hidden=i!==n}
      document.getElementById('fvqBar').hidden=n===0||n===4;
      if(n>0&&n<4){document.getElementById('fvqFill').style.width=(n/3*100)+'%';document.getElementById('fvqStepNum').textContent=n+'/3'}
      if(n===4)showResults();curStep=n;
      document.getElementById('fvqS'+n).classList.remove('fvq-fade');window.scrollTo(0,0);
    },250);
  };
  window.fvqBack=function(){if(curStep>1)fvqGo(curStep-1);else fvqGo(0)};
  window.fvqPersona=function(p){
    persona=p;
    document.getElementById('fvqQ2').textContent=p==='me'?'What are you into?':'What are they into?';
    document.getElementById('fvqQ3Sub').textContent='What aesthetic speaks to '+(p==='me'?'you':p==='partner'?'your partner':p==='friend'?'your friend':'them')+'?';
    fvqGo(2);
  };
  function showResults(){
    var total=0;
    selThemes.forEach(function(tid){total+=(themeCounts[tid]||0)});
    var shown=Math.max(10,Math.floor(total/10)*10);
    var scoreEl=document.getElementById('fvqScore');
    scoreEl.textContent=shown+'+';
    scoreEl.style.fontSize=shown>=1000?'22px':'28px';
    document.getElementById('fvqRing').style.background='conic-gradient(#ffd700 0deg,#ffd700 360deg)';
    var html='';
    selThemes.forEach(function(tid){var t=themes.find(function(x){return x.id===tid});if(t)html+='<span class="fvq-tag">'+t.emoji+' '+t.label+'</span>'});
    if(selStyle){var s=styles.find(function(x){return x.id===selStyle});if(s)html+='<span class="fvq-tag gold">'+s.icon+' '+s.label+'</span>'}
    document.getElementById('fvqTags').innerHTML=html;
    var who=persona==='me'?'you':persona==='partner'?'your partner':persona==='friend'?'your friend':'them';
    document.getElementById('fvqResultSub').textContent='We found the perfect stickers for '+who;
    var base='/collections/buy-vinyl-stickers-online-india';var params=[];
    selThemes.forEach(function(tid){var t=themes.find(function(x){return x.id===tid});if(t)params.push('filter.p.m.filters.genre='+encodeURIComponent(t.filter))});
    if(selStyle){var s=styles.find(function(x){return x.id===selStyle});if(s)params.push('filter.p.m.filters.personality='+encodeURIComponent(s.filter))}
    document.getElementById('fvqResultLink').href=params.length>0?base+'?'+params.join('&'):base;
    for(var i=0;i<30;i++){var c=document.createElement('div');c.className='fvq-confetti';c.style.left=Math.random()*100+'%';c.style.top='-'+Math.random()*20+'%';c.style.background=['#ffd700','#ef4444','#8b5cf6','#06b6d4','#22c55e','#ec4899'][i%6];c.style.animation='confettiFall '+(1.5+Math.random()*2)+'s ease-in forwards';c.style.animationDelay=Math.random()*0.5+'s';c.style.transform='rotate('+Math.random()*360+'deg)';document.getElementById('fvq').appendChild(c);(function(el){setTimeout(function(){el.remove()},4000)})(c)}
  }
  window.fvqReset=function(){
    curStep=0;persona=null;selThemes=[];selStyle=null;
    document.getElementById('fvqCount').textContent='0';document.getElementById('fvqNextBtn').hidden=true;
    themes.forEach(function(t){var el=document.getElementById('fvqt-'+t.id);el.className='fvq-theme-btn';el.style.borderColor='#1a1f2e';el.style.borderWidth='1px';var ck=el.querySelector('.fvq-check');if(ck)ck.remove();el.querySelector('.fvq-theme-label').style.color='#94a3b8'});
    fvqGo(0);
  };
  window.fvqShare=function(){
    var text="I just found my sticker vibe! Take the quiz: stickitup.xyz/pages/find-your-vibe";
    if(navigator.share)navigator.share({text:text});else{navigator.clipboard.writeText(text);alert('Link copied!')}
  };
})();
