// Native fetch is available in Node.js 18+

const testInterviewAPI = async () => {
    const url = 'http://localhost:5000/api/interview';
    const payload = {
        question: "Why do you want this role?",
        resumeText: "Experienced Software Engineer with 5 years in Node.js and React. Led a team of 4 diverse engineers.",
        jobRole: "Senior Backend Developer"
    };

    try {
        console.log("Sending request to:", url);
        console.log("Payload:", payload);

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Response Success!");
        console.log("Answer:", data.answer);
    } catch (error) {
        console.error("Test Failed:", error.message);
    }
};

testInterviewAPI();
