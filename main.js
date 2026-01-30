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

    const h2 = document.createElement("h2");
    h2.textContent = "Výsledek hledání";
    el.appendChild(h2);

    const raw = document.createElement("p");
    raw.textContent = `Základní suroviny: ${result.raw}`;
    el.appendChild(raw);

    const ul = document.createElement("ul");

    for (const [name, item] of Object.entries(result.ingredients)) {
        if (item.count <= 0) continue;

        const li = document.createElement("li");
        li.innerHTML = `<strong>${name}</strong> × ${item.count}`;

        if (item.mana) {
            li.innerHTML += ` (mana: ${item.mana})`;
        }
        if (item.suroviny) {
            li.innerHTML += ` (suroviny: ${item.suroviny})`;
        }

        ul.appendChild(li);
    }

    el.appendChild(ul);

    if (result.rare) {
        const hr = document.createElement("hr");
        el.appendChild(hr);

        const crit = document.createElement("p");
        crit.innerHTML = `<strong>Kritický nález:</strong> ${result.rare.name}`;

        if (result.rare.mana) {
            crit.innerHTML += ` (mana: ${result.rare.mana})`;
        }
        if (result.rare.suroviny) {
            crit.innerHTML += ` (suroviny: ${result.rare.suroviny})`;
        }

        el.appendChild(crit);
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
