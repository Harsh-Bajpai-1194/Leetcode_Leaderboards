document.addEventListener("DOMContentLoaded", () => {
    const leaderboardBody = document.getElementById("leaderboard-body");

    async function loadLeaderboard() {
        try {
            const response = await fetch('profiles.json');
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const leaderboardData = await response.json();
            displayLeaderboard(leaderboardData);
        } catch (error) {
            console.error("Failed to load leaderboard data:", error);
            leaderboardBody.innerHTML = `<tr><td colspan="3">Error loading leaderboard.</td></tr>`;
        }
    }

    function displayLeaderboard(data) {
        leaderboardBody.innerHTML = "";

        const sortedData = data.sort((a, b) => b.questionsSolved - a.questionsSolved);

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

    loadLeaderboard();
});