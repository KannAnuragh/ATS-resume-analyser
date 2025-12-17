"use client";
import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, TrendingUp, TrendingDown, ChevronRight, X, BarChart3, Target, FileCheck } from "lucide-react";
import { uploadResume, analyzeResume, scoreResume } from "../lib/api";

const getSeverityColor = (severity) => {
  switch (severity) {
    case "success":
      return "bg-emerald-500";
    case "warning":
      return "bg-amber-500";
    case "error":
      return "bg-rose-500";
    default:
      return "bg-gray-400";
  }
};

const getSeverityIcon = (severity) => {
  switch (severity) {
    case "success":
      return <CheckCircle className="w-4 h-4" />;
    case "warning":
      return <AlertCircle className="w-4 h-4" />;
    case "error":
      return <XCircle className="w-4 h-4" />;
    default:
      return <AlertCircle className="w-4 h-4" />;
  }
};

export default function ATSDashboard() {
  const [view, setView] = useState("upload");
  const [selectedFile, setSelectedFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const [data, setData] = useState({
    applicationScore: 0,
    interviewScore: 0,
    applicationTrend: 0,
    interviewTrend: 0,
    corrections: [],
    balanceCorrections: [],
    weaknesses: [],
    savedQuestions: [],
    detailData: {
      score: 0,
      strengths: [],
      corrections: [],
      feedback: [],
      coverLetter: "",
    },
  });

  const buildUIData = (atsResults, aiResults, finalScore) => {
    const missing = atsResults?.missingSections || [];
    const sectionsFound = atsResults?.sectionsFound || {};
    const appScore = finalScore ?? 0;
    const interviewScore = Math.max(0, Math.min(100, Math.round((aiResults?.atsScore || 0) * 10)));

    const corrections = Object.keys(sectionsFound).map((s) => ({
      id: s,
      section: s[0].toUpperCase() + s.slice(1),
      severity: sectionsFound[s] ? "success" : "warning",
      count: sectionsFound[s] ? 1 : 0,
    }));

    const balanceCorrections = (aiResults?.keywordSuggestions || []).slice(0, 5).map((kw, i) => ({
      id: i + 1,
      section: kw,
      severity: "warning",
      count: 1,
    }));

    const weaknesses = [
      {
        title: "Application",
        name: "ATS",
        issue:
          "Missing sections: " + (missing.length ? missing.join(", ") : "None. Good coverage."),
        solutions: (aiResults?.keywordSuggestions || []).slice(0, 4),
      },
      {
        title: "Interview",
        name: "AI",
        issue: aiResults?.summary || "Add quantifiable achievements and industry keywords.",
        solutions: (aiResults?.bulletImprovements || []).slice(0, 4),
      },
      {
        title: "Overall",
        name: "Tips",
        issue: "Keep formatting simple; align content with JD.",
        solutions: [
          "Use action verbs",
          "Quantify impact",
          "Match keywords",
          "Avoid tables/icons",
        ],
      },
    ];

    const detailData = {
      score: appScore,
      strengths: Object.keys(sectionsFound)
        .filter((s) => sectionsFound[s])
        .map((s) => ({ text: s[0].toUpperCase() + s.slice(1), count: 1, type: "strength" })),
      corrections: missing.map((m) => ({ text: m[0].toUpperCase() + m.slice(1), count: 1, type: "warning" })),
      feedback: aiResults?.bulletImprovements?.length
        ? aiResults.bulletImprovements
        : [
            "Use action verbs and quantify achievements.",
            "Align bullet points with job description keywords.",
            "Ensure clear section headings and consistent formatting.",
          ],
      coverLetter:
        "Draft a concise cover letter tying your achievements to the role. Mention metrics and relevant keywords.",
    };

    return {
      applicationScore: appScore,
      interviewScore,
      applicationTrend: Math.max(0, Math.min(20, Math.round(appScore / 8))),
      interviewTrend: -Math.max(0, Math.min(20, Math.round((100 - interviewScore) / 8))),
      corrections,
      balanceCorrections,
      weaknesses,
      savedQuestions: [
        { id: 1, question: "Why this role?", active: true },
        { id: 2, question: "Why this company?", active: false },
        { id: 3, question: "Biggest achievement?", active: false },
      ],
      detailData,
    };
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (
      file.type !== "application/pdf" &&
      file.type !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      setError("Only PDF or DOCX files are supported.");
      return;
    }
    setSelectedFile(file);
    setError("");
    await handleAnalyze(file);
  };

  const handleAnalyze = async (file) => {
    try {
      setAnalyzing(true);
      const { text } = await uploadResume(file);
      const { atsResults, aiResults } = await analyzeResume(text, "");
      const { finalScore } = await scoreResume(atsResults, aiResults);
      const ui = buildUIData(atsResults, aiResults, finalScore);
      setData(ui);
      setView("dashboard");
    } catch (err) {
      console.error(err);
      setError("Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 p-6"
      >
        <div className="flex items-center gap-2 mb-12">
          <FileCheck className="w-6 h-6 text-emerald-500" />
          <h1 className="text-xl font-bold text-gray-900">ATS Resume Analysis</h1>
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => setView("upload")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              view === "upload" ? "bg-emerald-50 text-emerald-600" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Upload className="w-5 h-5" />
            <span className="font-medium">My State</span>
          </button>

          <button
            onClick={() => setView("dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              view === "dashboard" ? "bg-emerald-50 text-emerald-600" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="font-medium">Application Checker</span>
          </button>

          <button
            onClick={() => setView("detail")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              view === "detail" ? "bg-emerald-50 text-emerald-600" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Target className="w-5 h-5" />
            <span className="font-medium">Interview Prep</span>
          </button>
        </nav>

        <div className="absolute bottom-8 left-6 right-6">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-900 text-white">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center font-bold">M</div>
            <div className="flex-1">
              <div className="text-sm font-medium">MY RESUME</div>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="ml-64 p-8">
        <AnimatePresence mode="wait">
          {view === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Hi, Candidate!</h2>
                <p className="text-gray-600">Have a nice day :)</p>
              </div>

              {error && (
                <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm">
                  {error}
                </div>
              )}

              <motion.div whileHover={{ scale: 1.01 }} className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 rounded-2xl p-16 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group"
                >
                  {analyzing ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-emerald-200 rounded-full"></div>
                        <div className="absolute inset-0 w-16 h-16 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
                      </div>
                      <p className="text-lg font-medium text-gray-900">Analyzing your resume...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                        <Upload className="w-8 h-8 text-emerald-600 group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-900 mb-1"> Check Your ATS Score </p>
                        <p className="text-sm text-gray-500">Click to upload your resume (PDF or DOCX)</p>
                      </div>
                    </div>
                  )}
                </button>
              </motion.div>
            </motion.div>
          )}

          {view === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto"
            >
              <div className="mb-8 flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Hi, Candidate!</h2>
                  <p className="text-gray-600">Have a nice day :)</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-bold">C</div>
                  <span className="font-medium text-gray-900">You</span>
                </div>
              </div>

              <div className="mb-6 px-4 py-2 bg-white rounded-lg border border-gray-200 inline-block">
                <span className="text-gray-700"> Resume Details </span>
              </div>

              {/* Scores */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <motion.div whileHover={{ y: -4 }} className="bg-white rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-emerald-600" />
                      <h3 className="font-semibold text-gray-900">Application Score</h3>
                    </div>
                    <span className="text-2xl font-bold text-emerald-600">{data.applicationScore}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>11/20</span>
                      <span className="flex items-center gap-1 text-emerald-600">
                        {data.applicationTrend}% <TrendingUp className="w-3 h-3" />
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${data.applicationScore}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                      />
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gray-300" style={{ width: "55%" }} />
                    </div>
                  </div>
                </motion.div>

                <motion.div whileHover={{ y: -4 }} className="bg-white rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-900">Interview Score</h3>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">{data.interviewScore}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>12/21</span>
                      <span className="flex items-center gap-1 text-rose-600">
                        {Math.abs(data.interviewTrend)}% <TrendingDown className="w-3 h-3" />
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${data.interviewScore}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                      />
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gray-300" style={{ width: "57%" }} />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Corrections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Application Correction</h3>
                    <button className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700">
                      View <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {data.corrections.map((item, idx) => (
                      <motion.div
                        key={`${item.id}-${idx}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg ${getSeverityColor(item.severity)} bg-opacity-10 flex items-center justify-center`}>
                            <span className="font-bold text-gray-900">{item.count}</span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.section}</div>
                            <div className="text-xs text-gray-500">SEEDING</div>
                          </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full ${getSeverityColor(item.severity)} flex items-center justify-center text-white`}>
                          {getSeverityIcon(item.severity)}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Interview Correction</h3>
                    <button className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
                      View <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {data.balanceCorrections.map((item, idx) => (
                      <motion.div
                        key={`${item.id}-${idx}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg ${getSeverityColor(item.severity)} bg-opacity-10 flex items-center justify-center`}>
                            <span className="font-bold text-gray-900">{item.count}</span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.section}</div>
                            <div className="text-xs text-gray-500">BALANCE</div>
                          </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full ${getSeverityColor(item.severity)} flex items-center justify-center text-white`}>
                          {getSeverityIcon(item.severity)}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Weakness Areas */}
              <div className="mb-8">
                <h3 className="font-semibold text-gray-900 mb-4">Weakness Areas</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {data.weaknesses.map((weakness, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ y: -4 }}
                      className="bg-white rounded-xl p-6 border border-gray-200 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-bold">
                          {weakness.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{weakness.title}</div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-3 mb-4">{weakness.issue}</p>
                      <button className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                        <span>Solutions</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Saved Questions */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Saved Questions</h3>
                  <button className="text-sm text-emerald-600 hover:text-emerald-700">MORE +</button>
                </div>
                <div className="flex gap-4">
                  <button className="px-6 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors">Application</button>
                  <button className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors">Interview</button>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {data.savedQuestions.map((q) => (
                    <motion.div key={q.id} whileHover={{ scale: 1.02 }} className="bg-gray-100 rounded-xl p-4 relative">
                      <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                      </button>
                      <p className="text-sm text-gray-700 pr-6">{q.question}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {view === "detail" && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-5xl mx-auto"
            >
              <button onClick={() => setView("dashboard")} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
                <ChevronRight className="w-4 h-4 rotate-180" />
                <span>Back</span>
              </button>

              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Application Result</h2>
                <p className="text-gray-600">Have a nice day :)</p>
              </div>

              <div className="mb-6 px-4 py-2 bg-white rounded-lg border border-gray-200 inline-block">
                <span className="text-gray-700">Investment Banking</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Score Circle */}
                <div className="col-span-1 bg-white rounded-2xl p-6 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    Application Score
                  </h3>
                  <div className="flex items-center justify-center py-8">
                    <div className="relative w-48 h-48">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="96" cy="96" r="80" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                        <motion.circle
                          cx="96"
                          cy="96"
                          r="80"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="12"
                          strokeLinecap="round"
                          initial={{ strokeDasharray: "0 502" }}
                          animate={{ strokeDasharray: `${(data.detailData.score / 100) * 502} 502` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-5xl font-bold text-gray-900">{data.detailData.score}%</span>
                        <span className="text-sm text-gray-500">Intermediate</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 pt-4 border-t border-gray-100">
                    {data.detailData.feedback.map((text, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600 text-xs leading-relaxed">{text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Corrections & Strength */}
                <div className="col-span-2 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl p-6 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-4">Application Correction</h4>
                      <div className="space-y-3">
                        {data.detailData.corrections.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">{item.text}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">{item.count}</span>
                              <div className={`w-6 h-6 rounded-full ${item.type === "success" ? "bg-emerald-100" : item.type === "warning" ? "bg-amber-100" : "bg-blue-100"} flex items-center justify-center`}>
                                <span className="text-xs">✓</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-4">Strength</h4>
                      <div className="space-y-3">
                        {data.detailData.strengths.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">{item.text}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">{item.count}</span>
                              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                                <span className="text-xs">✓</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Searchability Section */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Searchability</h4>
                    <p className="text-sm text-gray-600 leading-relaxed mb-4">
                      Ensure keywords from the job description appear in your resume with clear section headings and consistent formatting.
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600 leading-relaxed">
                      {data.detailData.coverLetter}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
