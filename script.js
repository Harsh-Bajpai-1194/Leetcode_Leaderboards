document.addEventListener("DOMContentLoaded", () => {
    const leaderboardBody = document.getElementById("leaderboard-body");
    const leaderboardData = [
        { name: "Harsh_Bajpai1", url: "https://leetcode.com/u/Harsh_Bajpai1/" },
        { name: "Hani_Dwivedi", url: "https://leetcode.com/u/Hani_Dwivedi/" },
        { name: "onyx_harsh", url: "https://leetcode.com/u/onyx_harsh/" },
        { name: "suryansh_singh_", url: "https://leetcode.com/u/suryansh_singh_/" },
        { name: "bh00mika", url: "https://leetcode.com/u/bh00mika/" },
        { name: "_shubhimishra_", url: "https://leetcode.com/u/_shubhimishra_/" }
    ];

    function displayLeaderboard() {
        leaderboardBody.innerHTML = "";
        const sortedData = leaderboardData.sort((a, b) => b.questionsSolved - a.questionsSolved);
        sortedData.forEach((user, index) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${user.name}</td>
                <td>
                    <a href="${user.url}" target="_blank" class="profile-button">View</a>
                </td>
            `;

            leaderboardBody.appendChild(tr);
        });
    }
    displayLeaderboard();
});