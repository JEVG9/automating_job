import re, csv, os

def converter(text_file):

    with open(text_file, 'r', encoding='utf-8') as file:
        texto = file.read()
    
    datos_paquetes = []
    zip_code_pattern = r'\b\d{5}(?:-\d{4})?\b | \b[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d\b'
    contador = 1
    bloques = texto.split("\n-------------------\n")

    def separar_ciudad_estado(ubicacion):
        partes = ubicacion.split(",")
        if len(partes) == 2:
            ciudad = partes[0].strip()
            estado = partes[1].strip()
            return ciudad, estado
        else:
            return None, None  

    def carro_type(eqp:str):
        if eqp=="48FT Flatbed":
            length=48
            typec="F"
        elif eqp=="53FT Flatbed":
            length=53
            typec="F"
        elif eqp=="53FT Dry Van":
            length=53
            typec="V"
        else:
            length=1
            typec="V"
        return length,typec


    for bloque in bloques:
        datos = {}
        lineas = bloque.splitlines()
        zip_codes = re.findall(zip_code_pattern, bloque)
        
        for i, linea in enumerate(lineas):
            if "Origin" in linea:
                datos['Pickup Earliest*'] = lineas[i + 1].strip()
                datos["Pickup Latest"] = datos['Pickup Earliest*']
                origin_location = lineas[i + 2].strip()
                ciudad_origen, estado_origen = separar_ciudad_estado(origin_location)
                datos['Origin City*'] = ciudad_origen
                datos['Origin State*'] = estado_origen
                datos["Origin Postal Code"]=zip_codes[0]
            elif "Equipment Group Icon" in linea:
                datos["Length (ft)*"],datos["Equipment*"]=carro_type(lineas[i + 1].strip())
            elif "Destination" in linea:
                destination_data= lineas[i + 2].strip()
                ciudad_destino,estado_destino=separar_ciudad_estado(destination_data)
                datos['Destination City*']=ciudad_destino
                datos['Destination State*']=estado_destino
                datos["Destination Postal Code"]=zip_codes[1]
            elif "Weight (Lbs)" in linea:
                string_con_formato=lineas[i + 1].strip()
                if string_con_formato!="Packaging Type":
                    numero_sin_formato = float(string_con_formato.replace(",", "").rstrip("0").rstrip("."))
                datos['Weight (lbs)*'] = str(int(numero_sin_formato))
            elif "Load #" in linea:
                load = linea.split(" ")[1]
                datos['Load'] = load[1::]
                
            datos["Reference ID"]=f"{contador}"
            datos["Commodity"]="tbd"
            datos["Full/Partial*"]="Full"
            datos["Use Private Network*"]="no"
            datos["Private Network Rate"]=""
            datos["Allow Private Network Booking"]="no"
            datos["Allow Private Network Bidding"]="no"
            datos["Use DAT Loadboard*"]="yes"
            datos["DAT Loadboard Rate"]=""
            datos["Allow DAT Loadboard Booking"]="no"
            datos["Use Extended Network"]="no"
            datos["Contact Method*"]="email"
            datos["Comment"]=f"EMAIL ME JESUS.VEGA@NTGFREIGHT.COM | LOAD ID={contador}"

        contador+=1
        datos_paquetes.append(datos)

    orden_encabezados = [
        "Pickup Earliest*", "Pickup Latest", "Length (ft)*", "Weight (lbs)*", "Full/Partial*",
        "Equipment*", "Use Private Network*", "Private Network Rate", "Allow Private Network Booking",
        "Allow Private Network Bidding", "Use DAT Loadboard*", "DAT Loadboard Rate",
        "Allow DAT Loadboard Booking", "Use Extended Network", "Contact Method*",
        "Origin City*", "Origin State*", "Origin Postal Code", "Destination City*",
        "Destination State*", "Destination Postal Code", "Comment", "Commodity", "Reference ID","Load"
    ]

    csv_path = "/tmp/datos_paquetes.csv"
    with open(csv_path, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=orden_encabezados)
        writer.writeheader()
        for paquete in datos_paquetes:
            paquete_completo = {key: paquete.get(key, "") for key in orden_encabezados}
            writer.writerow(paquete_completo)
    
    return csv_path
