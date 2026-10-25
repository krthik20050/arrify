
(function(){
  var base="/collections/buy-vinyl-stickers-online-india";
  var vibes=[
    {emoji:"🏎️",label:"Cars & Bikes",filter:"Cars, Bikes & Racing",bg:"linear-gradient(135deg,#dc2626,#991b1b)",count:"190+"},
    {emoji:"⛩️",label:"Anime",filter:"Anime & Manga",bg:"linear-gradient(135deg,#7c3aed,#4c1d95)",count:"420+"},
    {emoji:"😂",label:"Humor",filter:"Humor & Attitude",bg:"linear-gradient(135deg,#eab308,#a16207)",count:"980+"},
    {emoji:"💪",label:"Hustle",filter:"Motivational & Hustle",bg:"linear-gradient(135deg,#059669,#065f46)",count:"500+"},
    {emoji:"🎬",label:"Pop Culture",filter:"Pop Culture",bg:"linear-gradient(135deg,#c026d3,#7e22ce)",count:"280+"},
    {emoji:"🕉️",label:"Spiritual",filter:"Spiritual & Faith",bg:"linear-gradient(135deg,#f59e0b,#b45309)",count:"160+"},
    {emoji:"🇮🇳",label:"Desi",filter:"Indian & Desi",bg:"linear-gradient(135deg,#ea580c,#9a3412)",count:"160+"},
    {emoji:"🏔️",label:"Travel",filter:"Nature & Travel",bg:"linear-gradient(135deg,#16a34a,#166534)",count:"170+"},
    {emoji:"💀",label:"Dark & Edgy",filter:"Dark & Edgy",bg:"linear-gradient(135deg,#374151,#111827)",count:"120+"},
    {emoji:"🎮",label:"Gaming",filter:"Gaming",bg:"linear-gradient(135deg,#0891b2,#155e75)",count:"65+"},
    {emoji:"⚽",label:"Sports",filter:"Sports & Fitness",bg:"linear-gradient(135deg,#0d9488,#134e4a)",count:"120+"},
    {emoji:"💻",label:"Tech & Code",filter:"Tech & Code",bg:"linear-gradient(135deg,#2563eb,#1e3a8a)",count:"100+"},
    {emoji:"🚀",label:"Space",filter:"Space & Sci-Fi",bg:"linear-gradient(135deg,#4f46e5,#312e81)",count:"75+"},
    {emoji:"❤️",label:"Love",filter:"Love & Emotions",bg:"linear-gradient(135deg,#e11d48,#9f1239)",count:"70+"},
    {emoji:"🐾",label:"Animals",filter:"Animals & Pets",bg:"linear-gradient(135deg,#d97706,#92400e)",count:"70+"},
    {emoji:"🍕",label:"Food",filter:"Food & Drinks",bg:"linear-gradient(135deg,#ca8a04,#854d0e)",count:"70+"},
    {emoji:"🎸",label:"Music",filter:"Music",bg:"linear-gradient(135deg,#db2777,#9d174d)",count:"30+"},
    {emoji:"⚠️",label:"Warning Signs",filter:"Warning & Signs",bg:"linear-gradient(135deg,#d97706,#78350f)",count:"60+"},
    {emoji:"🇯🇵",label:"JDM",filter:"Japanese & JDM",bg:"linear-gradient(135deg,#be123c,#881337)",count:"35+"},
    {emoji:"🎨",label:"Abstract",filter:"Abstract & Artistic",bg:"linear-gradient(135deg,#7c3aed,#5b21b6)",count:"50+"},
    {emoji:"✍️",label:"Quotes",filter:"Quotes & Typography",bg:"linear-gradient(135deg,#475569,#1e293b)",count:"60+"}
  ];
  var grid=document.getElementById("siuVibeGrid");
  vibes.forEach(function(v){
    var a=document.createElement("a");
    a.className="siu-vibe-card";
    a.href=base+"?filter.p.m.filters.genre="+encodeURIComponent(v.filter);
    a.style.background=v.bg;
    a.innerHTML='<span class="siu-vibe-card-emoji">'+v.emoji+'</span><span class="siu-vibe-card-label">'+v.label+'</span><span class="siu-vibe-card-count">'+v.count+' designs</span>';
    grid.appendChild(a);
  });
})();
