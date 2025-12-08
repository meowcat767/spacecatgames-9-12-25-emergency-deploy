document.addEventListener('DOMContentLoaded', function () {
    const statsContainer = document.getElementById('github-stats');
    const proxyUrl = 'https://corsproxy.io/?';
    const targetUrl = 'https://github.com/Starry-Systems/spacecatgames/pulse';

    fetch(proxyUrl + encodeURIComponent(targetUrl))
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Try to find the summary text
            // GitHub's structure for Pulse summary often looks like:
            // "Excluding merges, 3 authors have pushed..."
            // It's usually in a <div class="color-fg-muted"> or similar near the top of the pulse page.

            // Strategy: Look for the specific text pattern "additions and"
            const allDivs = doc.querySelectorAll('div');
            let summaryText = '';

            for (let div of allDivs) {
                // The pulse summary is often split into two sentences.
                // Sentence 1: "Excluding merges, X authors have pushed Y commits..."
                // Sentence 2: "On main, Z files have changed and there have been A additions and B deletions."
                if (div.textContent.includes('additions and') && div.textContent.includes('deletions')) {
                    summaryText = div.textContent.trim();
                    break;
                }
            }

            if (summaryText) {
                // Clean up whitespace
                summaryText = summaryText.replace(/\s+/g, ' ').trim();

                // Format it nicely
                statsContainer.innerHTML = `
                    <h3>GitHub Activity (Pulse)</h3>
                    <p>${summaryText}</p>
                    <small>Data fetched from GitHub Pulse</small>
                `;
            } else {
                throw new Error('Could not find summary text in page');
            }
        })
        .catch(error => {
            console.error('Error fetching GitHub stats:', error);
            // Fallback to API: Fetch contributors stats to sum up additions/deletions/commits
            fetch('https://api.github.com/repos/Starry-Systems/spacecatgames/stats/contributors')
                .then(r => r.json())
                .then(data => {
                    if (!Array.isArray(data)) throw new Error('Invalid API response');

                    let totalCommits = 0;
                    let totalAdditions = 0;
                    let totalDeletions = 0;

                    data.forEach(contributor => {
                        totalCommits += contributor.total;
                        contributor.weeks.forEach(week => {
                            totalAdditions += week.a;
                            totalDeletions += week.d;
                        });
                    });

                    statsContainer.innerHTML = `
                        <h3>Repository Stats</h3>
                        <p><strong>Total Commits:</strong> ${totalCommits.toLocaleString()}</p>
                        <p><strong>Additions:</strong> ${totalAdditions.toLocaleString()}</p>
                        <p><strong>Deletions:</strong> ${totalDeletions.toLocaleString()}</p>
                        <small><a href="https://github.com/Starry-Systems/spacecatgames" target="_blank">View on GitHub</a></small>
                    `;
                })
                .catch(apiError => {
                    console.error('API Fallback Error:', apiError);
                    statsContainer.innerHTML = '<p>Unable to load stats at this time.</p>';
                });
        });
});
