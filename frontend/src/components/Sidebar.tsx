import { 
  Shield, Zap, Globe, History,
  Settings, ChevronRight, LayoutDashboard,
  Calendar, Activity
} from 'lucide-react';

interface SidebarProps {
  patient: any;
}

const Sidebar: React.FC<SidebarProps> = ({ patient }) => {
  return (
    <aside className="w-80 flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar">
      {/* Brand */}
      <div className="flex items-center gap-3 px-2">
        <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
          <Zap className="text-white w-6 h-6 fill-current" />
        </div>
        <div className="font-outfit">
          <h1 className="font-bold text-lg tracking-tight leading-none">2Care.ai</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Health Assistant</p>
        </div>
      </div>

      {/* Patient Profile Card */}
      <div className="glass-card p-6 flex flex-col gap-5 rounded-3xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-sm overflow-hidden">
             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${patient.name}`} alt="avatar" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">{patient.name}</h3>
            <p className="text-xs font-semibold text-slate-400">{patient.id}</p>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
             <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-bold text-slate-600">Language</span>
             </div>
             <div className="flex gap-1">
                {['EN', 'HI', 'TA'].map(l => (
                  <button 
                    key={l}
                    className={`text-[9px] px-2 py-1 rounded-lg font-bold border transition-all ${
                      patient.preferredLang.includes(l) 
                      ? 'bg-blue-500 border-blue-500 text-white' 
                      : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {l}
                  </button>
                ))}
             </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
             <div className="flex items-center gap-3">
                <History className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-slate-600">Last Interaction</span>
             </div>
             <span className="text-[10px] font-bold text-slate-500">{patient.lastVisit}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 grid gap-3">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">System Ready</span>
              </div>
              <Shield className="w-3 h-3 text-slate-300" />
           </div>
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Secure Line</span>
              </div>
              <Zap className="w-3 h-3 text-slate-300" />
           </div>
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Latency &lt; 450ms</span>
              </div>
               <Activity className="w-3 h-3 text-slate-300" />
           </div>
        </div>
      </div>

      {/* Nav Section */}
      <div className="flex flex-col gap-2">
        <h4 className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Navigation</h4>
        {[
          { icon: LayoutDashboard, label: 'Patient Overview', active: true },
          { icon: Calendar, label: 'Appointments' },
          { icon: History, label: 'Session Records' }
        ].map((item, i) => (
          <button 
            key={i}
            className={`flex items-center justify-between group px-4 py-3 rounded-2xl transition-all ${
              item.active ? 'bg-white shadow-sm border border-slate-100 text-primary' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon className={`w-5 h-5 ${item.active ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'}`} />
              <span className="text-sm font-bold">{item.label}</span>
            </div>
            {item.active && <ChevronRight className="w-4 h-4" />}
          </button>
        ))}
      </div>

      {/* Settings Footer */}
      <div className="mt-auto px-4 py-6 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <Settings className="w-4 h-4 text-slate-400" />
           </div>
           <span className="text-xs font-bold text-slate-500">Settings</span>
        </div>
        <div className="text-[10px] font-bold text-slate-300">v1.2.0</div>
      </div>
    </aside>
  );
};

export default Sidebar;
