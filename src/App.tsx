/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users2, Landmark, Wallet, ClipboardList, Info } from "lucide-react";
import EmployeeForm from "./components/EmployeeForm";
import EntryForm from "./components/EntryForm";
import EntryList from "./components/EntryList";
import { Employee, Entry } from "./types";

export default function App() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);

  // Load from API on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/data");
        const data = await response.json();
        setEmployees(data.employees || []);
        setEntries(data.entries || []);
      } catch (error) {
        console.error("Error loading data from server:", error);
        // Fallback to localStorage if server is not available
        try {
          const savedEmployees = localStorage.getItem("employees_list");
          if (savedEmployees) {
            setEmployees(JSON.parse(savedEmployees));
          }
          const savedEntries = localStorage.getItem("ceremony_entries");
          if (savedEntries) {
            setEntries(JSON.parse(savedEntries));
          }
        } catch (e) {
          console.error("Error reading localStorage:", e);
        }
      }
    };
    fetchData();
  }, []);

  // Update employee state
  const handleEmployeeAdded = (updated: Employee[]) => {
    setEmployees(updated);
  };

  // Update entries state
  const handleEntriesChanged = (updated: Entry[]) => {
    setEntries(updated);
  };

  // Stat calculations
  const totalEmployeesCount = employees.length;
  const totalEntriesCount = entries.length;
  const totalValue = entries.reduce((acc, entry) => acc + entry.amount, 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 pb-10 font-sans antialiased">
      {/* Grand Premium Header Area */}
      <div className="relative bg-gradient-to-b from-[#1E1B4B] via-[#12103E] to-[#0B0A26] text-white pt-10 pb-20 px-4 sm:px-6 lg:px-8 border-b border-indigo-950/80 overflow-hidden">
        {/* Subtle decorative mesh or radial glowing orbs */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-[350px] h-[350px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full relative z-10 flex flex-col items-center justify-center gap-6">
          <div className="space-y-3 max-w-3xl text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-display tracking-tight text-white leading-none">
              Ceremony{" "}
              <span className="text-emerald-400 bg-clip-text">Employee</span>{" "}
              Ledger
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl font-light leading-relaxed mx-auto">
              Register active service employees, archive exact payment levels
              alongside locations in local container stores, and export complete
              audits onto standardized spreadsheets.
            </p>
          </div>
        </div>
      </div>

      {/* Main Body Layout Container */}
      <div className="w-full px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        {/* Real-time stats row - hidden on small screens, smaller padding on large */}
        <div className="hidden md:grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-sm border border-slate-200/65 shadow-sm hover:shadow-md flex items-center justify-between transition-all duration-200">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Registered Staff
              </p>
              <h3 className="text-2xl font-black font-display text-slate-900 mt-0.5">
                {totalEmployeesCount}
              </h3>
            </div>
            <div className="p-2.5 bg-slate-50 text-slate-800 border border-slate-100 rounded-sm">
              <Users2 size={20} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-sm border border-slate-200/65 shadow-sm hover:shadow-md flex items-center justify-between transition-all duration-200">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Recorded Ceremonies
              </p>
              <h3 className="text-2xl font-black font-display text-slate-900 mt-0.5">
                {totalEntriesCount}
              </h3>
            </div>
            <div className="p-2.5 bg-blue-50 text-blue-700 border border-blue-100/50 rounded-sm">
              <Landmark size={20} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-sm border border-emerald-500/20 shadow-sm hover:shadow-md flex items-center justify-between transition-all duration-200 bg-linear-to-br from-white to-emerald-50/10">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700/80">
                Log Total Volume
              </p>
              <h3 className="text-2xl font-black font-display text-emerald-600 mt-0.5">
                $
                {totalValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h3>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-sm">
              <Wallet size={20} />
            </div>
          </div>
        </div>

        {/* Main Side-by-Side Grid Layout (5:7 ratio on desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mb-6">
          {/* Ceremony entry input form (5 Columns) */}
          <div className="lg:col-span-5">
            <EntryForm
              employees={employees}
              entries={entries}
              onEntrySaved={handleEntriesChanged}
              onAddEmployeeClick={() => setIsAddEmployeeOpen(true)}
            />
          </div>

          {/* Transactions list Table component (7 Columns) */}
          <div className="lg:col-span-7 w-full overflow-hidden">
            <EntryList
              entries={entries}
              onEntriesChanged={handleEntriesChanged}
            />
          </div>
        </div>

        {/* Add Employee Modal Overlay popup */}
        <AnimatePresence>
          {isAddEmployeeOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop blur shader (require close button to dismiss) */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
              />

              {/* Modal Dialog container body */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="relative z-10 w-full max-w-md shadow-2xl"
              >
                <EmployeeForm
                  employees={employees}
                  onEmployeeAdded={handleEmployeeAdded}
                  onClose={() => setIsAddEmployeeOpen(false)}
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
