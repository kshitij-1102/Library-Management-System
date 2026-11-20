// Sample records for Shelfwise Library Desk.
// All records are stored in the browser using localStorage.
const DEFAULT_DATA = {
  fineRate: 5,
  books: [
    {id:"BK-101",title:"The Pragmatic Programmer",author:"David Thomas",category:"Technology",year:2019,publisher:"Addison-Wesley",total:6},
    {id:"BK-102",title:"Clean Code",author:"Robert C. Martin",category:"Technology",year:2008,publisher:"Prentice Hall",total:5},
    {id:"BK-103",title:"Atomic Habits",author:"James Clear",category:"Personal Growth",year:2018,publisher:"Avery",total:4},
    {id:"BK-104",title:"The Alchemist",author:"Paulo Coelho",category:"Fiction",year:1988,publisher:"HarperOne",total:5},
    {id:"BK-105",title:"Introduction to Algorithms",author:"Thomas H. Cormen",category:"Technology",year:2022,publisher:"MIT Press",total:3},
    {id:"BK-106",title:"Sapiens",author:"Yuval Noah Harari",category:"History",year:2015,publisher:"Harper",total:4}
  ],
  students: [
    {id:"ST-2024-01",name:"Aarav Sharma",email:"aarav.sharma@example.edu",department:"Computer Science",semester:"Semester 3",contact:"98765 43210"},
    {id:"ST-2024-02",name:"Meera Patel",email:"meera.patel@example.edu",department:"Information Technology",semester:"Semester 3",contact:"98765 43211"},
    {id:"ST-2024-03",name:"Kabir Singh",email:"kabir.singh@example.edu",department:"Electronics",semester:"Semester 5",contact:"98765 43212"},
    {id:"ST-2024-04",name:"Ananya Rao",email:"ananya.rao@example.edu",department:"Computer Science",semester:"Semester 1",contact:"98765 43213"}
  ],
  loans: [
    {id:"TX-2404",bookId:"BK-104",studentId:"ST-2024-04",issued:"2026-11-15",due:"2026-11-29",returned:"",status:"On loan"},
    {id:"TX-2401",bookId:"BK-102",studentId:"ST-2024-02",issued:"2026-11-12",due:"2026-11-26",returned:"",status:"On loan"},
    {id:"TX-2403",bookId:"BK-105",studentId:"ST-2024-03",issued:"2026-10-30",due:"2026-11-13",returned:"2026-11-15",status:"Returned"},
    {id:"TX-2402",bookId:"BK-101",studentId:"ST-2024-01",issued:"2026-10-24",due:"2026-11-07",returned:"",status:"Overdue"}
  ],
  payments: {"TX-2403":true}
};