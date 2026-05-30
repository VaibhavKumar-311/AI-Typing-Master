export async function fetchParagraph(category, difficulty, url) {
    try {
        const response = await fetch(`${url}?category=${category}&difficulty=${difficulty}`);
        const data = await response.json();
        return data.text.trim();
    } catch (error) {
        console.error("Error fetching paragraph:", error);
        return "Placeholder text failed to load. Please check your connection.";
    }
}
