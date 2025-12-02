// JavaScript Example: Reading Entities
// Filterable fields: barcode_id, barcode_name, event_type, ip_address, city, country, region, latitude, longitude, device_type, os_name, browser_name, user_agent, screen_width, screen_height, language, timezone, referrer, isp, connection_type, device_vendor, device_model, os_version, browser_version, is_bot, session_id, utm_source, utm_medium, utm_campaign
async function fetchScanEntities() {
    const response = await fetch(`https://app.base44.com/api/apps/691f31070a39176d722b9d92/entities/Scan`, {
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
// Filterable fields: barcode_id, barcode_name, event_type, ip_address, city, country, region, latitude, longitude, device_type, os_name, browser_name, user_agent, screen_width, screen_height, language, timezone, referrer, isp, connection_type, device_vendor, device_model, os_version, browser_version, is_bot, session_id, utm_source, utm_medium, utm_campaign
async function updateScanEntity(entityId, updateData) {
    const response = await fetch(`https://app.base44.com/api/apps/691f31070a39176d722b9d92/entities/Scan/${entityId}`, {
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