import { useState } from "react"
import { Card, CardContent } from "../components/ui/Card"
import {
  Users,
  DollarSign,
  CalendarCheck,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Mail,
  CheckSquare,
  FileText,
  Calendar,
  Clock,
  ChevronRight,
  ChevronDown,
  UserPlus,
  MessageSquare,
  CheckCircle2,
  Receipt,
} from "lucide-react"

export function Dashboard() {
  const [selectedTerm, setSelectedTerm] = useState("Term 2")

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-primary-900 tracking-tight leading-tight flex items-center gap-2">
            Good morning, Dennis 👋
          </h1>
          <p className="mt-1 text-sm text-primary-500">
            Here's what's happening at Greenfield Academy today.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg border border-primary-100 bg-white px-3.5 py-2 text-sm font-semibold text-primary-700 shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:border-primary-200/80 hover:bg-primary-50 transition-all">
            <Calendar size={16} className="text-primary-400 shrink-0" />
            <span>May 20, 2026</span>
            <ChevronDown size={14} className="text-primary-400 shrink-0" />
          </button>
        </div>
      </div>

      {/* Main Stats Row 1: 4 Cards with Sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Stat 1: Students Present */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="rounded-full bg-success-50 p-2.5 text-success-500">
                <Users size={20} />
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-bold text-success-700">
                <TrendingUp size={12} />
                <span>94.8%</span>
              </div>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-primary-900 tracking-tight">327</p>
                <p className="text-xs text-primary-400 font-medium mt-0.5">of 345 enrolled</p>
              </div>
              <div className="w-20 h-10">
                <svg className="w-full h-full" viewBox="0 0 100 40" fill="none">
                  <path
                    d="M0,35 Q15,30 30,28 T60,18 T90,8 L100,5"
                    stroke="#10B981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M0,35 Q15,30 30,28 T60,18 T90,8 L100,5 L100,40 L0,40 Z"
                    fill="url(#green-glow)"
                    opacity="0.1"
                  />
                  <defs>
                    <linearGradient id="green-glow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
            <p className="text-xs text-primary-500 mt-2 font-medium">Students Present</p>
          </CardContent>
        </Card>

        {/* Stat 2: Absent Students */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="rounded-full bg-danger-50 p-2.5 text-danger-500">
                <Users size={20} />
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-danger-50 px-2.5 py-0.5 text-xs font-bold text-danger-700">
                <TrendingDown size={12} />
                <span>5.2%</span>
              </div>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-primary-900 tracking-tight">18</p>
                <p className="text-xs text-primary-400 font-medium mt-0.5">of 345 enrolled</p>
              </div>
              <div className="w-20 h-10">
                <svg className="w-full h-full" viewBox="0 0 100 40" fill="none">
                  <path
                    d="M0,8 Q20,12 40,22 T80,32 L100,35"
                    stroke="#EF4444"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M0,8 Q20,12 40,22 T80,32 L100,35 L100,40 L0,40 Z"
                    fill="url(#red-glow)"
                    opacity="0.1"
                  />
                  <defs>
                    <linearGradient id="red-glow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EF4444" />
                      <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
            <p className="text-xs text-primary-500 mt-2 font-medium">Absent Students</p>
          </CardContent>
        </Card>

        {/* Stat 3: Revenue Today */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="rounded-full bg-success-50 p-2.5 text-success-500">
                <DollarSign size={20} />
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-bold text-success-700">
                <TrendingUp size={12} />
                <span>12%</span>
              </div>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-primary-900 tracking-tight">KES 185k</p>
                <p className="text-xs text-primary-400 font-medium mt-0.5">12% vs yesterday</p>
              </div>
              <div className="w-20 h-10">
                <svg className="w-full h-full" viewBox="0 0 100 40" fill="none">
                  <path
                    d="M0,38 Q25,32 50,22 T85,10 L100,2"
                    stroke="#10B981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
            <p className="text-xs text-primary-500 mt-2 font-medium">Revenue Today</p>
          </CardContent>
        </Card>

        {/* Stat 4: Outstanding Fees */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="rounded-full bg-warning-50 p-2.5 text-warning-500">
                <DollarSign size={20} />
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-warning-50 px-2.5 py-0.5 text-xs font-bold text-warning-700">
                <TrendingUp size={12} />
                <span>4%</span>
              </div>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-primary-900 tracking-tight">KES 2.45M</p>
                <p className="text-xs text-primary-400 font-medium mt-0.5">10% vs last week</p>
              </div>
              <div className="w-20 h-10">
                <svg className="w-full h-full" viewBox="0 0 100 40" fill="none">
                  <path
                    d="M0,15 Q30,12 60,18 T90,25 L100,28"
                    stroke="#F59E0B"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
            <p className="text-xs text-primary-500 mt-2 font-medium">Outstanding Fees</p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2 Indicators (Actionable items) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Indicator 1 */}
        <Card className="cursor-pointer">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-primary-900 leading-tight">14</p>
              <p className="text-xs text-primary-500 font-medium mt-0.5">Fee Collections Today</p>
            </div>
            <div className="rounded-lg bg-success-50 p-2.5 text-success-500 shrink-0">
              <Receipt size={20} />
            </div>
          </CardContent>
        </Card>

        {/* Indicator 2 */}
        <Card className="cursor-pointer">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-primary-900 leading-tight">2</p>
              <p className="text-xs text-primary-500 font-medium mt-0.5">Pending Approvals</p>
            </div>
            <div className="rounded-lg bg-warning-50 p-2.5 text-warning-500 shrink-0">
              <CheckSquare size={20} />
            </div>
          </CardContent>
        </Card>

        {/* Indicator 3 */}
        <Card className="cursor-pointer">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-primary-900 leading-tight">7</p>
              <p className="text-xs text-primary-500 font-medium mt-0.5">Unread Messages</p>
            </div>
            <div className="rounded-lg bg-info-50 p-2.5 text-info-500 shrink-0">
              <Mail size={20} />
            </div>
          </CardContent>
        </Card>

        {/* Indicator 4 */}
        <Card className="cursor-pointer">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-primary-900 leading-tight">3</p>
              <p className="text-xs text-primary-500 font-medium mt-0.5">Exams This Week</p>
            </div>
            <div className="rounded-lg bg-accent-50 p-2.5 text-accent-500 shrink-0">
              <BookOpen size={20} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Layout Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side (2/3 width column) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Row of 3 Cards side-by-side */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* 1. Recent Activity Card */}
            <Card className="flex flex-col h-[340px]">
              <div className="px-4.5 py-3 border-b border-primary-50 flex items-center justify-between shrink-0">
                <h3 className="font-semibold text-primary-900 text-xs">Recent Activity</h3>
                <button className="text-[10px] font-semibold text-accent-600 hover:text-accent-700 inline-flex items-center">
                  View all <ChevronRight size={12} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto flex-1">
                <div className="relative pl-5 space-y-4 before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-[2px] before:bg-primary-50">
                  {/* Item 1 */}
                  <div className="relative">
                    <div className="absolute -left-[19px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-success-500" />
                    <div>
                      <p className="text-xs font-semibold text-primary-900 leading-tight">Payment received from James Karanja</p>
                      <p className="text-[10px] text-primary-400 mt-0.5">KES 25,000</p>
                      <span className="text-[9px] text-primary-400 block mt-1">12 mins ago</span>
                    </div>
                  </div>
                  {/* Item 2 */}
                  <div className="relative">
                    <div className="absolute -left-[19px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-accent" />
                    <div>
                      <p className="text-xs font-semibold text-primary-900 leading-tight">New student admission completed</p>
                      <p className="text-[10px] text-primary-400 mt-0.5">Mary Wanjiku - Grade 8</p>
                      <span className="text-[9px] text-primary-400 block mt-1">45 mins ago</span>
                    </div>
                  </div>
                  {/* Item 3 */}
                  <div className="relative">
                    <div className="absolute -left-[19px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-info-500" />
                    <div>
                      <p className="text-xs font-semibold text-primary-900 leading-tight">Attendance marked for Grade 10A</p>
                      <p className="text-[10px] text-primary-400 mt-0.5">97% present</p>
                      <span className="text-[9px] text-primary-400 block mt-1">1 hour ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* 2. Outstanding Fees by Class */}
            <Card className="flex flex-col h-[340px]">
              <div className="px-4.5 py-3 border-b border-primary-50 flex items-center justify-between shrink-0">
                <h3 className="font-semibold text-primary-900 text-xs">Outstanding Fees by Class</h3>
                <span className="text-[9px] font-semibold text-primary-400 bg-primary-50 px-1.5 py-0.5 rounded uppercase">
                  This Term
                </span>
              </div>
              <div className="p-4 space-y-3.5 flex-1 overflow-y-auto">
                {/* Class Row */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold">
                    <span className="text-primary-600">Grade 8</span>
                    <span className="text-primary-900">KES 620,000</span>
                  </div>
                  <div className="h-1.5 w-full bg-primary-50 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-800 rounded-full" style={{ width: "85%" }} />
                  </div>
                </div>
                {/* Class Row */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold">
                    <span className="text-primary-600">Grade 9</span>
                    <span className="text-primary-900">KES 540,000</span>
                  </div>
                  <div className="h-1.5 w-full bg-primary-50 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-800 rounded-full" style={{ width: "70%" }} />
                  </div>
                </div>
                {/* Class Row */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold">
                    <span className="text-primary-600">Grade 10</span>
                    <span className="text-primary-900">KES 720,000</span>
                  </div>
                  <div className="h-1.5 w-full bg-primary-50 rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: "95%" }} />
                  </div>
                </div>
                {/* Class Row */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold">
                    <span className="text-primary-600">Grade 11</span>
                    <span className="text-primary-900">KES 350,000</span>
                  </div>
                  <div className="h-1.5 w-full bg-primary-50 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-800 rounded-full" style={{ width: "45%" }} />
                  </div>
                </div>
                {/* Class Row */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold">
                    <span className="text-primary-600">Grade 12</span>
                    <span className="text-primary-900">KES 220,000</span>
                  </div>
                  <div className="h-1.5 w-full bg-primary-50 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-800 rounded-full" style={{ width: "30%" }} />
                  </div>
                </div>
              </div>
              <div className="px-4 py-2.5 border-t border-primary-50 shrink-0 text-center bg-primary-50/20">
                <button className="text-[11px] font-bold text-accent hover:underline flex items-center justify-center gap-0.5 mx-auto">
                  View full report <ChevronRight size={12} />
                </button>
              </div>
            </Card>

            {/* 3. Quick Actions */}
            <Card className="flex flex-col h-[340px]">
              <div className="px-4.5 py-3 border-b border-primary-50 shrink-0">
                <h3 className="font-semibold text-primary-900 text-xs">Quick Actions</h3>
              </div>
              <div className="p-3 grid grid-cols-3 gap-1.5 flex-1 overflow-y-auto">
                <button className="flex flex-col items-center justify-center p-2 rounded-lg border border-primary-50/60 bg-white hover:border-accent hover:shadow-[0_2px_8px_rgba(232,157,71,0.08)] transition-all group text-center shadow-[0_1px_2px_rgba(15,23,42,0.01)]">
                  <div className="rounded-full bg-primary-50 p-2 text-primary-600 group-hover:bg-accent-50 group-hover:text-accent transition-colors shrink-0">
                    <UserPlus size={14} />
                  </div>
                  <span className="text-[10px] font-bold text-primary-700 mt-1.5 leading-tight">Add Student</span>
                </button>

                <button className="flex flex-col items-center justify-center p-2 rounded-lg border border-primary-50/60 bg-white hover:border-accent hover:shadow-[0_2px_8px_rgba(232,157,71,0.08)] transition-all group text-center shadow-[0_1px_2px_rgba(15,23,42,0.01)]">
                  <div className="rounded-full bg-primary-50 p-2 text-primary-600 group-hover:bg-accent-50 group-hover:text-accent transition-colors shrink-0">
                    <DollarSign size={14} />
                  </div>
                  <span className="text-[10px] font-bold text-primary-700 mt-1.5 leading-tight">Record Payment</span>
                </button>

                <button className="flex flex-col items-center justify-center p-2 rounded-lg border border-primary-50/60 bg-white hover:border-accent hover:shadow-[0_2px_8px_rgba(232,157,71,0.08)] transition-all group text-center shadow-[0_1px_2px_rgba(15,23,42,0.01)]">
                  <div className="rounded-full bg-primary-50 p-2 text-primary-600 group-hover:bg-accent-50 group-hover:text-accent transition-colors shrink-0">
                    <CalendarCheck size={14} />
                  </div>
                  <span className="text-[10px] font-bold text-primary-700 mt-1.5 leading-tight">Attendance</span>
                </button>

                <button className="flex flex-col items-center justify-center p-2 rounded-lg border border-primary-50/60 bg-white hover:border-accent hover:shadow-[0_2px_8px_rgba(232,157,71,0.08)] transition-all group text-center shadow-[0_1px_2px_rgba(15,23,42,0.01)]">
                  <div className="rounded-full bg-primary-50 p-2 text-primary-600 group-hover:bg-accent-50 group-hover:text-accent transition-colors shrink-0">
                    <Mail size={14} />
                  </div>
                  <span className="text-[10px] font-bold text-primary-700 mt-1.5 leading-tight">Send Message</span>
                </button>

                <button className="flex flex-col items-center justify-center p-2 rounded-lg border border-primary-50/60 bg-white hover:border-accent hover:shadow-[0_2px_8px_rgba(232,157,71,0.08)] transition-all group text-center shadow-[0_1px_2px_rgba(15,23,42,0.01)]">
                  <div className="rounded-full bg-primary-50 p-2 text-primary-600 group-hover:bg-accent-50 group-hover:text-accent transition-colors shrink-0">
                    <FileText size={14} />
                  </div>
                  <span className="text-[10px] font-bold text-primary-700 mt-1.5 leading-tight">Gen. Report</span>
                </button>

                <button className="flex flex-col items-center justify-center p-2 rounded-lg border border-primary-50/60 bg-white hover:border-accent hover:shadow-[0_2px_8px_rgba(232,157,71,0.08)] transition-all group text-center shadow-[0_1px_2px_rgba(15,23,42,0.01)]">
                  <div className="rounded-full bg-primary-50 p-2 text-primary-600 group-hover:bg-accent-50 group-hover:text-accent transition-colors shrink-0">
                    <Calendar size={14} />
                  </div>
                  <span className="text-[10px] font-bold text-primary-700 mt-1.5 leading-tight">View Timetable</span>
                </button>

                <button className="flex flex-col items-center justify-center p-2 rounded-lg border border-primary-50/60 bg-white hover:border-accent hover:shadow-[0_2px_8px_rgba(232,157,71,0.08)] transition-all group text-center shadow-[0_1px_2px_rgba(15,23,42,0.01)]">
                  <div className="rounded-full bg-primary-50 p-2 text-primary-600 group-hover:bg-accent-50 group-hover:text-accent transition-colors shrink-0">
                    <Receipt size={14} />
                  </div>
                  <span className="text-[10px] font-bold text-primary-700 mt-1.5 leading-tight">Create Invoice</span>
                </button>

                <button className="flex flex-col items-center justify-center p-2 rounded-lg border border-primary-50/60 bg-white hover:border-accent hover:shadow-[0_2px_8px_rgba(232,157,71,0.08)] transition-all group text-center shadow-[0_1px_2px_rgba(15,23,42,0.01)]">
                  <div className="rounded-full bg-primary-50 p-2 text-primary-600 group-hover:bg-accent-50 group-hover:text-accent transition-colors shrink-0">
                    <Users size={14} />
                  </div>
                  <span className="text-[10px] font-bold text-primary-700 mt-1.5 leading-tight">Add Staff</span>
                </button>

                <button className="flex flex-col items-center justify-center p-2 rounded-lg border border-primary-50/60 bg-white hover:border-accent hover:shadow-[0_2px_8px_rgba(232,157,71,0.08)] transition-all group text-center shadow-[0_1px_2px_rgba(15,23,42,0.01)]">
                  <div className="rounded-full bg-primary-50 p-2 text-primary-600 group-hover:bg-accent-50 group-hover:text-accent transition-colors shrink-0">
                    <ChevronRight size={14} />
                  </div>
                  <span className="text-[10px] font-bold text-primary-700 mt-1.5 leading-tight">More Actions</span>
                </button>
              </div>
            </Card>

          </div>

          {/* School Overview & Analytics (Bottom Charts) */}
          <Card>
            <div className="px-5 py-4 border-b border-primary-50 flex items-center justify-between">
              <h3 className="font-semibold text-primary-900 text-sm">School Overview</h3>
              <div className="flex items-center gap-1.5">
                <button
                  className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    selectedTerm === "Term 2" ? "bg-primary-900 text-white" : "text-primary-600 hover:bg-primary-50"
                  }`}
                  onClick={() => setSelectedTerm("Term 2")}
                >
                  Term 2
                </button>
                <button
                  className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    selectedTerm === "Full Year" ? "bg-primary-900 text-white" : "text-primary-600 hover:bg-primary-50"
                  }`}
                  onClick={() => setSelectedTerm("Full Year")}
                >
                  Full Year
                </button>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Chart 1: Enrollment Trend */}
                <div className="md:col-span-1 space-y-3">
                  <h4 className="text-xs font-bold text-primary-400 uppercase tracking-wider">Enrollment Trend</h4>
                  <div className="h-40 border-b border-l border-primary-100/60 relative">
                    <svg className="w-full h-full" viewBox="0 0 100 80" preserveAspectRatio="none">
                      <path
                        d="M 5,60 L 25,50 L 50,45 L 75,32 L 95,15"
                        fill="none"
                        stroke="#1E293B"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <circle cx="95" cy="15" r="4" fill="#E89D47" stroke="#1E293B" strokeWidth="2" />
                    </svg>
                    <div className="absolute left-1 top-1 text-[10px] font-bold text-primary-400">400</div>
                    <div className="absolute left-1 bottom-1 text-[10px] font-bold text-primary-400">0</div>
                  </div>
                  <div className="flex justify-between text-[10px] font-semibold text-primary-400 px-1">
                    <span>Jan</span>
                    <span>Mar</span>
                    <span>May</span>
                  </div>
                </div>

                {/* Chart 2: Attendance Overview Ring */}
                <div className="space-y-3 flex flex-col justify-between">
                  <h4 className="text-xs font-bold text-primary-400 uppercase tracking-wider">Attendance Overview</h4>
                  <div className="flex items-center justify-center relative py-2">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle cx="64" cy="64" r="48" stroke="#E2E8F0" strokeWidth="12" fill="transparent" />
                      <circle
                        cx="64"
                        cy="64"
                        r="48"
                        stroke="#10B981"
                        strokeWidth="12"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 48}
                        strokeDashoffset={2 * Math.PI * 48 * (1 - 0.948)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-xl font-bold text-primary-900">94.8%</span>
                      <span className="text-[9px] font-semibold text-primary-400 uppercase">Present</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-center text-[10px] font-semibold">
                    <div>
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-success-500 mr-1" />
                      <span className="text-primary-700">Present</span>
                    </div>
                    <div>
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-danger-500 mr-1" />
                      <span className="text-primary-700">Absent</span>
                    </div>
                    <div>
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-warning-500 mr-1" />
                      <span className="text-primary-700">Late</span>
                    </div>
                  </div>
                </div>

                {/* Chart 3: Fee Collection Ring */}
                <div className="space-y-3 flex flex-col justify-between">
                  <h4 className="text-xs font-bold text-primary-400 uppercase tracking-wider">Fee Collection</h4>
                  <div className="flex items-center justify-center relative py-2">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle cx="64" cy="64" r="48" stroke="#E2E8F0" strokeWidth="12" fill="transparent" />
                      <circle
                        cx="64"
                        cy="64"
                        r="48"
                        stroke="#3B82F6"
                        strokeWidth="12"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 48}
                        strokeDashoffset={2 * Math.PI * 48 * (1 - 0.692)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-lg font-bold text-primary-900 leading-none">KES 12.4M</span>
                      <span className="text-[9px] font-semibold text-primary-400 uppercase mt-0.5">Collected</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-center text-[10px] font-semibold">
                    <div>
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-info-500 mr-1" />
                      <span className="text-primary-700">Collected</span>
                    </div>
                    <div>
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-warning-500 mr-1" />
                      <span className="text-primary-700">Outstanding</span>
                    </div>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right Side Columns (Dashboard Sidebar Panel) */}
        <div className="space-y-6">
          
          {/* Upcoming Events Box */}
          <Card>
            <div className="px-5 py-4 border-b border-primary-50 flex items-center justify-between">
              <h3 className="font-semibold text-primary-900 text-sm">Upcoming Events</h3>
              <button className="text-xs font-semibold text-primary-500 hover:text-primary-700">
                View calendar
              </button>
            </div>
            <CardContent className="p-5 space-y-4">
              
              {/* Event 1 */}
              <div className="flex gap-3">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-primary-50/50 border border-primary-100/50 flex flex-col items-center justify-center text-primary-700">
                  <span className="text-[10px] font-bold uppercase leading-none">May</span>
                  <span className="text-base font-bold leading-tight mt-0.5">21</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-primary-900 truncate">Staff Meeting</p>
                  <p className="text-xs text-primary-400 mt-0.5">Tomorrow • 9:00 AM - 10:00 AM</p>
                </div>
              </div>

              {/* Event 2 */}
              <div className="flex gap-3">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-accent-50/50 border border-accent-100/50 flex flex-col items-center justify-center text-accent-700">
                  <span className="text-[10px] font-bold uppercase leading-none">May</span>
                  <span className="text-base font-bold leading-tight mt-0.5">24</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-primary-900 truncate">Parents Meeting</p>
                  <p className="text-xs text-primary-400 mt-0.5">May 24, 2026 • 2:00 PM</p>
                </div>
              </div>

              {/* Event 3 */}
              <div className="flex gap-3">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-danger-50/50 border border-danger-100/50 flex flex-col items-center justify-center text-danger-700">
                  <span className="text-[10px] font-bold uppercase leading-none">May</span>
                  <span className="text-base font-bold leading-tight mt-0.5">30</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-primary-900 truncate">Mid-Term Break Begins</p>
                  <p className="text-xs text-primary-400 mt-0.5">May 30 - June 6, 2026</p>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Notifications Center */}
          <Card>
            <div className="px-5 py-4 border-b border-primary-50 flex items-center justify-between">
              <h3 className="font-semibold text-primary-900 text-sm">Notifications</h3>
              <button className="text-[10px] font-bold text-primary-400 hover:text-primary-600 uppercase tracking-wider">
                Mark read
              </button>
            </div>
            <CardContent className="p-0">
              <div className="divide-y divide-primary-50/60">
                
                {/* Notif 1 */}
                <div className="p-4 flex gap-3 hover:bg-primary-50/40 transition-colors cursor-pointer">
                  <div className="h-2 w-2 rounded-full bg-success-500 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-primary-900">Payment received</p>
                    <p className="text-xs text-primary-500 mt-0.5 leading-relaxed">
                      James Karanja paid KES 25,000 for tuition fees.
                    </p>
                    <span className="text-[10px] text-primary-400 font-medium mt-1 block">12 mins ago</span>
                  </div>
                </div>

                {/* Notif 2 */}
                <div className="p-4 flex gap-3 hover:bg-primary-50/40 transition-colors cursor-pointer">
                  <div className="h-2 w-2 rounded-full bg-danger-500 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-primary-900">Attendance alert</p>
                    <p className="text-xs text-primary-500 mt-0.5 leading-relaxed">
                      18 students were marked absent today.
                    </p>
                    <span className="text-[10px] text-primary-400 font-medium mt-1 block">45 mins ago</span>
                  </div>
                </div>

                {/* Notif 3 */}
                <div className="p-4 flex gap-3 hover:bg-primary-50/40 transition-colors cursor-pointer">
                  <div className="h-2 w-2 rounded-full bg-info-500 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-primary-900">New admission</p>
                    <p className="text-xs text-primary-500 mt-0.5 leading-relaxed">
                      Mary Wanjiku has been admitted to Grade 8.
                    </p>
                    <span className="text-[10px] text-primary-400 font-medium mt-1 block">1 hour ago</span>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* System Status Panel */}
          <Card className="border-success-100/30 bg-success-50/10">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-full bg-success-50 p-1.5 text-success-500 shrink-0">
                <CheckCircle2 size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-success-700">All Systems Operational</p>
                <p className="text-[10px] text-success-600 mt-0.5 font-medium">Last checked: 2 mins ago</p>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

      {/* TODO: BACKEND INTEGRATION
       *
       * [ ] GET /api/v1/schools/:schoolId/dashboard/stats      – Returns Stats Row 1 & 2
       * [ ] GET /api/v1/schools/:schoolId/dashboard/activity   – Returns Recent Activity Feed
       * [ ] GET /api/v1/schools/:schoolId/dashboard/fees       – Returns Outstanding Fees by Class
       * [ ] GET /api/v1/schools/:schoolId/dashboard/overview   – Returns sparkline and donut chart metrics
       * [ ] GET /api/v1/schools/:schoolId/dashboard/events     – Returns Upcoming Events
       * [ ] GET /api/v1/schools/:schoolId/dashboard/notifs     – Returns active notification alerts
       */}
    </div>
  )
}
