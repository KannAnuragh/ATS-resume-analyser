const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

export async function uploadResume(file) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Upload failed");
  }
  return res.json();
}

export async function analyzeResume(text, jobDescription = "") {
  const res = await fetch(`${BASE_URL}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, jobDescription }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Analysis failed");
  }
  return res.json();
}

export async function scoreResume(atsResults, aiResults) {
  const res = await fetch(`${BASE_URL}/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ atsResults, aiResults }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Scoring failed");
  }
  return res.json();
}
export async function getInterviewAnswer(question, resumeText, jobRole) {
  const res = await fetch(`${BASE_URL}/interview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, resumeText, jobRole }),
  });
  if (!res.ok) {
    throw new Error("Failed to get answer");
  }
  return res.json();
}
