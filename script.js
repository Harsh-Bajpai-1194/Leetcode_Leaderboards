document.addEventListener('DOMContentLoaded', () => {
    // 1. Fetch data from your Node.js Server (API) instead of the file
    fetch('http://localhost:5000/api/leaderboard')
        .then(response => {
            if (!response.ok) throw new Error("Failed to load API data");
            return response.json();
        })
        .then(data => {
            // 2. Get the table body
            const leaderboardBody = document.getElementById("leaderboard-body");
            leaderboardBody.innerHTML = ""; // Clear existing rows

            // 3. Sort by solved count (highest first)
            // The API sends the list directly, so 'data' IS the list of users
            const sortedData = data.sort((a, b) => (b.total_solved || 0) - (a.total_solved || 0));

            // 4. Loop through users and add them to the table
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
                leaderboardBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:red;">
                    Error: Ensure 'node server.js' is running!
                </td></tr>`;
            }
        });
});

// Search function (remains the same)
function filterTable() {
    var input = document.getElementById("searchInput");
    var filter = input.value.toUpperCase();
    var table = document.getElementById("leaderboard-body");
    var tr = table.getElementsByTagName("tr");

    for (var i = 0; i < tr.length; i++) {
        var td = tr[i].getElementsByTagName("td")[1];
        if (td) {
            var txtValue = td.textContent || td.innerText;
            if (txtValue.toUpperCase().indexOf(filter) > -1) {
                tr[i].style.display = "";
            } else {
                tr[i].style.display = "none";
            }
        }
    }
}