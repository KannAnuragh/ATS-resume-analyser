export const atsCheck = (text, jd = "") => {
  const lower = text.toLowerCase();

  const sections = {
    experience: lower.includes("experience"),
    skills: lower.includes("skills"),
    education: lower.includes("education"),
    projects: lower.includes("project"),
  };

  const missing = Object.keys(sections).filter((s) => !sections[s]);

  return {
    sectionsFound: sections,
    missingSections: missing
  };
};
