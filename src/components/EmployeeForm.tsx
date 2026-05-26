import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserPlus, CheckCircle, AlertCircle, MapPin, X } from "lucide-react";
import { Employee } from "../types";

interface EmployeeFormProps {
  employees: Employee[];
  onEmployeeAdded: (updatedList: Employee[]) => void;
  onClose?: () => void;
}

export default function EmployeeForm({
  employees,
  onEmployeeAdded,
  onClose,
}: EmployeeFormProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedAddress = address.trim();

    if (!trimmedName) {
      setFeedback({
        type: "error",
        message: "Please enter a valid employee name.",
      });
      return;
    }

    if (!trimmedAddress) {
      setFeedback({
        type: "error",
        message: "Please enter a valid address or location context.",
      });
      return;
    }

    // Check duplicate (case insensitive)
    const isDuplicate = employees.some(
      (emp) => emp.name.toLowerCase() === trimmedName.toLowerCase(),
    );

    if (isDuplicate) {
      setFeedback({
        type: "error",
        message: `"${trimmedName}" is already registered.`,
      });
      return;
    }

    const newEmployee: Employee = {
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 9),
      name: trimmedName,
      address: trimmedAddress,
      createdAt: new Date().toISOString(),
    };

    const updated = [...employees, newEmployee];

    // Send to API
    try {
      fetch("http://localhost:3001/api/employees", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updated),
      })
        .then((response) => {
          if (!response.ok) {
            return response.json().then((error) => {
              throw new Error(error.error || "Failed to save employee");
            });
          }
          return response.json();
        })
        .then((data) => {
          onEmployeeAdded(data);
          setName("");
          setAddress("");
          setFeedback({
            type: "success",
            message: `Employee "${trimmedName}" successfully added!`,
          });

          // Clear success message after 3 seconds, but DO NOT auto-close modal
          setTimeout(() => {
            setFeedback((prev) => (prev?.type === "success" ? null : prev));
          }, 3000);
        })
        .catch((error) => {
          console.error("Error saving employee:", error);
          setFeedback({
            type: "error",
            message: error.message || "Failed to save employee to database.",
          });
        });
    } catch (error) {
      console.error("Error saving employee:", error);
      setFeedback({ type: "error", message: "Failed to write to database." });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-2xl relative overflow-hidden transition-all max-w-sm w-full">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-650 shadow-sm shrink-0">
            <UserPlus size={18} />
          </div>
          <div>
            <h2 className="text-lg font-bold font-display text-slate-900 tracking-tight leading-none">
              Add Employee
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Register a new staff member
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label
            htmlFor="employee-name"
            className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-display"
          >
            Employee Full Name
          </label>
          <input
            id="employee-name"
            type="text"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all font-sans animate-none"
            placeholder="e.g. Jane Doe"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (feedback) setFeedback(null);
            }}
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="employee-address"
            className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-display"
          >
            Address / Location Context
          </label>
          <div className="relative">
            <MapPin
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
            <input
              id="employee-address"
              type="text"
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all font-sans"
              placeholder="e.g. New York Office, Room 402"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                if (feedback) setFeedback(null);
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] mt-2"
        >
          <UserPlus size={15} />
          <span>Add Employee</span>
        </button>
      </form>

      {/* Dynamic inline notification feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`mt-4 p-4 rounded-xl flex items-start gap-3 text-sm ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-900 border border-emerald-100"
                : "bg-rose-50 text-rose-900 border border-rose-100"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle
                size={18}
                className="text-emerald-500 shrink-0 mt-0.5"
              />
            ) : (
              <AlertCircle
                size={18}
                className="text-rose-500 shrink-0 mt-0.5"
              />
            )}
            <span className="font-bold leading-normal">{feedback.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
