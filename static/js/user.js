function updateComments(element) {
	let currentCount = parseInt(element.getAttribute("data-comments"));
	currentCount++;
	element.setAttribute("data-comments", currentCount);
	element.textContent = currentCount; // Update tampilan

	// Kirim permintaan ke backend
	sendInteractionUpdate(element, "comment");
}

function updateRetweets(element) {
	let currentCount = parseInt(element.getAttribute("data-retweets"));
	currentCount++;
	element.setAttribute("data-retweets", currentCount);
	element.textContent = currentCount; // Update tampilan

	// Kirim permintaan ke backend
	sendInteractionUpdate(element, "retweet");
}

function updateLikes(element) {
	let currentCount = parseInt(element.getAttribute("data-likes"));
	currentCount++;
	element.setAttribute("data-likes", currentCount);
	element.textContent = currentCount; // Update tampilan

	// Kirim permintaan ke backend
	sendInteractionUpdate(element, "like");
}

function sendInteractionUpdate(element, interactionType) {
	const tweetId = element.closest(".tweet").getAttribute("data-tweet-id"); // Ambil ID tweet dari elemen terdekat

	fetch("/update_interaction", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: `tweet_id=${tweetId}&interaction_type=${interactionType}`,
	})
		.then((response) => {
			if (!response.ok) {
				throw new Error("Network response was not ok");
			}
		})
		.catch((error) => {
			console.error("Error:", error);
		});
}
