// JavaScript Example: Reading Entities
// Filterable fields: name, description, color, border_radius, landing_page_config, is_preset, preview_image
async function fetchQRTemplateEntities() {
    const response = await fetch(`https://app.base44.com/api/apps/691f31070a39176d722b9d92/entities/QRTemplate`, {
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
// Filterable fields: name, description, color, border_radius, landing_page_config, is_preset, preview_image
async function updateQRTemplateEntity(entityId, updateData) {
    const response = await fetch(`https://app.base44.com/api/apps/691f31070a39176d722b9d92/entities/QRTemplate/${entityId}`, {
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