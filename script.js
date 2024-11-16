document.getElementById("processButton").addEventListener("click", () => {
    const fileInput = document.getElementById("fileInput");
    const tableContainer = document.getElementById("tableContainer");

    if (!fileInput.files.length) {
        alert("Por favor, selecciona un archivo .txt.");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
        const content = event.target.result;
        const data = processFile(content);
        displayTable(data);
    };

    reader.readAsText(file);
});

function processFile(content) {
    const bloques = content.split("-------------------").filter(bloque => bloque.trim()); // Divide y elimina bloques vacíos
    const datosPaquetes = [];

    const zipCodePattern = /\b\d{5}(?:-\d{4})?\b|\b[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d\b/g;

    function separarCiudadEstado(ubicacion) {
        const partes = ubicacion.split(",");
        return partes.length === 2 ? [partes[0].trim(), partes[1].trim()] : [null, null];
    }

    function carroType(eqp) {
        if (eqp === "48FT Flatbed") return [48, "F"];
        if (eqp === "53FT Flatbed") return [53, "F"];
        if (eqp === "53FT Dry Van") return [53, "V"];
        return [1, "V"];
    }

    bloques.forEach((bloque, index) => {
        const datos = {
            "Pickup Earliest": "tbd",
            "Pickup Latest": "tbd",
            "Length (ft)": "tbd",
            "Weight (lbs)": "tbd",
            "Full/Partial": "Full",
            "Equipment": "tbd",
            "Use Private Network": "no",
            "Private Network Rate": "tbd",
            "Allow Private Network Booking": "no",
            "Allow Private Network Bidding": "no",
            "Use DAT Loadboard": "yes",
            "DAT Loadboard Rate": "tbd",
            "Allow DAT Loadboard Booking": "no",
            "Use Extended Network": "no",
            "Contact Method": "Both",
            "Origin City": "tbd",
            "Origin State": "tbd",
            "Origin Postal Code": "tbd",
            "Destination City": "tbd",
            "Destination State": "tbd",
            "Destination Postal Code": "tbd",
            "Comment": "N/A",
            "Commodity": "tbd",
            "Reference ID": index + 1,
            "Load": "tbd",
        };

        const lineas = bloque.split("\n").map(linea => linea.trim());
        const zipCodes = bloque.match(zipCodePattern);

        lineas.forEach((linea, i) => {
            if (linea.startsWith("Load #")) {
                datos["Load"] = linea.split(" ")[1] || "tbd";
            } else if (linea.startsWith("Origin")) {
                datos["Pickup Earliest"] = lineas[i + 1]?.trim() || "tbd";
                datos["Pickup Latest"] = datos["Pickup Earliest"];
                const [ciudadOrigen, estadoOrigen] = separarCiudadEstado(lineas[i + 2]?.trim());
                datos["Origin City"] = ciudadOrigen || "tbd";
                datos["Origin State"] = estadoOrigen || "tbd";
                datos["Origin Postal Code"] = zipCodes?.[0] || "tbd";
            } else if (linea.startsWith("Equipment Group Icon")) {
                [datos["Length (ft)"], datos["Equipment"]] = carroType(lineas[i + 1]?.trim() || "tbd");
            } else if (linea.startsWith("Destination")) {
                const [ciudadDestino, estadoDestino] = separarCiudadEstado(lineas[i + 2]?.trim());
                datos["Destination City"] = ciudadDestino || "tbd";
                datos["Destination State"] = estadoDestino || "tbd";
                datos["Destination Postal Code"] = zipCodes?.[1] || "tbd";
            } else if (linea.startsWith("Weight (Lbs)")) {
                const peso = lineas[i + 1]?.replace(",", "").trim();
                datos["Weight (lbs)"] = peso ? parseInt(peso, 10) : "tbd";
            }
        });

        datosPaquetes.push(datos);
    });

    return datosPaquetes;
}

function displayTable(data) {
    const ordenEncabezados = [
        "Pickup Earliest*", "Pickup Latest", "Length (ft)*", "Weight (lbs)*", "Full/Partial*",
        "Equipment*", "Use Private Network*", "Private Network Rate", "Allow Private Network Booking",
        "Allow Private Network Bidding", "Use DAT Loadboard*", "DAT Loadboard Rate",
        "Allow DAT Loadboard Booking", "Use Extended Network", "Contact Method*",
        "Origin City*", "Origin State*", "Origin Postal Code", "Destination City*",
        "Destination State*", "Destination Postal Code", "Comment", "Commodity", "Reference ID", "Load"
    ];

    const tableContainer = document.getElementById("tableContainer");
    tableContainer.innerHTML = ""; // Limpia contenido previo

    if (!data.length) {
        tableContainer.innerHTML = "<p>No se encontraron datos para mostrar.</p>";
        return;
    }

    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");

    // Crear encabezados en el orden especificado
    const tr = document.createElement("tr");
    ordenEncabezados.forEach((header) => {
        const th = document.createElement("th");
        th.textContent = header;
        tr.appendChild(th);
    });
    thead.appendChild(tr);

    // Crear filas en el orden especificado
    data.forEach((row) => {
        const tr = document.createElement("tr");
        ordenEncabezados.forEach((header) => {
            const td = document.createElement("td");
            td.textContent = row[header.replace("*", "")] || ""; // Remueve el asterisco para buscar claves en el objeto
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    tableContainer.appendChild(table);
}
