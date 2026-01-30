// =========================
// DATA
// =========================

let INGREDIENTS = [];
let TAGS_BY_CATEGORY = {};

// =========================
// LOAD DATA
// =========================

async function loadIngredients() {
    const res = await fetch("data/ingredience.json");
    INGREDIENTS = await res.json();
}

async function loadTags() {
    const res = await fetch("data/tags.json");
    const tags = await res.json();

    TAGS_BY_CATEGORY = {};
    for (const tag of tags) {
        const cat = tag.tag_category;
        if (!TAGS_BY_CATEGORY[cat]) {
            TAGS_BY_CATEGORY[cat] = [];
        }
        TAGS_BY_CATEGORY[cat].push({
            id: String(tag.tag_id),
            name: tag.tag_name
        });
    }
}

// =========================
// TAG UI
// =========================

function renderTags(containerId = "tagContainer") {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";

    for (const [category, tags] of Object.entries(TAGS_BY_CATEGORY)) {
        const fieldset = document.createElement("fieldset");
        fieldset.className = "tag-category";

        const legend = document.createElement("legend");
        legend.textContent = category;
        fieldset.appendChild(legend);

        const grid = document.createElement("div");
        grid.className = "tag-grid";

        for (const tag of tags) {
            const label = document.createElement("label");
            label.className = "tag-item";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.name = "tags";
            checkbox.value = tag.id;

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(" " + tag.name));

            grid.appendChild(label);
        }

        fieldset.appendChild(grid);
        container.appendChild(fieldset);
    }
}

function getSelectedTags(form) {
    return Array.from(
        form.querySelectorAll('input[name="tags"]:checked')
    ).map(cb => cb.value);
}

// =========================
// RESULT RENDERING
// =========================

function renderResult(result) {
    const el = document.getElementById("result");
    el.innerHTML = "";

    if (!result) return;

    /* =========================
       HLAVIČKA – KONTEXT
       ========================= */

    const h2 = document.createElement("h2");
    h2.textContent = "Výsledek hledání";
    el.appendChild(h2);

    const ctx = document.createElement("p");
    ctx.innerHTML = `
        <strong>Prostředí:</strong> ${result.inputs.environment} |
        <strong>Sezóna:</strong> ${result.inputs.season}<br>
        <strong>Score:</strong> ${result.inputs.score},
        <strong>Hodiny:</strong> ${result.inputs.hours}
    `;
    el.appendChild(ctx);

    if (result.inputs.tags && result.inputs.tags.length > 0) {
        const tags = document.createElement("p");
        tags.innerHTML = `<strong>Tagy:</strong> ${result.inputs.tags.join(", ")}`;
        el.appendChild(tags);
    }

    /* =========================
       ZÁKLADNÍ SUROVINY
       ========================= */

    const raw = document.createElement("p");
    raw.innerHTML = `<strong>Základní suroviny:</strong> ${result.raw}`;
    el.appendChild(raw);

    /* =========================
       KONKRÉTNÍ NÁLEZY
       ========================= */

    const h3 = document.createElement("h3");
    h3.textContent = "Nalezené suroviny";
    el.appendChild(h3);

    const ul = document.createElement("ul");

    for (const [name, item] of Object.entries(result.ingredients)) {
        if (item.count <= 0) continue;

        const li = document.createElement("li");
        li.dataset.rarity = item.rarity;

        let text = `<strong>${name}</strong> × ${item.count}`;

        const details = [];
        if (item.mana) details.push(`mana: ${item.mana}`);
        if (item.suroviny) details.push(`suroviny: ${item.suroviny}`);
        if (item.rarity) details.push(`rarita: ${item.rarity}`);

        if (details.length > 0) {
            text += ` <em>(${details.join(", ")})</em>`;
        }

        li.innerHTML = text;

        if (item.usage) {
            const usage = document.createElement("div");
            usage.className = "usage";
            usage.textContent = item.usage;
            li.appendChild(usage);
        }

        ul.appendChild(li);
    }

    el.appendChild(ul);

    /* =========================
       KRITICKÝ NÁLEZ
       ========================= */

    if (result.rare) {
        const hr = document.createElement("hr");
        el.appendChild(hr);

        const h3c = document.createElement("h3");
        h3c.textContent = "Kritický nález";
        el.appendChild(h3c);

        const p = document.createElement("p");
        p.classList.add("critical");

        let text = `<strong>${result.rare.name}</strong>`;

        const critDetails = [];
        if (result.rare.mana) critDetails.push(`mana: ${result.rare.mana}`);
        if (result.rare.suroviny) critDetails.push(`suroviny: ${result.rare.suroviny}`);
        if (result.rare.rarity) critDetails.push(`rarita: ${result.rare.rarity}`);

        if (critDetails.length > 0) {
            text += ` <em>(${critDetails.join(", ")})</em>`;
        }

        p.innerHTML = text;

        if (result.rare.usage) {
            const usage = document.createElement("div");
            usage.className = "usage";
            usage.textContent = result.rare.usage;
            p.appendChild(usage);
        }

        el.appendChild(p);
    }
}

// =========================
// FORM HANDLER
// =========================

document.addEventListener("DOMContentLoaded", async () => {
    await Promise.all([
        loadIngredients(),
        loadTags()
    ]);

    renderTags();

    const form = document.getElementById("generatorForm");

    form.addEventListener("submit", e => {
        e.preventDefault();

        const data = new FormData(form);

        const score = safeFormInt(data.get("score"));
        const hours = safeFormInt(data.get("hours"));

        if (score === null || hours === null) {
            alert("Score i počet hodin musí být celé číslo ≥ 1.");
            return;
        }

        const critical = data.get("critical") !== null;
        const criticalFail = data.get("criticalFail") !== null;

        const selectedTags = getSelectedTags(form);

        const result = generate(
            INGREDIENTS,
            data.get("environment"),
            data.get("season"),
            score,
            hours,
            critical && !criticalFail,
            criticalFail,
            selectedTags
        );

        renderResult(result);
    });
});
