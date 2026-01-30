// =========================
// HELPERS
// =========================

function safeInt(value) {
    if (value === null || value === undefined) return 0;
    if (value === "" || value === "nan") return 0;
    const n = parseInt(value, 10);
    return isNaN(n) ? 0 : n;
}

function safeFormInt(value, minValue = 1) {
    const n = parseInt(value, 10);
    if (isNaN(n) || n < minValue) return null;
    return n;
}

function rawSuroviny(score, hours) {
    return Math.max(score, 0) * hours;
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function concretePerHour(score) {
    if (score < 5) return 0;
    const tier = Math.floor((score - 5) / 5);
    return randomInt(1 + tier, 3 + tier);
}

function splitTags(cell) {
    if (!cell) return new Set();
    return new Set(
        String(cell)
            .toLowerCase()
            .split("|")
            .map(t => t.trim())
            .filter(t => t.length > 0)
    );
}
//dočasný test
console.log("TEST:", {
    raw: rawSuroviny(6, 3),
    perHour: concretePerHour(10),
    split: [...splitTags("forest|magic|rare")]
});
