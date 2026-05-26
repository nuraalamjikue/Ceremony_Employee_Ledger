import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Landmark,
  ArrowRight,
  DollarSign,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Search,
  X,
  User,
  Check,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { Employee, Entry } from "../types";

interface EntryFormProps {
  employees: Employee[];
  entries: Entry[];
  onEntrySaved: (updatedEntries: Entry[]) => void;
  onAddEmployeeClick: () => void;
}

export default function EntryForm({
  employees,
  entries,
  onEntrySaved,
  onAddEmployeeClick,
}: EntryFormProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [amount, setAmount] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [gift, setGift] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isEmployeeStatusModalOpen, setIsEmployeeStatusModalOpen] =
    useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close employee status modal on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setIsEmployeeStatusModalOpen(false);
      }
    }
    if (isEmployeeStatusModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isEmployeeStatusModalOpen]);

  // Sync selected employee's default address when selected
  useEffect(() => {
    if (selectedEmployee) {
      setAddress(selectedEmployee.address || "");
    } else {
      setAddress("");
    }
    setSuccessMsg(null);
    setErrorMsg(null);
  }, [selectedEmployee]);

  // Helper function to check if employee has an entry
  const hasEntry = (employeeName: string): boolean => {
    return entries.some(
      (entry) => entry.name.toLowerCase() === employeeName.toLowerCase(),
    );
  };

  // Filter employees matching the query
  const filteredEmployees = employees.filter((employee) =>
    employee.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) {
      setErrorMsg("Please search and select an employee first.");
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMsg("Please enter a valid amount greater than zero.");
      return;
    }

    const trimmedAddress = address.trim();
    if (!trimmedAddress) {
      setErrorMsg("Please enter a valid location/address context.");
      return;
    }

    // Check for duplicate entries for the same employee
    const hasDuplicateEntry = entries.some(
      (entry) =>
        entry.name.toLowerCase() === selectedEmployee.name.toLowerCase(),
    );

    if (hasDuplicateEntry) {
      setErrorMsg(
        `An entry for "${selectedEmployee.name}" has already been recorded. You cannot add duplicate entries.`,
      );
      return;
    }

    const newEntry: Entry = {
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 9),
      name: selectedEmployee.name,
      amount: numericAmount,
      address: trimmedAddress,
      date: new Date().toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      gift: gift.trim() || undefined, // Optional gift field
    };

    try {
      // Send to API
      fetch("http://localhost:3001/api/entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newEntry),
      })
        .then((response) => response.json())
        .then((data) => {
          onEntrySaved(data);

          // Reset entry state
          setAmount("");
          setAddress("");
          setGift("");
          setSelectedEmployee(null);
          setSearchQuery("");
          setErrorMsg(null);
          setSuccessMsg(
            `Entry of $${numericAmount} for "${newEntry.name}" successfully saved!`,
          );

          // Clear success notification after 4 seconds
          setTimeout(() => {
            setSuccessMsg(null);
          }, 4000);
        })
        .catch((error) => {
          console.error("Error saving entry:", error);
          setErrorMsg("Failed to save entry to database.");
        });
    } catch (e) {
      console.error("Error saving entry:", e);
      setErrorMsg("Failed to save entry to database.");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all duration-200 h-full flex flex-col justify-between">
      <div>
        {/* Header bar and indicators */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-sm bg-indigo-50 text-indigo-650 shadow-sm shrink-0">
              <Landmark size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-slate-900 tracking-tight leading-none">
                Record Entry
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Log a ceramic ceremony event
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEmployeeStatusModalOpen(true)}
              className="text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200/40 rounded-lg px-2.5 py-1.5 select-none leading-none hover:bg-slate-200 hover:text-slate-700 transition-all cursor-pointer"
            >
              {employees.length} Staff
            </button>
          </div>
        </div>

        {/* Integrated Form Panel */}
        <div className="space-y-4">
          {/* STEP 1: Search and Selection Input */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-[10px] font-extrabold text-slate-400 mb-1.5 uppercase tracking-widest font-display">
              1. Search & Select Employee
            </label>

            {!selectedEmployee ? (
              <div className="relative">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  size={15}
                />
                <input
                  type="text"
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 focus:bg-white transition-all font-sans"
                  placeholder="Who are you recording for?"
                  value={searchQuery}
                  onFocus={() => setIsDropdownOpen(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 text-slate-500 cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            ) : (
              <div className="p-3 bg-indigo-50/55 border border-indigo-100/60 rounded-sm flex items-center justify-between transition-all">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0 shadow-xs">
                    <User size={15} />
                  </div>
                  <div>
                    <p className="text-[9px] text-indigo-700 font-extrabold uppercase tracking-widest font-display">
                      Selected Officer
                    </p>
                    <p className="text-xs text-slate-900 font-bold">
                      {selectedEmployee.name}
                    </p>
                    <p className="text-[11px] text-slate-500 leading-normal mt-0.5 font-sans font-medium">
                      Base: {selectedEmployee.address}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedEmployee(null);
                    setSearchQuery("");
                  }}
                  className="text-[11px] text-rose-700 bg-rose-50 hover:bg-rose-105 hover:bg-rose-100 active:bg-rose-200 px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer border border-rose-100"
                >
                  Change
                </button>
              </div>
            )}

            {/* Float Dropdown List when active and typing */}
            {isDropdownOpen && !selectedEmployee && (
              <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200/95 rounded-sm shadow-xl max-h-[220px] overflow-y-auto overflow-x-hidden custom-scrollbar divide-y divide-slate-50">
                {employees.length === 0 ? (
                  <div className="py-6 px-4 text-center text-xs text-slate-500">
                    <p className="mb-2 font-semibold">
                      No employees registered yet.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onAddEmployeeClick();
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
                    >
                      <UserPlus size={12} />
                      <span>Register First Employee</span>
                    </button>
                  </div>
                ) : !searchQuery.trim() ? (
                  <div className="py-4 px-4 text-center text-xs text-slate-400 font-medium">
                    <p className="mb-2 text-slate-500 text-[11px]">
                      Type above to look up employees
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onAddEmployeeClick();
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-slate-700 font-bold rounded-lg text-[11px] transition-all cursor-pointer"
                    >
                      <span>+ Create New Employee</span>
                    </button>
                  </div>
                ) : filteredEmployees.length === 0 ? (
                  <div className="py-6 px-4 text-center text-xs text-slate-500 font-medium">
                    <p className="mb-2 text-slate-500">
                      No matches for &ldquo;{searchQuery}&rdquo;
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onAddEmployeeClick();
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
                    >
                      <UserPlus size={12} />
                      <span>Register &ldquo;{searchQuery}&rdquo;</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-1.5 space-y-0.5">
                    {filteredEmployees.map((emp) => (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => {
                          setSelectedEmployee(emp);
                          setIsDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-between text-left px-2.5 py-2 hover:bg-slate-50 active:bg-slate-100 rounded-lg text-xs transition-all"
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-950 text-xs">
                            {emp.name}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5 font-sans">
                            {emp.address}
                          </span>
                        </div>
                        <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 font-bold rounded-md self-center">
                          Select
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* STEP 2: Amounts and customized address info */}
            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 mb-1.5 uppercase tracking-widest font-display">
                2. Transaction Details
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Input for Amount */}
                <div className="space-y-1">
                  <label
                    htmlFor="amount"
                    className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider"
                  >
                    Amount ($)
                  </label>
                  <div className="relative">
                    <DollarSign
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={14}
                    />
                    <input
                      id="amount"
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      disabled={!selectedEmployee}
                      className="w-full pl-7 pr-3 py-2 bg-slate-50/70 border border-slate-200 rounded-sm text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all font-sans font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder={
                        selectedEmployee ? "0.00" : "Choose employee..."
                      }
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        if (errorMsg) setErrorMsg(null);
                      }}
                    />
                  </div>
                </div>

                {/* Input for Address */}
                <div className="space-y-1">
                  <label
                    htmlFor="address"
                    className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider"
                  >
                    Location Context
                  </label>
                  <div className="relative">
                    <MapPin
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={14}
                    />
                    <input
                      id="address"
                      type="text"
                      required
                      disabled={!selectedEmployee}
                      className="w-full pl-7 pr-3 py-2 bg-slate-50/70 border border-slate-200 rounded-sm text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all font-sans disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder={
                        selectedEmployee
                          ? "Where was it?"
                          : "Choose employee..."
                      }
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        if (errorMsg) setErrorMsg(null);
                      }}
                    />
                  </div>
                </div>

                {/* Input for Gift (Optional) */}
                <div className="space-y-1">
                  <label
                    htmlFor="gift"
                    className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider"
                  >
                    Gift{" "}
                    <span className="text-slate-400 text-[9px]">
                      (Optional)
                    </span>
                  </label>
                  <input
                    id="gift"
                    type="text"
                    disabled={!selectedEmployee}
                    className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-sm text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-sans disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder={
                      selectedEmployee
                        ? "e.g. Watch, Gift Card..."
                        : "Choose employee..."
                    }
                    value={gift}
                    onChange={(e) => {
                      setGift(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={!selectedEmployee}
              className={`w-full flex items-center justify-center gap-2 px-3.5 py-2 font-bold text-xs uppercase tracking-wider rounded-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer ${
                selectedEmployee
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none"
              }`}
            >
              <span>Record Ceremony Entry</span>
              <ArrowRight size={14} />
            </button>
          </form>
        </div>
      </div>

      {/* Dynamic Alerts container */}
      <div className="mt-4">
        <AnimatePresence mode="wait">
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-3 rounded-sm bg-emerald-50 border border-emerald-200/60 flex items-start gap-2.5 text-xs text-emerald-900"
            >
              <CheckCircle2
                size={15}
                className="text-emerald-600 shrink-0 mt-0.5"
              />
              <span className="font-semibold leading-normal">{successMsg}</span>
            </motion.div>
          )}

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-3 rounded-sm bg-rose-50 border border-rose-200/60 flex items-start gap-2.5 text-xs text-rose-900"
            >
              <AlertTriangle
                size={15}
                className="text-rose-600 shrink-0 mt-0.5"
              />
              <span className="font-semibold leading-normal">{errorMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Employee Status Modal */}
      <AnimatePresence>
        {isEmployeeStatusModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xl max-w-md w-full max-h-[70vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">
                  Employee Status
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEmployeeStatusModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 transition-all"
                >
                  <X size={18} className="text-slate-500" />
                </button>
              </div>

              <div className="space-y-2">
                {employees.length === 0 ? (
                  <p className="text-center text-xs text-slate-500 py-8">
                    No employees registered yet
                  </p>
                ) : (
                  employees.map((emp) => {
                    const hasEntryStatus = hasEntry(emp.name);
                    return (
                      <div
                        key={emp.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-slate-200/60 hover:bg-slate-50 transition-all"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className={`p-2 rounded-lg ${
                              hasEntryStatus ? "bg-emerald-100" : "bg-slate-100"
                            }`}
                          >
                            <User
                              size={14}
                              className={
                                hasEntryStatus
                                  ? "text-emerald-700"
                                  : "text-slate-500"
                              }
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-slate-900">
                              {emp.name}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {emp.address}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {hasEntryStatus ? (
                            <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200/60 rounded-lg">
                              <Check
                                size={12}
                                className="text-emerald-700 font-bold"
                              />
                              <span className="text-[10px] font-bold text-emerald-700">
                                Recorded
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200/60 rounded-lg">
                              <span className="text-[10px] font-bold text-slate-500">
                                Pending
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200/40">
                    <p className="font-bold text-emerald-900">
                      {employees.filter((e) => hasEntry(e.name)).length}
                    </p>
                    <p className="text-emerald-700 text-[10px]">Recorded</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/40">
                    <p className="font-bold text-slate-900">
                      {employees.filter((e) => !hasEntry(e.name)).length}
                    </p>
                    <p className="text-slate-500 text-[10px]">Pending</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
