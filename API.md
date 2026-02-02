# Zorgstart API Documentatie

## Overzicht

Deze API stelt ziekenhuizen in staat om rechtstreeks ontslagbrieven te uploaden en zorgplannen te genereren via hun eigen EPD-systeem.

## Basis URL

```
https://api.zorgstart.be/v1
```

## Authenticatie

Alle API requests vereisen een API key in de header:

```
Authorization: Bearer YOUR_API_KEY
X-Hospital-Code: UZALTRIO
```

---

## Endpoints

### 1. Document Uploaden

**POST** `/documents/upload`

Upload een ontslagbrief voor verwerking.

#### Request Headers
```
Content-Type: multipart/form-data
Authorization: Bearer YOUR_API_KEY
X-Hospital-Code: UZALTRIO
```

#### Request Body
| Parameter | Type | Verplicht | Beschrijving |
|-----------|------|-----------|-------------|
| file | File | Ja | PDF, DOC, DOCX of TXT bestand |
| patient_insz | String | Ja | Rijksregisternummer (11 cijfers) |
| patient_name | String | Ja | Naam patient (Achternaam, Voornaam) |
| patient_dob | Date | Ja | Geboortedatum (YYYY-MM-DD) |
| department | String | Nee | Afdeling |
| discharge_date | Date | Nee | Ontslagdatum (YYYY-MM-DD) |
| specialist | String | Nee | Behandelend arts |

#### Response (200 OK)
```json
{
  "status": "success",
  "document_id": "DOC-2026020201",
  "patient_id": "UZALTRIO-44022612345",
  "processing_status": "queued"
}
```

#### Response (409 Conflict - Patient bestaat al)
```json
{
  "status": "conflict",
  "message": "Patient met dit INSZ bestaat al",
  "existing_patient": {
    "id": "UZALTRIO-44022612345",
    "name": "Janssens, Maria"
  },
  "action_required": "confirm_add_document"
}
```

---

### 2. Zorgplan Genereren

**POST** `/zorgplan/generate`

Genereer een zorgplan op basis van een geupload document.

#### Request Body
```json
{
  "document_id": "DOC-2026020201",
  "include_patient_version": true
}
```

#### Response (200 OK)
```json
{
  "status": "success",
  "zorgplan_id": "ZP-2026020201",
  "detected_problems": [
    {
      "nr": 1,
      "name": "Diabetes met verhoogd thuisrisico",
      "matched_terms": ["diabetes", "hypoglycemie"],
      "score": 2
    },
    {
      "nr": 2,
      "name": "Polyfarmacie & medicatieveiligheid",
      "matched_terms": ["polyfarmacie", "medicatie"],
      "score": 2
    }
  ],
  "recommended_providers": [
    "Huisarts",
    "POH/diabetesverpleegkundige",
    "Thuisverpleging",
    "Apotheker"
  ],
  "zorgplan_professional_url": "https://zorgstart.be/zp/ZP-2026020201/pro",
  "zorgplan_patient_url": "https://zorgstart.be/zp/ZP-2026020201/pat"
}
```

---

### 3. Patient Opzoeken

**GET** `/patients/{insz}`

Zoek een patient op basis van INSZ.

#### Response (200 OK)
```json
{
  "status": "found",
  "patient": {
    "id": "UZALTRIO-44022612345",
    "insz": "44.02.26-123.45",
    "name": "Janssens, Maria",
    "dob": "1944-02-26",
    "documents": 3,
    "last_zorgplan": "2026-02-01"
  }
}
```

#### Response (404 Not Found)
```json
{
  "status": "not_found",
  "message": "Patient niet gevonden"
}
```

---

### 4. Alle Patienten Ophalen

**GET** `/patients`

Haal alle patienten van het ziekenhuis op.

#### Query Parameters
| Parameter | Type | Beschrijving |
|-----------|------|-------------|
| page | Integer | Pagina nummer (default: 1) |
| limit | Integer | Aantal per pagina (default: 50, max: 200) |
| search | String | Zoek op naam of INSZ |

#### Response (200 OK)
```json
{
  "status": "success",
  "total": 127,
  "page": 1,
  "limit": 50,
  "patients": [
    {
      "id": "UZALTRIO-44022612345",
      "insz": "44.02.26-123.45",
      "name": "Janssens, Maria",
      "department": "Cardiologie",
      "discharge_date": "2026-02-01"
    }
  ]
}
```

---

### 5. Zorgplan Ophalen

**GET** `/zorgplan/{zorgplan_id}`

#### Response (200 OK)
```json
{
  "status": "success",
  "zorgplan": {
    "id": "ZP-2026020201",
    "patient_id": "UZALTRIO-44022612345",
    "created_at": "2026-02-02T14:30:00Z",
    "problems": [...],
    "providers": [...],
    "clinical_follow_up": "...",
    "education": "...",
    "monitoring": "..."
  }
}
```

---

## Error Codes

| Code | Beschrijving |
|------|-------------|
| 400 | Bad Request - Ongeldige parameters |
| 401 | Unauthorized - Ongeldige API key |
| 403 | Forbidden - Geen toegang tot deze resource |
| 404 | Not Found - Resource niet gevonden |
| 409 | Conflict - Patient bestaat al |
| 422 | Unprocessable Entity - Ongeldig INSZ |
| 429 | Too Many Requests - Rate limit bereikt |
| 500 | Internal Server Error |

---

## Rate Limiting

- 100 requests per minuut
- 10.000 requests per dag

---

## Voorbeeld: Python

```python
import requests

API_KEY = "your_api_key"
BASE_URL = "https://api.zorgstart.be/v1"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "X-Hospital-Code": "UZALTRIO"
}

# Document uploaden
with open("ontslagbrief.pdf", "rb") as f:
    response = requests.post(
        f"{BASE_URL}/documents/upload",
        headers=headers,
        files={"file": f},
        data={
            "patient_insz": "44022612345",
            "patient_name": "Janssens, Maria",
            "patient_dob": "1944-02-26",
            "department": "Cardiologie",
            "discharge_date": "2026-02-02"
        }
    )

print(response.json())
```

---

## Webhook Notificaties

Configureer een webhook URL om notificaties te ontvangen:

**POST** `YOUR_WEBHOOK_URL`

```json
{
  "event": "zorgplan.generated",
  "timestamp": "2026-02-02T14:35:00Z",
  "data": {
    "zorgplan_id": "ZP-2026020201",
    "patient_id": "UZALTRIO-44022612345",
    "detected_problems_count": 3
  }
}
```

---

## Contact

Voor API toegang en vragen:
- Email: api@zorgstart.be
- Telefoon: +32 14 XX XX XX
