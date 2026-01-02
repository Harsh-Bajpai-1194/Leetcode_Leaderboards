document.addEventListener("DOMContentLoaded", () => {
    const leaderboardBody = document.getElementById("leaderboard-body");
    const lastUpdatedElement = document.getElementById("last-updated");

    async function loadLeaderboard() {
        try {
            const response = await fetch('profiles.json');
            if (!response.ok) throw new Error("Failed to load JSON");

            const data = await response.json();

            // 1. Update the timestamp from JSON key
            if (data.last_updated) {
                lastUpdatedElement.innerText = `Last updated: ${data.last_updated}`;
            }

            // 2. Pass the user array to display function
            displayLeaderboard(data.users);
        } catch (error) {
            console.error("Error loading leaderboard:", error);
            leaderboardBody.innerHTML = `<tr><td colspan="4">Error loading data.</td></tr>`;
        }
    }

    function displayLeaderboard(users) {
        leaderboardBody.innerHTML = "";

        // Sort by solved count (highest first)
        const sortedData = users.sort((a, b) => (b.total_solved || 0) - (a.total_solved || 0));

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
    function filterTable() {
        // 1. Get what the user typed
        var input = document.getElementById("searchInput");
        var filter = input.value.toUpperCase();
        
        // 2. Get the table and all rows
        var table = document.getElementById("leaderboardBody"); // Make sure your tbody has this ID
        var tr = table.getElementsByTagName("tr");

        // 3. Loop through all rows
        for (var i = 0; i < tr.length; i++) {
            // Get the Name cell (usually the 2nd column, index 1)
            // Adjust index if your Name is in a different column!
            var td = tr[i].getElementsByTagName("td")[1]; 
            
            if (td) {
                var txtValue = td.textContent || td.innerText;
                
                // 4. Check if the name contains the search text
                if (txtValue.toUpperCase().indexOf(filter) > -1) {
                    tr[i].style.display = ""; // Show
                } else {
                    tr[i].style.display = "none"; // Hide
                }
            }
        }
    }
});
