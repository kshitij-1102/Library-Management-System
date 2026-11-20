const STORAGE_KEY = "shelfwiseLibraryData";
let db = loadData();
let currentPage = "overview";
let modalConfig = null;
let toastTimer;

function clone(obj){ return JSON.parse(JSON.stringify(obj)); }
function loadData(){
  try { const saved = localStorage.getItem(STORAGE_KEY); return saved ? JSON.parse(saved) : clone(DEFAULT_DATA); }
  catch(e){ return clone(DEFAULT_DATA); }
}
function saveData(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); render(); }
function todayISO(){ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function fmtDate(value){ if(!value)return "—"; return new Date(value+"T00:00:00").toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}); }
function esc(v=""){ return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function bookBy(id){return db.books.find(x=>x.id===id);}
function studentBy(id){return db.students.find(x=>x.id===id);}
function activeLoans(){return db.loans.filter(x=>x.status==="On loan"||x.status==="Overdue");}
function overdueDays(loan){return Math.max(0,Math.floor((new Date(todayISO()+"T00:00:00")-new Date(loan.due+"T00:00:00"))/86400000));}
function availableCopies(book){return Math.max(0,book.total-db.loans.filter(l=>l.bookId===book.id&&(l.status==="On loan"||l.status==="Overdue")).length);}
function totalCopies(){return db.books.reduce((s,b)=>s+b.total,0);}
function pendingFines(){return db.loans.filter(l=>overdueDays(l)>0&&!db.payments[l.id]).reduce((s,l)=>s+overdueDays(l)*db.fineRate,0);}
function showToast(message){const el=document.getElementById("toast");el.textContent=message;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2600);}
function setPage(page){currentPage=page;document.querySelectorAll(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.page===page));render();}
function pageHeader(kicker,title,subtitle,button=""){return `<div class="page-heading"><div><p class="eyebrow">${kicker}</p><h1>${title}<span>.</span></h1><p>${subtitle}</p></div>${button}</div>`;}
function note(){return `<div class="page-note"><span>Made for the little moments between chapters.</span><span><b class="saved-dot">●</b> &nbsp;All changes saved locally</span></div>`;}
function render(){
  document.getElementById("breadcrumb").textContent=currentPage[0].toUpperCase()+currentPage.slice(1);
  document.getElementById("loanBadge").textContent=activeLoans().length;
  document.getElementById("promoCopies").textContent=totalCopies()-activeLoans().length;
  document.getElementById("todayDate").textContent=new Date().toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});
  const pages={overview:overviewPage,books:booksPage,students:studentsPage,loans:loansPage,fines:finesPage,settings:settingsPage};
  document.getElementById("pageContent").innerHTML=pages[currentPage]();
  document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>setPage(b.dataset.go)));
  const search=document.getElementById("tableSearch");if(search)search.addEventListener("input",()=>filterTable(search.value));
  const category=document.getElementById("categoryFilter");if(category)category.addEventListener("change",()=>filterTable(document.getElementById("tableSearch").value));
  const loanFilter=document.getElementById("loanFilter");if(loanFilter)loanFilter.addEventListener("change",()=>filterTable(document.getElementById("tableSearch").value));
}
function overviewPage(){
 const borrowed=activeLoans().length,available=totalCopies()-borrowed,overdue=db.loans.filter(l=>overdueDays(l)>0&&l.status!=="Returned").length;
 const recent=[...db.loans].sort((a,b)=>b.issued.localeCompare(a.issued)).slice(0,3);
 return `${pageHeader("","Overview","A little overview of what’s happening at your library.",`<button class="primary-btn" data-action="issue">＋ &nbsp; Issue a book</button>`)}
 <section class="hero"><div><p class="eyebrow">● &nbsp; YOUR LIBRARY, AT A GLANCE</p><h2>Small shelves.<br><em>Big ideas.</em></h2><p>It’s a good day to discover something new.</p><button class="secondary-btn" data-go="books">Explore the collection &nbsp; →</button></div><div class="hero-art"><div class="hero-book">DESIGN<br>OF<br>EVERYDAY</div><div class="hero-book">THE<br>MIDNIGHT<br>LIBRARY</div><div class="hero-book">WAYS OF<br>SEEING</div><div class="hero-book">THE<br>CREATIVE<br>ACT</div></div></section>
 <h3>At a glance</h3><div class="stats-grid">
 ${stat("▤","TOTAL BOOKS",totalCopies(),`${db.books.length} titles on shelf`,"icon-purple")}${stat("✓","AVAILABLE",available,`${totalCopies()?Math.round(available/totalCopies()*100):0}% ready to borrow`,"icon-green")}${stat("↗","ON LOAN",borrowed,`${db.loans.length} all-time loans`,"icon-blue")}${stat("♧","READERS",db.students.length,"registered students","icon-red")}${stat("◷","OVERDUE",overdue,"Needs a little nudge","icon-yellow")}
 </div><div class="dashboard-lower"><section class="panel"><div class="panel-head"><div><h3>Recent activity</h3><p>A little movement around the library.</p></div><button class="text-link" data-go="loans">All activity →</button></div>${recent.map(l=>`<div class="activity-row"><div class="avatar lilac">${esc((studentBy(l.studentId)?.name||"?").split(" ").map(x=>x[0]).join("").slice(0,2))}</div><div><b>${esc(studentBy(l.studentId)?.name||"Unknown reader")}</b><small>${esc(l.status==="Returned"?"returned": "borrowed")} ${esc(bookBy(l.bookId)?.title||"a book")}</small></div><time>${fmtDate(l.issued)}</time></div>`).join("")}</section><section class="panel"><div class="panel-head"><div><h3>A quick start</h3><p>Make room for the next reader.</p></div><span class="eyebrow">✧</span></div><div class="quick-row" data-action="addBook"><span class="stat-icon icon-purple">⊞</span><div><b>Add a new book</b><small>Grow your collection</small></div><span>→</span></div><div class="quick-row" data-action="addStudent"><span class="stat-icon icon-green">♧</span><div><b>Register a reader</b><small>Welcome someone new</small></div><span>→</span></div><div class="quick-row" data-action="issue"><span class="stat-icon icon-blue">↗</span><div><b>Issue a book</b><small>Send a story on its way</small></div><span>→</span></div></section></div>${note()}`;
}
function stat(icon,label,value,desc,color){return `<div class="stat-card"><span class="stat-icon ${color}">${icon}</span><small>${label}</small><strong>${value}</strong><p>${desc}</p></div>`;}
function booksPage(){
 return `${pageHeader("COLLECTION","Books","Your collection, ready to lend and discover.",`<button class="primary-btn" data-action="addBook">＋ &nbsp; Add book</button>`)}
 <section class="table-card"><div class="toolbar"><div class="search-box"><span>⌕</span><input id="tableSearch" placeholder="Search title, author or ID..."></div><select id="categoryFilter"><option value="">All categories</option>${[...new Set(db.books.map(b=>b.category))].map(c=>`<option>${esc(c)}</option>`).join("")}</select><span class="record-count">${db.books.length} books</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>BOOK</th><th>BOOK ID</th><th>CATEGORY</th><th>PUBLISHED</th><th>AVAILABILITY</th><th>ACTIONS</th></tr></thead><tbody id="tableRows">${db.books.map(b=>`<tr data-search="${esc((b.title+" "+b.author+" "+b.id).toLowerCase())}" data-category="${esc(b.category)}"><td><b>▤ &nbsp; ${esc(b.title)}</b><span class="subtext">${esc(b.author)}</span></td><td>${esc(b.id)}</td><td><span class="tag">${esc(b.category)}</span></td><td>${esc(b.year)}<span class="subtext">${esc(b.publisher)}</span></td><td class="available">● &nbsp;${availableCopies(b)} / ${b.total} copies</td><td class="action-cell"><button class="icon-btn" title="Edit" data-action="editBook" data-id="${esc(b.id)}">☷</button><button class="icon-btn" title="Delete" data-action="deleteBook" data-id="${esc(b.id)}">×</button></td></tr>`).join("")}</tbody></table></div></section>${note()}`;
}
function studentsPage(){
 return `${pageHeader("CAMPUS DIRECTORY","Students","The readers who make this library a little livelier.",`<button class="primary-btn" data-action="addStudent">＋ &nbsp; Add student</button>`)}
 <section class="table-card"><div class="toolbar"><div class="search-box"><span>⌕</span><input id="tableSearch" placeholder="Search name, ID or department..."></div><span class="record-count">${db.students.length} readers</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>STUDENT</th><th>STUDENT ID</th><th>DEPARTMENT</th><th>SEMESTER</th><th>CONTACT</th><th>ACTIONS</th></tr></thead><tbody>${db.students.map(s=>`<tr data-search="${esc((s.name+" "+s.id+" "+s.department).toLowerCase())}"><td><b>${esc(s.name)}</b><span class="subtext">${esc(s.email)}</span></td><td>${esc(s.id)}</td><td>${esc(s.department)}</td><td><span class="tag">${esc(s.semester)}</span></td><td>${esc(s.contact)}</td><td class="action-cell"><button class="icon-btn" title="Edit" data-action="editStudent" data-id="${esc(s.id)}">☷</button><button class="icon-btn" title="Delete" data-action="deleteStudent" data-id="${esc(s.id)}">×</button></td></tr>`).join("")}</tbody></table></div></section>${note()}`;
}
function loansPage(){
 return `${pageHeader("CIRCULATION","Loans","Keep track of every book on its way to a reader.",`<button class="primary-btn" data-action="issue">＋ &nbsp; Issue a book</button>`)}
 <section class="table-card"><div class="toolbar"><div class="search-box"><span>⌕</span><input id="tableSearch" placeholder="Search reader, title or loan ID..."></div><select id="loanFilter"><option value="">All loans</option><option>On loan</option><option>Overdue</option><option>Returned</option></select><span class="record-count">${db.loans.length} records</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>BOOK & READER</th><th>LOAN ID</th><th>ISSUED</th><th>DUE DATE</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>${db.loans.map(l=>{const late=overdueDays(l)>0&&l.status!=="Returned";const status=late?"Overdue":l.status;return `<tr data-search="${esc(((bookBy(l.bookId)?.title||"")+" "+(studentBy(l.studentId)?.name||"")+" "+l.id).toLowerCase())}" data-category="${esc(status)}"><td><b>${esc(bookBy(l.bookId)?.title||"Deleted book")}</b><span class="subtext">${esc(studentBy(l.studentId)?.name||"Deleted reader")}</span></td><td>${esc(l.id)}</td><td>${fmtDate(l.issued)}</td><td>${fmtDate(l.due)}${late?`<span class="subtext" style="color:#c56b38">${overdueDays(l)} days overdue</span>`:""}</td><td><span class="status ${status==="Returned"?"green":late?"orange":"blue"}">● &nbsp;${status}</span></td><td>${l.status!=="Returned"?`<button class="table-action" data-action="returnLoan" data-id="${esc(l.id)}">← &nbsp; Return</button>`:`<span class="subtext">Returned ${fmtDate(l.returned)}</span>`}</td></tr>`;}).join("")}</tbody></table></div></section>${note()}`;
}
function finesPage(){
 const rows=db.loans.filter(l=>overdueDays(l)>0||db.payments[l.id]);
 const collected=Object.keys(db.payments).filter(id=>db.payments[id]).reduce((s,id)=>{const l=db.loans.find(x=>x.id===id);return s+(l?overdueDays(l)*db.fineRate:0)},0);
 return `${pageHeader("ACCOUNTS","Fines","A clear view of overdue returns and outstanding dues.")}
 <section class="fine-banner"><div><p class="eyebrow">A LITTLE ACCOUNTABILITY</p><h2>Late by a day?<br><em>That’s okay.</em></h2><p>Fines help keep books moving between curious minds.</p></div><div class="fine-metric"><small>RATE PER OVERDUE DAY</small><strong>₹${db.fineRate}</strong><span>Set in library settings</span></div><div class="fine-metric"><small>PENDING FINES</small><strong>₹${pendingFines()}</strong><span>Across unpaid loans</span></div></section>
 <section class="table-card"><div class="panel-head" style="padding:17px 20px;margin:0"><div><h3>Overdue accounts</h3><p>Fines are calculated at ₹${db.fineRate} per overdue day.</p></div><span class="available">Collected &nbsp; ₹${collected}</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>BOOK & READER</th><th>DUE DATE</th><th>OVERDUE</th><th>FINE</th><th>PAYMENT</th></tr></thead><tbody>${rows.length?rows.map(l=>{const days=overdueDays(l),amount=days*db.fineRate;return `<tr><td><b>${esc(bookBy(l.bookId)?.title||"Book")}</b><span class="subtext">${esc(studentBy(l.studentId)?.name||"Reader")}</span></td><td>${fmtDate(l.due)}</td><td style="color:#c56b38">${days} days</td><td><b>₹${amount}</b></td><td>${db.payments[l.id]?`<span class="status paid">● &nbsp;Paid</span>`:`<button class="table-action" data-action="payFine" data-id="${esc(l.id)}">Mark paid</button>`}</td></tr>`}).join(""):`<tr><td colspan="5" class="empty-state">No overdue accounts. All clear!</td></tr>`}</tbody></table></div></section>${note()}`;
}
function settingsPage(){
 return `${pageHeader("PREFERENCES","Settings","Make this library desk work the way you do.")}
 <div class="settings-grid"><section class="panel settings-card"><h3>Fine policy</h3><p>Set the library’s daily overdue rate.</p><form id="fineForm"><label>Fine per overdue day<input id="fineRate" type="number" min="0" value="${db.fineRate}" required></label><p>Applied for each full day past the due date, including books returned late.</p><button class="primary-btn">Save preferences &nbsp; ✓</button></form></section><section class="panel settings-card"><h3>Demo library</h3><p>Restore the original practical-project records.</p><p>A fresh shelf &nbsp; <span class="tag">06 titles</span> &nbsp; <span class="tag">04 readers</span></p><p>This replaces your current books, students, and loan history with the sample set.</p><button class="secondary-btn" data-action="resetData">Restore sample records &nbsp; ←</button></section></div>${note()}`;
}
function filterTable(query){
 const q=query.toLowerCase(),category=document.getElementById("categoryFilter")?.value||document.getElementById("loanFilter")?.value||"";
 document.querySelectorAll("#tableRows tr, .data-table tbody tr").forEach(row=>{const match=(row.dataset.search||"").includes(q),cat=!category||(row.dataset.category||"")===category;row.style.display=match&&cat?"":"none";});
}
function field(label,name,value="",type="text",full=false,options=null){
 let control=options?`<select name="${name}" required>${options.map(o=>`<option value="${esc(o)}" ${o===value?"selected":""}>${esc(o)}</option>`).join("")}</select>`:`<input name="${name}" type="${type}" value="${esc(value)}" ${type==="number"?'min="0"':""} required>`;
 return `<label class="form-field ${full?"full":""}">${label}${control}</label>`;
}
function openModal(title,fields,onSave){
 modalConfig=onSave;document.getElementById("modalTitle").textContent=title;document.getElementById("modalFields").innerHTML=fields.join("");document.getElementById("modal").classList.remove("hidden");
}
function closeModal(){document.getElementById("modal").classList.add("hidden");modalConfig=null;}
function addBook(existing=null){
 const b=existing||{id:`BK-${Date.now().toString().slice(-5)}`,title:"",author:"",category:"Technology",year:new Date().getFullYear(),publisher:"",total:1};
 openModal(existing?"Edit book":"Add a new book",[field("Book ID","id",b.id),field("Title","title",b.title),field("Author","author",b.author),field("Category","category",b.category,"text"),field("Published year","year",b.year,"number"),field("Publisher","publisher",b.publisher),field("Total copies","total",b.total,"number")],v=>{v.total=Number(v.total);v.year=Number(v.year);if(existing)Object.assign(existing,v);else db.books.push(v);saveData();closeModal();showToast(existing?"Book updated":"Book added to collection");});
}
function addStudent(existing=null){
 const s=existing||{id:`ST-${Date.now().toString().slice(-6)}`,name:"",email:"",department:"Computer Science",semester:"Semester 3",contact:""};
 openModal(existing?"Edit student":"Add a student",[field("Student ID","id",s.id),field("Full name","name",s.name),field("Email address","email",s.email,"email"),field("Department","department",s.department),field("Semester","semester",s.semester,"text"),field("Contact number","contact",s.contact)],v=>{if(existing)Object.assign(existing,v);else db.students.push(v);saveData();closeModal();showToast(existing?"Student updated":"Student added");});
}
function issueBook(){
 const available=db.books.filter(b=>availableCopies(b)>0);
 if(!available.length||!db.students.length){showToast("Add an available book and a student first.");return;}
 const bookOptions=available.map(b=>`${b.id} — ${b.title}`);
 const studentOptions=db.students.map(s=>`${s.id} — ${s.name}`);
 openModal("Issue a book",[field("Select book","book",bookOptions[0],"text",true,bookOptions),field("Select reader","student",studentOptions[0],"text",true,studentOptions),field("Issue date","issued",todayISO(),"date"),field("Due date","due",new Date(Date.now()+14*86400000).toISOString().slice(0,10),"date")],v=>{const bookId=v.book.split(" — ")[0],studentId=v.student.split(" — ")[0];db.loans.unshift({id:`TX-${Date.now().toString().slice(-5)}`,bookId,studentId,issued:v.issued,due:v.due,returned:"",status:"On loan"});saveData();closeModal();showToast("Book issued successfully");});
}
function handleAction(action,id){
 if(action==="addBook")return addBook();
 if(action==="editBook")return addBook(bookBy(id));
 if(action==="addStudent")return addStudent();
 if(action==="editStudent")return addStudent(studentBy(id));
 if(action==="issue")return issueBook();
 if(action==="returnLoan"){const l=db.loans.find(x=>x.id===id);if(!l)return;l.status="Returned";l.returned=todayISO();saveData();showToast("Book marked as returned");}
 if(action==="payFine"){db.payments[id]=true;saveData();showToast("Fine marked as paid");}
 if(action==="deleteBook"){if(db.loans.some(l=>l.bookId===id&&l.status!=="Returned"))return showToast("Return this book before deleting it.");if(confirm("Delete this book record?")){db.books=db.books.filter(b=>b.id!==id);saveData();showToast("Book deleted");}}
 if(action==="deleteStudent"){if(db.loans.some(l=>l.studentId===id&&l.status!=="Returned"))return showToast("This reader has an active loan.");if(confirm("Delete this student record?")){db.students=db.students.filter(s=>s.id!==id);saveData();showToast("Student deleted");}}
 if(action==="resetData"){if(confirm("Restore sample records? Your current local records will be replaced.")){db=clone(DEFAULT_DATA);saveData();showToast("Sample records restored");}}
}
document.addEventListener("click",e=>{const action=e.target.closest("[data-action]");if(action)handleAction(action.dataset.action,action.dataset.id);if(e.target.dataset.close==="true")closeModal();});
document.getElementById("navigation").addEventListener("click",e=>{const b=e.target.closest("[data-page]");if(b)setPage(b.dataset.page);});
document.getElementById("modalClose").addEventListener("click",closeModal);
document.getElementById("modalCancel").addEventListener("click",closeModal);
document.getElementById("modalForm").addEventListener("submit",e=>{e.preventDefault();if(!modalConfig)return;const values=Object.fromEntries(new FormData(e.currentTarget).entries());modalConfig(values);});
document.getElementById("pageContent").addEventListener("submit",e=>{if(e.target.id==="fineForm"){e.preventDefault();db.fineRate=Math.max(0,Number(document.getElementById("fineRate").value));saveData();showToast("Fine policy saved");}});
document.getElementById("loginForm").addEventListener("submit",e=>{e.preventDefault();const email=document.getElementById("loginEmail").value,password=document.getElementById("loginPassword").value;if(email==="admin@library.edu"&&password==="library123"){document.getElementById("loginScreen").classList.add("hidden");document.getElementById("app").classList.remove("hidden");setPage("overview");}else showToast("Demo login: admin@library.edu / library123");});
document.getElementById("logoutBtn").addEventListener("click",()=>{document.getElementById("app").classList.add("hidden");document.getElementById("loginScreen").classList.remove("hidden");});
document.getElementById("loginForm").addEventListener("keydown",e=>{if(e.key==="Enter")e.preventDefault();});
