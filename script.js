document.addEventListener("DOMContentLoaded", () => {

    // Get the table body, not the list
    const leaderboardBody = document.getElementById("leaderboard-body");

    // Updated data: 'score' is now 'questionsSolved'
    // I've added some sample numbers.
    const leaderboardData = [
        { name: "Harsh_Bajpai1", questionsSolved: 320, url: "https://leetcode.com/u/Harsh_Bajpai1/" },
        { name: "Hani_Dwivedi", questionsSolved: 150, url: "https://leetcode.com/u/Hani_Dwivedi/" },
        { name: "onyx_harsh", questionsSolved: 450, url: "https://leetcode.com/u/onyx_harsh/" },
        { name: "suryansh_singh_", questionsSolved: 510, url: "https://leetcode.com/u/suryansh_singh_/" },
        { name: "bh00mika", questionsSolved: 280, url: "https://leetcode.com/u/bh00mika/" },
        { name: "_shubhimishra_", questionsSolved: 410, url: "https://leetcode.com/u/_shubhimishra_/" }
    ];

    function displayLeaderboard() {
        leaderboardBody.innerHTML = ""; // Clear any old data

        // Sort by questionsSolved in descending order (highest first)
        const sortedData = leaderboardData.sort((a, b) => b.questionsSolved - a.questionsSolved);

        // Create a table row (tr) for each user
        sortedData.forEach((user, index) => {
            // 1. Create a new <tr> element
            const tr = document.createElement("tr");

            // 2. Set the inner HTML for the row with 4 <td> cells
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${user.name}</td>
                <td>${user.questionsSolved}</td>
                <td>
                    <a href="${user.url}" target="_blank" class="profile-button">View</a>
                </td>
            `;

            // 3. Append the new row to the table body
            leaderboardBody.appendChild(tr);
        });
    }

    // Initial display of the leaderboard when the page loads
    displayLeaderboard();
});