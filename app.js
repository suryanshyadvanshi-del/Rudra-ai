const $ = s => document.querySelector(s);
let mode = "chat";
const tabs = [...document.querySelectorAll(".tab")];
const config = {
  chat: { title:"Chat with RUDRA", icon:"✦", label:"What would you like to know?", placeholder:"Ask a question, explain a concept, brainstorm an idea...", engine:"Groq → Gemini fallback", hint:"Text requests automatically try the backup provider." },
  code: { title:"Code with RUDRA", icon:"{ }", label:"What do you want to build or fix?", placeholder:"Describe your app, code, bug, or programming task...", engine:"Groq → Gemini fallback", hint:"Mention your language, framework and expected result." },
  image: { title:"Create an image", icon:"▧", label:"Describe the image you want", placeholder:"A cinematic futuristic city at sunset, detailed digital art...", engine:"Hugging Face image model", hint:"Image generation may queue or be unavailable on free quotas." }
};
function setMode(next) {
  mode = next;
  tabs.forEach(t => t.classList.toggle("active", t.dataset.mode === mode));
  const c = config[mode];
  $("#modeTitle").textContent=c.title; $("#modeIcon").textContent=c.icon;
  $("#promptLabel").textContent=c.label; $("#prompt").placeholder=c.placeholder;
  $("#engine").textContent=c.engine; $("#hint").textContent=c.hint;
  $("#run").innerHTML = (mode === "image" ? "Create image" : "Generate") + " <span>↗</span>";
}
tabs.forEach(t => t.addEventListener("click",()=>setMode(t.dataset.mode)));
function showText(text, provider) {
  $("#result").textContent = text + (provider ? `\n\n— ${provider}` : "");
  $("#resultWrap").hidden=false;
}
$("#run").addEventListener("click", async () => {
  const prompt=$("#prompt").value.trim();
  if(!prompt){$("#prompt").focus();return}
  const btn=$("#run"); btn.disabled=true; btn.textContent="Working…";
  $("#resultWrap").hidden=false; $("#result").textContent="RUDRA is working on your request…";
  try {
    const endpoint = mode === "image" ? "/.netlify/functions/image" : "/.netlify/functions/ai";
    const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt,mode})});
    const data=await response.json();
    if(!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
    if(mode==="image"){
      $("#result").replaceChildren();
      const img=document.createElement("img"); img.src=data.image; img.alt="AI generated image";
      $("#result").append(img);
      const note=document.createElement("p"); note.textContent=`Generated with ${data.provider}`; $("#result").append(note);
    } else showText(data.answer,data.provider);
  } catch(e) {
    $("#result").textContent="Error: "+e.message; $("#result").classList.add("error");
  } finally {btn.disabled=false; setMode(mode)}
});
$("#copy").addEventListener("click",async()=>{
  const text=$("#result").innerText;
  try{await navigator.clipboard.writeText(text);$("#copy").textContent="Copied!";setTimeout(()=>$("#copy").textContent="Copy",1200)}
  catch{$("#copy").textContent="Select text to copy"}
});
setMode("chat");