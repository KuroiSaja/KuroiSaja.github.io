let INGREDIENTS = [];

async function loadData() {
    const res = await fetch("data/ingredience.json");
    INGREDIENTS = await res.json();
}

function renderResult(result) {
    const el = document.getElementById("result");
    el.innerHTML = "";

    const h = document.createElement("h2");
    h.textContent = "Výsledek";
    el.appendChild(h);

    el.appendChild(document.createTextNode(
        `Základní suroviny: ${result.raw}`
    ));

    const ul = document.createElement("ul");
    for (const [name, item] of Object.entries(result.ingredients)) {
        const li = document.createElement("li");
        li.textContent = `${name} × ${item.count}`;
        ul.appendChild(li);
    }
    el.appendChild(ul);

    if (result.rare) {
        const r = document.createElement("p");
        r.textContent = `Kritický nález: ${result.rare.name}`;
        el.appendChild(r);
    }
}

document.getElementById("generatorForm").addEventListener("submit", async e => {
    e.preventDefault();

    if (!INGREDIENTS.length) {
        await loadData();
    }

    const data = new FormData(e.target);

    const score = safeFormInt(data.get("score"));
    const hours = safeFormInt(data.get("hours"));

    if (score === null || hours === null) {
        alert("Score i hodiny musí být ≥ 1");
        return;
    }

    const result = generate(
        INGREDIENTS,
        data.get("environment"),
        data.get("season"),
        score,
        hours,
        data.get("critical") !== null,
        data.get("criticalFail") !== null,
        []
    );

    renderResult(result);
});
