export const growthData = [
  { month: "Jan", users: 1200, projects: 320, interactions: 4200 },
  { month: "Feb", users: 1850, projects: 480, interactions: 5800 },
  { month: "Mar", users: 2400, projects: 620, interactions: 7900 },
  { month: "Apr", users: 3100, projects: 810, interactions: 10200 },
  { month: "May", users: 4250, projects: 1050, interactions: 13800 },
  { month: "Jun", users: 5600, projects: 1380, interactions: 18400 },
  { month: "Jul", users: 7200, projects: 1720, interactions: 23900 },
  { month: "Aug", users: 9100, projects: 2140, interactions: 31200 },
];

export const engagementData = [
  { day: "Mon", likes: 1240, comments: 320, shares: 90 },
  { day: "Tue", likes: 1680, comments: 410, shares: 120 },
  { day: "Wed", likes: 1420, comments: 380, shares: 105 },
  { day: "Thu", likes: 1980, comments: 520, shares: 160 },
  { day: "Fri", likes: 2350, comments: 610, shares: 210 },
  { day: "Sat", likes: 1820, comments: 470, shares: 140 },
  { day: "Sun", likes: 1540, comments: 390, shares: 110 },
];

export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joined: string;
  status: "active" | "suspended" | "banned";
  verified: boolean;
  role: "user" | "admin" | "moderator";
  projects: number;
  badges: string[];
};

const names = ["Alex Morgan","Sofia Chen","Ethan Rivera","Maya Patel","Lucas Kim","Nina Becker","Theo Dubois","Aisha Khan","Jonas Weber","Mira Lopez","Oliver Tanaka","Zara Ali","Felix Larsen","Luna Costa","Ravi Singh","Emma Schmidt","Diego Ortiz","Yuki Tanaka","Noah Wright","Iris Volkov"];

export const users: User[] = names.map((name, i) => ({
  id: `usr_${1000 + i}`,
  name,
  email: name.toLowerCase().replace(" ", ".") + "@projectlink.io",
  avatar: `https://api.dicebear.com/7.x/glass/svg?seed=${encodeURIComponent(name)}`,
  joined: new Date(Date.now() - (i * 86400000 * 7)).toISOString().slice(0, 10),
  status: i % 13 === 0 ? "banned" : i % 7 === 0 ? "suspended" : "active",
  verified: i % 3 === 0,
  role: i === 0 ? "admin" : i % 9 === 0 ? "moderator" : "user",
  projects: Math.floor(Math.random() * 24) + 1,
  badges: i % 4 === 0 ? ["Pioneer", "Top Creator"] : i % 3 === 0 ? ["Early Bird"] : [],
}));

export type Project = {
  id: string;
  title: string;
  author: string;
  category: string;
  status: "published" | "draft" | "flagged";
  likes: number;
  comments: number;
  featured: boolean;
  verified: boolean;
  createdAt: string;
};

const projectTitles = [
  "Neural Mesh OS","Pulse Analytics","Orbit Chat","Quantum Notes","HyperFlow CMS",
  "DeepLens Vision","Echo DAW","Northstar CRM","Prism Studio","Helix Mail",
  "Vector Maps","Stellar Forms","Cypher Vault","Lumen Editor","Nimbus Cloud",
  "Glide Tasks","Atomic Wallet","Mosaic Canvas","Drift Coding","Spectra Music",
];

export const projects: Project[] = projectTitles.map((title, i) => ({
  id: `prj_${2000 + i}`,
  title,
  author: names[i % names.length],
  category: ["AI", "SaaS", "Design", "Developer", "Productivity"][i % 5],
  status: i % 11 === 0 ? "flagged" : i % 6 === 0 ? "draft" : "published",
  likes: Math.floor(Math.random() * 4800) + 120,
  comments: Math.floor(Math.random() * 320) + 5,
  featured: i % 5 === 0,
  verified: i % 3 === 0,
  createdAt: new Date(Date.now() - (i * 86400000 * 3)).toISOString().slice(0, 10),
}));

export const reports = [
  { id: "rpt_1", target: "Neural Mesh OS", type: "Project", reason: "Spam content", reporter: "Sofia Chen", date: "2026-04-28", severity: "medium" },
  { id: "rpt_2", target: "Ethan Rivera", type: "User", reason: "Harassment", reporter: "Maya Patel", date: "2026-04-29", severity: "high" },
  { id: "rpt_3", target: "Pulse Analytics", type: "Project", reason: "Misleading claims", reporter: "Lucas Kim", date: "2026-05-01", severity: "low" },
  { id: "rpt_4", target: "Orbit Chat", type: "Project", reason: "Copyright violation", reporter: "Nina Becker", date: "2026-05-02", severity: "high" },
  { id: "rpt_5", target: "Theo Dubois", type: "User", reason: "Fake account", reporter: "Aisha Khan", date: "2026-05-03", severity: "medium" },
];

export const comments = [
  { id: "c1", user: "Sofia Chen", project: "Neural Mesh OS", text: "Mind-blowing UX. How did you handle the latency?", date: "2h", flagged: false },
  { id: "c2", user: "Lucas Kim", project: "Pulse Analytics", text: "This is straight up a copy of another tool.", date: "5h", flagged: true },
  { id: "c3", user: "Maya Patel", project: "Orbit Chat", text: "Loving the dark mode. Native app when?", date: "8h", flagged: false },
  { id: "c4", user: "Ethan Rivera", project: "Quantum Notes", text: "Nope. Trash. Don't waste your time.", date: "12h", flagged: true },
  { id: "c5", user: "Nina Becker", project: "HyperFlow CMS", text: "Solid v1. Roadmap looks ambitious.", date: "1d", flagged: false },
];

export const conversations = [
  { id: "cv1", a: "Alex Morgan", b: "Sofia Chen", last: "Sent the design tokens 🎨", time: "3m", unread: 2 },
  { id: "cv2", a: "Maya Patel", b: "Lucas Kim", last: "Shipping tonight, finally.", time: "1h", unread: 0 },
  { id: "cv3", a: "Theo Dubois", b: "Aisha Khan", last: "Can you review the PR?", time: "4h", unread: 5 },
  { id: "cv4", a: "Jonas Weber", b: "Mira Lopez", last: "👀", time: "1d", unread: 0 },
];

export const activity = [
  { id: 1, who: "Sofia Chen", what: "published a project", target: "Neural Mesh OS", time: "2m" },
  { id: 2, who: "Lucas Kim", what: "reported a comment", target: "Pulse Analytics", time: "12m" },
  { id: 3, who: "Maya Patel", what: "joined Projectlink", target: "", time: "28m" },
  { id: 4, who: "Theo Dubois", what: "got verified", target: "", time: "1h" },
  { id: 5, who: "Nina Becker", what: "featured", target: "Orbit Chat", time: "2h" },
  { id: 6, who: "Ethan Rivera", what: "was suspended", target: "", time: "3h" },
];

export const adminTeam = [
  { name: "Alex Morgan", email: "alex@projectlink.io", role: "Super Admin", lastActive: "now" },
  { name: "Sofia Chen", email: "sofia@projectlink.io", role: "Moderator", lastActive: "12m" },
  { name: "Lucas Kim", email: "lucas@projectlink.io", role: "Analyst", lastActive: "1h" },
  { name: "Mira Lopez", email: "mira@projectlink.io", role: "Moderator", lastActive: "3h" },
];

export const trendingCategories = [
  { name: "AI Agents", value: 32 },
  { name: "DevTools", value: 24 },
  { name: "Design", value: 18 },
  { name: "Productivity", value: 14 },
  { name: "Music", value: 12 },
];
