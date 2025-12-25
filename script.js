document.addEventListener("DOMContentLoaded", () => {
    const leaderboardBody = document.getElementById("leaderboard-body");
    const lastUpdatedElement = document.getElementById("last-updated");

    async function loadLeaderboard() {
        try {
            // Fetch the JSON data
            const response = await fetch('profiles.json');
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            // Get the Last-Modified date from HTTP headers
            const lastModified = response.headers.get('Last-Modified');
            if (lastModified) {
                const dateObj = new Date(lastModified);
                lastUpdatedElement.innerText = `Last updated: ${dateObj.toLocaleString()}`;
            }

            const leaderboardData = await response.json();
            displayLeaderboard(leaderboardData);
        } catch (error) {
            console.error("Failed to load leaderboard data:", error);
            leaderboardBody.innerHTML = `<tr><td colspan="4">Error loading leaderboard.</td></tr>`;
        }
    }

    function displayLeaderboard(data) {
        leaderboardBody.innerHTML = "";

        // SORT by total_solved (highest to lowest)
        const sortedData = data.sort((a, b) => (b.total_solved || 0) - (a.total_solved || 0));

        sortedData.forEach((user, index) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${user.name}</td>
                <td style="font-weight: bold; color: #ffa116;">${user.total_solved || 0}</td>
                <td>
                    <a href="${user.url}" target="_blank" class="profile-button">View</a>
                </td>
            `;
            leaderboardBody.appendChild(tr);
        });
    }

    loadLeaderboard();
});