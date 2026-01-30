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

function weightedRandom(items, weights) {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;

    for (let i = 0; i < items.length; i++) {
        r -= weights[i];
        if (r <= 0) {
            return items[i];
        }
    }
    return items[items.length - 1];
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

// =========================
// PICK LOGIC
// =========================

function pickFromPool(pool, total, selectedTags) {
    const results = [];
    const foundCounts = {};
    const selectedTagSet = new Set(selectedTags || []);

    // Základní váhy podle rarity
    const RARITY_WEIGHT = {
        common: 1.0,
        uncommon: 0.35,
        rare: 0.12
    };

    // Ladicí konstanty
    const PEAK_STRENGTH = 3.0;
    const THIRD_MULTIPLIER = 1.2;
    const DECAY_RATE = 0.7;
    const SPECIFIC_BOOST = 1.6;

    for (let i = 0; i < total; i++) {
        const weights = [];

        for (const row of pool) {
            const name = row.name;
            const rarity = row.rarity;

            // 1️⃣ base váha podle rarity
            const base = RARITY_WEIGHT[rarity] ?? 0.1;
            let weight = base;

            // 2️⃣ specific tag boost (nejdřív!)
            const specificTags = splitTags(row["specific tag"]);
            for (const tag of specificTags) {
                if (selectedTagSet.has(tag)) {
                    weight *= SPECIFIC_BOOST;
                    break;
                }
            }

            // 3️⃣ opakování
            const count = foundCounts[name] || 0;

            if (count === 1) {
                // 2. nález – silný peak
                weight *= (1 + PEAK_STRENGTH * base);
            } else if (count === 2) {
                // 3. nález – stále bohaté místo
                weight *= THIRD_MULTIPLIER;
            } else if (count >= 3) {
                // útlum od 4.
                weight *= 1.0 / (1 + (count - 2) * DECAY_RATE);
            }

            weights.push(weight);
        }

        // vážený výběr
        const chosen = weightedRandom(pool, weights);
        results.push(chosen);

        foundCounts[chosen.name] = (foundCounts[chosen.name] || 0) + 1;
    }

    return results;
}


//dočasný test
const testPool = [
    { name: "A", rarity: "common", "specific tag": "" },
    { name: "B", rarity: "uncommon", "specific tag": "magic" },
    { name: "C", rarity: "rare", "specific tag": "" }
];

console.log(
    pickFromPool(testPool, 10, ["magic"])
);

