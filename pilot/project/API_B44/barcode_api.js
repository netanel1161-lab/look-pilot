// JavaScript Example: Reading Entities
// Filterable fields: name, secondary_name, business_name, campaign, creative, vehicle_id, plate_number, project, brand, target_link, transit_page_id, color, is_active, total_scans, notes, tags
async function fetchBarcodeEntities() {
    const response = await fetch(`https://app.base44.com/api/apps/691f31070a39176d722b9d92/entities/Barcode`, {
        headers: {
            // בסביבת שרת, המפתח ייקרא ממשתנה סביבה מאובטח
            'api_key': process.env.BASE44_API_KEY, // לדוגמה, בסביבת Node.js
            'Content-Type': 'application/json'
        }
    });
    const data = await response.json();
    console.log(data);
}

// JavaScript Example: Updating an Entity
// Filterable fields: name, secondary_name, business_name, campaign, creative, vehicle_id, plate_number, project, brand, target_link, transit_page_id, color, is_active, total_scans, notes, tags
async function updateBarcodeEntity(entityId, updateData) {
    const response = await fetch(`https://app.base44.com/api/apps/691f31070a39176d722b9d92/entities/Barcode/${entityId}`, {
        method: 'PUT',
        headers: {
            // בסביבת שרת, המפתח ייקרא ממשתנה סביבה מאובטח
            'api_key': process.env.BASE44_API_KEY, // לדוגמה, בסביבת Node.js
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
    });
    const data = await response.json();
    console.log(data);
}