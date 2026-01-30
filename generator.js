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

// =========================
// POOL LOGIC
// =========================

function buildPool(ingredients, environment, season, selectedTags) {
    const pool = [];
    const selectedTagSet = new Set(selectedTags || []);

    for (const row of ingredients) {

        const requiredTags = splitTags(row["required tag"]);
        const forbidTags   = splitTags(row["forbid tag"]);
        const specificTags = splitTags(row["specific tag"]);

        // 1️⃣ required tag – absolutní priorita
        let requiredOk = true;
        for (const tag of requiredTags) {
            if (!selectedTagSet.has(tag)) {
                requiredOk = false;
                break;
            }
        }
        if (!requiredOk) continue;

        // 2️⃣ forbid tag
        for (const tag of forbidTags) {
            if (selectedTagSet.has(tag)) continue;
        }
        if ([...forbidTags].some(t => selectedTagSet.has(t))) continue;
        if (forbidTags.has(environment)) continue;

        // 3️⃣ environment / season
        const envAny = String(row.environment).trim().toLowerCase() === "any";
        let envMatch = envAny || String(row.environment).includes(environment);
        const seasonMatch = String(row.season).includes(season);
        const specificMatch = [...specificTags].some(t => selectedTagSet.has(t));

        // specific + env → automaticky v poolu
        if (specificMatch && envMatch && !envAny) {
            pool.push(row);
            continue;
        }

        // specific nahrazuje environment
        if (specificMatch && (envAny || !envMatch)) {
            envMatch = true;
        }

        // 4️⃣ vážená šance vstupu
        let chance = 0.05;
        if (envMatch && seasonMatch) chance = 1.0;
        else if (envMatch || seasonMatch) chance = 0.30;

        if (Math.random() <= chance) {
            pool.push(row);
        }
    }

    // 5️⃣ fallback – min. 3 položky
    if (pool.length < 3) {
        const needed = 3 - pool.length;

        const fallback = ingredients.filter(row =>
            row.rarity !== "rare" &&
            (
                String(row.environment).trim().toLowerCase() === "any" ||
                String(row.environment).includes(environment)
            )
        );

        const existingNames = new Set(pool.map(r => r.name));
        const candidates = fallback.filter(r => !existingNames.has(r.name));

        while (pool.length < 3 && candidates.length > 0) {
            const idx = Math.floor(Math.random() * candidates.length);
            pool.push(candidates.splice(idx, 1)[0]);
        }
    }

    return pool;
}

//dočasný test

console.log(
  buildPool(
    ingredients,
    "forest",
    "jaro",
    ["herb"]
  )
);
