export const scoreResume = (req, res) => {
  const { atsResults, aiResults } = req.body;

  const missing = atsResults.missingSections.length;

  const sectionScore = 100 - missing * 15;
  const aiScore = aiResults.atsScore * 10;

  const finalScore = Math.round((sectionScore + aiScore) / 2);

  res.json({
    finalScore,
    breakdown: {
      sectionScore,
      aiScore
    }
  });
};
