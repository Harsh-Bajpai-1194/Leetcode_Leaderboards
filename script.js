document.addEventListener('DOMContentLoaded', () => {
    // 1. Single Fetch for ALL data
    fetch('profiles.json')
        .then(response => {
            if (!response.ok) throw new Error("Failed to load JSON");
            return response.json();
        })
        .then(data => {
            // --- A. Update Last Updated Time ---
            if (data.last_updated) {
                document.getElementById('last-updated').innerText = `Last updated: ${data.last_updated}`;
            }

            // --- B. Populate Activity Feed ---
            const activityContent = document.getElementById('activity-content');
            if (data.activities && data.activities.length > 0) {
                let html = '<div style="text-align:left; width:100%;">';
                data.activities.forEach(act => {
                    html += `
                        <div style="margin-bottom:10px; border-bottom:1px solid #333; padding-bottom:5px;">
                            <span style="color:white; font-weight:bold;">${act.text}</span>
                            <br>
                            <span style="font-size:0.8em; color:#666;">${act.time}</span>
                        </div>`;
                });
                html += '</div>';
                activityContent.innerHTML = html;
            }

            // --- C. Populate Leaderboard Table ---
            const leaderboardBody = document.getElementById("leaderboard-body");
            leaderboardBody.innerHTML = ""; // Clear existing rows

            // Handle data structure (list vs object)
            const users = data.users ? data.users : data;

            // Sort by solved count (highest first)
            const sortedData = users.sort((a, b) => (b.total_solved || 0) - (a.total_solved || 0));

            sortedData.forEach((user, index) => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${user.name || user.username}</td>
                    <td style="font-weight: bold; color: #ffa116;">${user.total_solved || 0}</td>
                    <td>
                        <a href="${user.url}" target="_blank" style="text-decoration: none; color: #ffa116;">View</a>
                    </td>
                `;
                leaderboardBody.appendChild(tr);
            });
        })
        .catch(error => {
            console.error("Error loading data:", error);
            const leaderboardBody = document.getElementById("leaderboard-body");
            if (leaderboardBody) {
                leaderboardBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:red;">Error loading data. Please try again later.</td></tr>`;
            }
        });
});

// --- D. Global Search Function (Must be outside the event listener) ---
function filterTable() {
    // 1. Get what the user typed
    var input = document.getElementById("searchInput");
    var filter = input.value.toUpperCase();

    // 2. Get the table body
    var table = document.getElementById("leaderboard-body");
    var tr = table.getElementsByTagName("tr");

    // 3. Loop through all rows
    for (var i = 0; i < tr.length; i++) {
        // Get the Name cell (2nd column, index 1)
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
