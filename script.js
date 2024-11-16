function handleFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (!file) {
        alert("Por favor selecciona un archivo");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const datos_paquetes = converter(text);
        displayResults(datos_paquetes);
        enableDownload(datos_paquetes);
    };

    reader.readAsText(file);
}

function converter(text) {
    const datos_paquetes = [];
    const zip_code_pattern = /\b\d{5}(?:-\d{4})?\b|\b[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d\b/;
    const bloques = text.split("\n-------------------\n");

    bloques.forEach((bloque, contador) => {
        const datos = {};
        const lineas = bloque.split("\n");
        const zip_codes = bloque.match(zip_code_pattern) || [];

        lineas.forEach((linea, i) => {
            if (linea.includes("Origin")) {
                datos['Pickup Earliest*'] = lineas[i + 1].trim();
                datos["Pickup Latest"] = datos['Pickup Earliest*'];
                const origin_location = lineas[i + 2].trim();
                const [ciudad_origen, estado_origen] = separarCiudadEstado(origin_location);
                datos['Origin City*'] = ciudad_origen;
                datos['Origin State*'] = estado_origen;
                datos["Origin Postal Code"] = zip_codes[0];
            }
            if (linea.includes("Equipment Group Icon")) {
                const [length, typec] = carroType(lineas[i + 1].trim());
                datos["Length (ft)*"] = length;
                datos["Equipment*"] = typec;
            }
            if (linea.includes("Destination")) {
                const destination_data = lineas[i + 2].trim();
                const [ciudad_destino, estado_destino] = separarCiudadEstado(destination_data);
                datos['Destination City*'] = ciudad_destino;
                datos['Destination State*'] = estado_destino;
                datos["Destination Postal Code"] = zip_codes[1];
            }
            if (linea.includes("Weight (Lbs)")) {
                const string_con_formato = lineas[i + 1].trim();
                if (string_con_formato !== "Packaging Type") {
                    const numero_sin_formato = parseFloat(string_con_formato.replace(",", "").replace(/\.?0*$/, ""));
                    datos['Weight (lbs)*'] = String(Math.round(numero_sin_formato));
                }
            }
            if (linea.includes("Load #")) {
                const load = linea.split(" ")[1];
                datos['Load'] = load.slice(1);
            }
        });

        datos["Reference ID"] = `${contador + 1}`;
        datos["Commodity"] = "tbd";
        datos["Full/Partial*"] = "Full";
        datos["Use Private Network*"] = "no";
        datos["Private Network Rate"] = "";
        datos["Allow Private Network Booking"] = "no";
        datos["Allow Private Network Bidding"] = "no";
        datos["Use DAT Loadboard*"] = "yes";
        datos["DAT Loadboard Rate"] = "";
        datos["Allow DAT Loadboard Booking"] = "no";
        datos["Use Extended Network"] = "no";
        datos["Contact Method*"] = "email";
        datos["Comment"] = `EMAIL ME JESUS.VEGA@NTGFREIGHT.COM | LOAD ID=${contador + 1}`;

        datos_paquetes.push(datos);
    });

    return datos_paquetes;
}

function separarCiudadEstado(ubicacion) {
    const partes = ubicacion.split(",");
    return partes.length === 2 ? [partes[0].trim(), partes[1].trim()] : [null, null];
}

function carroType(eqp) {
    let length = 1;
    let typec = "V";
    if (eqp === "48FT Flatbed") {
        length = 48;
        typec = "F";
    } else if (eqp === "53FT Flatbed") {
        length = 53;
        typec = "F";
    } else if (eqp === "53FT Dry Van") {
        length = 53;
        typec = "V";
    }
    return [length, typec];
}

function displayResults(datos_paquetes) {
    const table = document.getElementById("resultTable");
    const headers = [
        "Pickup Earliest*", "Pickup Latest", "Length (ft)*", "Weight (lbs)*", "Full/Partial*",
        "Equipment*", "Use Private Network*", "Private Network Rate", "Allow Private Network Booking",
        "Allow Private Network Bidding", "Use DAT Loadboard*", "DAT Loadboard Rate",
        "Allow DAT Loadboard Booking", "Use Extended Network", "Contact Method*",
        "Origin City*", "Origin State*", "Origin Postal Code", "Destination City*",
        "Destination State*", "Destination Postal Code", "Comment", "Commodity", "Reference ID", "Load"
    ];

    // Clear previous results
    table.innerHTML = "";

    // Add headers
    const headerRow = document.createElement("tr");
    headers.forEach(header => {
        const th = document.createElement("th");
        th.textContent = header;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    // Add rows for each package
    datos_paquetes.forEach(paquete => {
        const row = document.createElement("tr");
        headers.forEach(header => {
            const td = document.createElement("td");
            td.textContent = paquete[header] || "";
            row.appendChild(td);
        });
        table.appendChild(row);
    });
}

function enableDownload(datos_paquetes) {
    const downloadButton = document.getElementById('downloadButton');
    downloadButton.style.display = 'inline-block';

    // Convert to CSV
    const csvContent = convertToCSV(datos_paquetes);
    const csvBlob = new Blob([csvContent], { type: 'text/csv' });
    const csvUrl = URL.createObjectURL(csvBlob);

    // Set download link
    downloadButton.onclick = function() {
        const link = document.createElement('a');
        link.href = csvUrl;
        link.download = 'resultados.csv';
        link.click();
    };
}

function convertToCSV(datos_paquetes) {
    const headers = [
        "Pickup Earliest*", "Pickup Latest", "Length (ft)*", "Weight (lbs)*", "Full/Partial*",
        "Equipment*", "Use Private Network*", "Private Network Rate", "Allow Private Network Booking",
        "Allow Private Network Bidding", "Use DAT Loadboard*", "DAT Loadboard Rate",
        "Allow DAT Loadboard Booking", "Use Extended Network", "Contact Method*",
        "Origin City*", "Origin State*", "Origin Postal Code", "Destination City*",
        "Destination State*", "Destination Postal Code", "Comment", "Commodity", "Reference ID", "Load"
    ];

    let csv = headers.join(',') + '\n';

    datos_paquetes.forEach(paquete => {
        const row = headers.map(header => paquete[header] || "").join(',');
        csv += row + '\n';
    });

    return csv