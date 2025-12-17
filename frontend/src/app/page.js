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
  const [jobRole, setJobRole] = useState("");
  const [resumeContext, setResumeContext] = useState(""); // Store resume text for interview context
  const fileInputRef = useRef(null);

  const [data, setData] = useState({
    applicationScore: 0,
    interviewScore: 0,
    scoreReasoning: "",
    summary: "",
    drawbacks: [],
    recommendations: [],
    keywordsMissing: [],
    savedQuestions: [],
    rawText: ""
  });

  const buildUIData = (atsResults, aiResults, finalScore) => {
    return {
      applicationScore: finalScore || 0,
      interviewScore: (aiResults?.atsScore || 0) * 10,
      scoreReasoning: aiResults?.scoreReasoning || "Score based on keyword matching and section completeness.",
      summary: aiResults?.summary || "No summary available.",

      // Dedicated Errors/Drawbacks
      drawbacks: [
        ...(atsResults?.missingSections || []).map(s => ({
          type: "Critical Missing Section",
          text: `Missing ${s} section`,
          recommendation: `Add a dedicated ${s} header.`
        })),
        ...(aiResults?.detailedAnalysis?.impactScore === "Low" ? [{
          type: "Weak Impact",
          text: "Bullet points lack quantification.",
          recommendation: "Add numbers (e.g., 'Improved X by Y%')."
        }] : []),
        ...(aiResults?.detailedAnalysis?.structureScore === "Low" ? [{
          type: "Formatting",
          text: "Resume structure is hard to read.",
          recommendation: "Use standard headers and consistent spacing."
        }] : []),
        ...(aiResults?.detailedAnalysis?.relevanceScore === "Low" ? [{
          type: "Relevance",
          text: "Resume content doesn't match the job role well.",
          recommendation: "Add more domain-specific keywords."
        }] : [])
      ],

      // Recommendations (Right Side)
      recommendations: aiResults?.bulletImprovements || [
        "Use active voice.",
        "Quantify achievements.",
        "Tailor to the job description."
      ],

      keywordsMissing: aiResults?.keywordSuggestions || [],

      savedQuestions: [
        { id: 1, question: `Why do you want to be a ${jobRole || "candidate"}?`, answer: null },
        { id: 2, question: "Tell me about a challenge you faced in your last project.", answer: null },
        { id: 3, question: "What is your biggest professional strength?", answer: null },
        { id: 4, question: "Where do you see yourself in 5 years?", answer: null },
      ],

      rawText: atsResults?.text || ""
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
    if (!jobRole.trim()) {
      setError("Please enter a job role before uploading.");
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
      setResumeContext(text);
      const { atsResults, aiResults } = await analyzeResume(text, jobRole);
      const { finalScore } = await scoreResume(atsResults, aiResults);

      const ui = buildUIData({ ...atsResults, text }, aiResults, finalScore);
      setData(ui);
      setView("dashboard");
    } catch (err) {
      console.error(err);
      setError("Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const [loadingAnswer, setLoadingAnswer] = useState(null);

  const handleGetAnswer = async (id, question) => {
    setLoadingAnswer(id);
    try {
      // Dynamically import to avoid circular dep issues if any, though standard import is fine usually
      const { getInterviewAnswer } = await import("../lib/api");
      const res = await getInterviewAnswer(question, resumeContext, jobRole);
      setData(prev => ({
        ...prev,
        savedQuestions: prev.savedQuestions.map(q => q.id === id ? { ...q, answer: res.answer } : q)
      }));
    } catch (e) {
      alert("Failed to get answer");
    } finally {
      setLoadingAnswer(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <motion.aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 p-6 z-10 hidden md:block">
        <div className="flex items-center gap-2 mb-12">
          <FileCheck className="w-6 h-6 text-emerald-500" />
          <h1 className="text-xl font-bold text-gray-900">ATS Analyzer</h1>
        </div>
        <nav className="space-y-2">
          <button onClick={() => setView("upload")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${view === 'upload' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-600'}`}>
            <Upload className="w-5 h-5" /> <span>Upload</span>
          </button>
          <button onClick={() => setView("dashboard")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${view === 'dashboard' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-600'}`}>
            <BarChart3 className="w-5 h-5" /> <span>Result Dashboard</span>
          </button>
        </nav>
      </motion.aside>

      <div className="md:ml-64 p-8 w-full">
        {view === "upload" && (
          <div className="max-w-2xl mx-auto mt-20">
            <h2 className="text-3xl font-bold mb-6">Check your ATS Score</h2>
            {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg mb-4">{error}</div>}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Job Role <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                placeholder="e.g. Software Engineer, Product Manager"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
            <div onClick={() => !analyzing && fileInputRef.current?.click()} className={`border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:bg-gray-50 cursor-pointer ${analyzing ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <input ref={fileInputRef} type="file" hidden accept=".pdf,.docx" onChange={handleFileSelect} disabled={analyzing} />
              {analyzing ? (
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="animate-pulse text-emerald-600 font-medium">Analyzing your resume against industry standards...</p>
                </div>
              ) : (
                <div>
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p>Click to Upload Resume</p>
                  <p className="text-sm text-gray-400 mt-2">PDF or DOCX</p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === "dashboard" && (
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">{jobRole} Analysis</h2>
                <p className="text-gray-500 mt-2 max-w-2xl">{data.summary}</p>
              </div>
              <div className="text-center bg-emerald-50 p-6 rounded-xl min-w-[150px]">
                <div className="text-5xl font-bold text-emerald-600">{data.applicationScore}</div>
                <div className="text-sm text-emerald-800 font-medium">ATS Score</div>
              </div>
            </div>

            {/* Reasoning Banner */}
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 text-blue-800">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Score Reasoning: </span>
                {data.scoreReasoning}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* LEFT: Drawbacks & Errors */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <TrendingDown className="text-red-500" /> Areas for Improvement
                </h3>

                <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm space-y-4">
                  {data.drawbacks && data.drawbacks.length > 0 ? data.drawbacks.map((item, i) => (
                    <div key={i} className="p-4 bg-red-50 rounded-xl border border-red-100">
                      <div className="flex items-center gap-2 mb-1">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="font-bold text-red-700">{item.type}</span>
                      </div>
                      <p className="text-gray-800 mb-2">{item.text}</p>
                      <div className="text-sm text-gray-600 bg-white p-2 rounded-lg border border-red-100">
                        <span className="font-semibold text-red-600">Fix:</span> {item.recommendation}
                      </div>
                    </div>
                  )) : <p className="text-gray-500 italic p-4">No critical errors found! Good job.</p>}

                  {/* Missing Keywords */}
                  {data.keywordsMissing.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-500" /> Missing Keywords
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {data.keywordsMissing.map((kw, i) => (
                          <span key={i} className="px-3 py-1 bg-amber-50 text-amber-800 rounded-full text-sm border border-amber-100">{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT: Recommendations & Corrections */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="text-emerald-500" /> Recommended Corrections
                </h3>

                <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm space-y-4">
                  {data.recommendations && data.recommendations.length > 0 ? data.recommendations.map((rec, i) => (
                    <div key={i} className="flex gap-4 p-4 hover:bg-emerald-50 transition-colors rounded-xl border border-transparent hover:border-emerald-100">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-600 font-bold text-sm">
                        {i + 1}
                      </div>
                      <p className="text-gray-700 leading-relaxed font-medium">{rec}</p>
                    </div>
                  )) : <p className="text-gray-500 italic p-4">Your bullets look strong!</p>}
                </div>
              </div>
            </div>

            {/* Interview Section */}
            <div className="pt-8 border-t border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Target className="w-6 h-6 text-indigo-600" /> Interactive Interview Prep
              </h3>
              <div className="grid grid-cols-1 gap-6">
                {data.savedQuestions.map((q) => (
                  <div key={q.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">{q.question}</h4>
                      <button
                        onClick={() => handleGetAnswer(q.id, q.question)}
                        disabled={loadingAnswer === q.id}
                        className="whitespace-nowrap px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
                      >
                        {loadingAnswer === q.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Generating...
                          </>
                        ) : (
                          <>
                            Get AI Answer <ChevronRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>

                    <AnimatePresence>
                      {q.answer && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-indigo-50/50 p-5 rounded-xl text-indigo-900 leading-relaxed border border-indigo-100"
                        >
                          <p className="font-semibold mb-2 text-indigo-700 text-xs uppercase tracking-wider">Suggested Answer Strategy</p>
                          <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap font-sans">
                            {q.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
