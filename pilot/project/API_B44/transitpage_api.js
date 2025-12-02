// JavaScript Example: Reading Entities
// Filterable fields: name, delay_seconds, animation_type, background_color, primary_color, title, subtitle, logo_url, logo_text, show_countdown, show_skip_button, skip_button_text, footer_text, custom_css
async function fetchTransitPageEntities() {
    const response = await fetch(`https://app.base44.com/api/apps/691f31070a39176d722b9d92/entities/TransitPage`, {
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
// Filterable fields: name, delay_seconds, animation_type, background_color, primary_color, title, subtitle, logo_url, logo_text, show_countdown, show_skip_button, skip_button_text, footer_text, custom_css
async function updateTransitPageEntity(entityId, updateData) {
    const response = await fetch(`https://app.base44.com/api/apps/691f31070a39176d722b9d92/entities/TransitPage/${entityId}`, {
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